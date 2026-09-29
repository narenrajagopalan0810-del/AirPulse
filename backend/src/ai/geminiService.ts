import { GoogleGenAI, Type } from '@google/genai';
import { GeminiAnalysisResult, SourceType, SpoofSuspicion } from '../types/index.js';

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * Sanitizes user text to prevent prompt injection attempts.
   */
  private sanitizeInput(input?: string): string {
    if (!input) return '';
    return input.replace(/[<>{}\\]/g, '').slice(0, 500).trim();
  }

  /**
   * Evaluates multimodal evidence (image + text + optional audio) using Gemini 2.5 Flash.
   */
  async analyzeEvidence(
    imageBase64: string,
    mimeType: string = 'image/jpeg',
    userDescription?: string,
    userAudioBase64?: string,
    audioMimeType?: string,
    killGemini: boolean = false
  ): Promise<{ result: GeminiAnalysisResult; fallbackUsed: boolean; fallbackReason?: string }> {
    // Chaos killswitch or missing API key -> deterministic heuristic fallback
    if (killGemini || !this.ai || !process.env.GEMINI_API_KEY) {
      return this.deterministicFallback(
        userDescription,
        killGemini ? 'Chaos switch killGemini active' : 'GEMINI_API_KEY not configured'
      );
    }

    try {
      const sanitizedText = this.sanitizeInput(userDescription);

      const contents: any[] = [];

      // 1. Add Image Part
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType,
          data: cleanBase64
        }
      });

      // 2. Add Audio Part if provided (Vernacular Voice Report)
      if (userAudioBase64 && audioMimeType) {
        const cleanAudio = userAudioBase64.replace(/^data:audio\/\w+;base64,/, '');
        contents.push({
          inlineData: {
            mimeType: audioMimeType,
            data: cleanAudio
          }
        });
      }

      // 3. Prompt with System Instructions & Guidelines
      const promptText = `
You are the AI Scientific Evidence Inspector for AirPulse AI.
Analyze this submitted citizen pollution report.

Key Objectives:
1. Verify if this is an authentic outdoor pollution/emission image (smoke plume, industrial stack, crop stubble fire, open waste burning, construction dust).
2. Check for image spoofing: Screen moiré patterns, laptop/monitor borders, stock photos, indoor photos, or clean sky with no pollution. If suspected spoof or clean sky, set isValidPollutionImage to false and score appropriately.
3. Classify emission typology: INDUSTRIAL_STACK, WASTE_BURNING, CONSTRUCTION_DUST, STUBBLE, or UNCERTAIN.
4. Calculate visualEvidenceScore V in [0.0, 1.0] representing confidence and severity of physical emission evidence visible.
5. If audio or citizen notes are attached in Hindi, Tamil, or English: "${sanitizedText}", parse the description and provide summaries in English, Hindi, and Tamil.

Output strictly compliant JSON adhering to the defined schema.
`;
      contents.push({ text: promptText });

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isValidPollutionImage: { type: Type.BOOLEAN },
              visualEvidenceScore: { type: Type.NUMBER },
              sourceType: {
                type: Type.STRING,
                enum: ['INDUSTRIAL_STACK', 'WASTE_BURNING', 'CONSTRUCTION_DUST', 'STUBBLE', 'UNCERTAIN']
              },
              spoofSuspicion: {
                type: Type.STRING,
                enum: ['LOW', 'MEDIUM', 'HIGH']
              },
              visualContext: { type: Type.STRING },
              summary: {
                type: Type.OBJECT,
                properties: {
                  en: { type: Type.STRING },
                  hi: { type: Type.STRING },
                  ta: { type: Type.STRING }
                },
                required: ['en', 'hi', 'ta']
              }
            },
            required: [
              'isValidPollutionImage',
              'visualEvidenceScore',
              'sourceType',
              'spoofSuspicion',
              'visualContext',
              'summary'
            ]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response from Gemini');
      }

      const parsed = JSON.parse(responseText) as GeminiAnalysisResult;

      // Ensure clamped bounds
      parsed.visualEvidenceScore = Math.min(Math.max(parsed.visualEvidenceScore, 0.0), 1.0);
      if (!parsed.isValidPollutionImage) {
        parsed.visualEvidenceScore = 0.0;
      }

      return {
        result: parsed,
        fallbackUsed: false
      };
    } catch (err: any) {
      console.warn('Gemini analysis failed, triggering graceful heuristic fallback:', err?.message);
      return this.deterministicFallback(userDescription, `Gemini API error: ${err?.message || 'unknown'}`);
    }
  }

  /**
   * Deterministic fallback when Gemini is disabled, killed by chaos switch, or unreachable.
   */
  private deterministicFallback(
    userDescription?: string,
    reason?: string
  ): { result: GeminiAnalysisResult; fallbackUsed: boolean; fallbackReason: string } {
    const text = (userDescription || '').toLowerCase();

    let sourceType: SourceType = 'UNCERTAIN';
    let visualEvidenceScore = 0.65;

    if (text.includes('factory') || text.includes('stack') || text.includes('chimney') || text.includes('industrial')) {
      sourceType = 'INDUSTRIAL_STACK';
      visualEvidenceScore = 0.85;
    } else if (text.includes('garbage') || text.includes('waste') || text.includes('plastic') || text.includes('burn')) {
      sourceType = 'WASTE_BURNING';
      visualEvidenceScore = 0.80;
    } else if (text.includes('stubble') || text.includes('farm') || text.includes('field') || text.includes('parali')) {
      sourceType = 'STUBBLE';
      visualEvidenceScore = 0.88;
    } else if (text.includes('dust') || text.includes('construction') || text.includes('sand')) {
      sourceType = 'CONSTRUCTION_DUST';
      visualEvidenceScore = 0.60;
    }

    const fallbackResult: GeminiAnalysisResult = {
      isValidPollutionImage: true,
      visualEvidenceScore,
      sourceType,
      spoofSuspicion: 'LOW' as SpoofSuspicion,
      visualContext: `[Deterministic Fallback Heuristic] Classified based on keyword indicators: ${sourceType}. Visual evidence score calibrated to ${visualEvidenceScore}.`,
      summary: {
        en: `Suspected ${sourceType.replace('_', ' ').toLowerCase()} event reported. High priority visual corroboration active.`,
        hi: `संदिग्ध वायु प्रदूषण घटना की सूचना मिली है। साक्ष्य विश्लेषण सक्रिय है।`,
        ta: `சந்தேகத்திற்கிடமான காற்று மாசு நிகழ்வு பதிவாகியுள்ளது.`
      }
    };

    return {
      result: fallbackResult,
      fallbackUsed: true,
      fallbackReason: reason || 'AI service unavailable; deterministic heuristic applied'
    };
  }
}

export const geminiService = new GeminiService();
