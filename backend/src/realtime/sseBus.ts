import { Response } from 'express';
import { ChaosState, IncidentReport } from '../types/index.js';

interface Client {
  id: string;
  res: Response;
}

export class SseBus {
  private clients: Map<string, Client> = new Map();

  addClient(id: string, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial handshake
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId: id, timestamp: new Date().toISOString() })}\n\n`);

    this.clients.set(id, { id, res });

    // Send heartbeat every 20s
    const heartbeatTimer = setInterval(() => {
      if (this.clients.has(id)) {
        res.write(`: heartbeat\n\n`);
      } else {
        clearInterval(heartbeatTimer);
      }
    }, 20000);

    res.on('close', () => {
      clearInterval(heartbeatTimer);
      this.clients.delete(id);
    });
  }

  broadcast(eventType: string, payload: any) {
    const data = `data: ${JSON.stringify({ type: eventType, payload, timestamp: new Date().toISOString() })}\n\n`;
    for (const [id, client] of this.clients.entries()) {
      try {
        client.res.write(data);
      } catch {
        this.clients.delete(id);
      }
    }
  }

  broadcastIncidentCreated(incident: IncidentReport) {
    this.broadcast('INCIDENT_CREATED', incident);
  }

  broadcastIncidentUpdated(incident: IncidentReport) {
    this.broadcast('INCIDENT_UPDATED', incident);
  }

  broadcastChaosToggled(chaosState: ChaosState) {
    this.broadcast('CHAOS_STATE_CHANGED', chaosState);
  }

  getActiveClientCount(): number {
    return this.clients.size;
  }
}

export const sseBus = new SseBus();
