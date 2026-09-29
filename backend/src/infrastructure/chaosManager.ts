import { ChaosState } from '../types/index.js';
import { sseBus } from '../realtime/sseBus.js';

export class ChaosManager {
  private state: ChaosState = {
    killGemini: false,
    killOpenAQ: false,
    killWeather: false,
    killFirms: false
  };

  getState(): ChaosState {
    return { ...this.state };
  }

  toggleKillswitch(key: keyof ChaosState): ChaosState {
    if (key in this.state) {
      this.state[key] = !this.state[key];
      sseBus.broadcastChaosToggled(this.state);
    }
    return { ...this.state };
  }

  resetAll(): ChaosState {
    this.state = {
      killGemini: false,
      killOpenAQ: false,
      killWeather: false,
      killFirms: false
    };
    sseBus.broadcastChaosToggled(this.state);
    return { ...this.state };
  }
}

export const chaosManager = new ChaosManager();
