// ==============================================================================
// TataDana Real-Time Server Event Bus
// Synchronizes Telegram Webhook, AI Parsing, and Browser Dashboard via SSE
// ==============================================================================

export interface RealtimeServerEvent {
  id: string;
  timestamp: number;
  type: 'telegram_transaction' | 'new_transaction' | 'wallet_updated' | 'budget_updated' | 'ping';
  payload: any;
}

type EventListener = (event: RealtimeServerEvent) => void;

class RealtimeEventBus {
  private listeners: Set<EventListener> = new Set();
  private recentEvents: RealtimeServerEvent[] = [];

  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  broadcast(type: RealtimeServerEvent['type'], payload: any): RealtimeServerEvent {
    const event: RealtimeServerEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      timestamp: Date.now(),
      type,
      payload,
    };

    // Keep bounded history of latest 100 events
    this.recentEvents.unshift(event);
    if (this.recentEvents.length > 100) {
      this.recentEvents.pop();
    }

    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[RealtimeEventBus] Error dispatching event:', err);
      }
    });

    return event;
  }

  getRecentEvents(sinceTimestamp: number = 0): RealtimeServerEvent[] {
    return this.recentEvents.filter((e) => e.timestamp > sinceTimestamp);
  }
}

// Preserve singleton across Next.js Hot Module Replacement & production route handlers
const globalForEvents = globalThis as unknown as { tatadanaRealtimeBus?: RealtimeEventBus };
export const realtimeEventBus = globalForEvents.tatadanaRealtimeBus || new RealtimeEventBus();
if (!globalForEvents.tatadanaRealtimeBus) {
  globalForEvents.tatadanaRealtimeBus = realtimeEventBus;
}

