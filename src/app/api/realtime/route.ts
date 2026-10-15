import { NextRequest } from 'next/server';
import { realtimeEventBus } from '@/lib/realtime-events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection packet
      const initPayload = JSON.stringify({
        status: 'connected',
        timestamp: Date.now(),
        userId: userId || 'all',
      });
      controller.enqueue(encoder.encode(`event: connected\ndata: ${initPayload}\n\n`));

      // Subscribe to real-time events
      const unsubscribe = realtimeEventBus.subscribe((event) => {
        try {
          // Deliver if event is platform-wide or explicitly targets this user
          if (!event.payload?.userId || !userId || event.payload.userId === userId) {
            controller.enqueue(encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`));
          }
        } catch (e) {
          unsubscribe();
        }
      });

      // Keep-alive heartbeat ping every 15 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch (e) {
          clearInterval(pingInterval);
          unsubscribe();
        }
      }, 15000);

      // Clean up when client disconnects
      req.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        unsubscribe();
        try {
          controller.close();
        } catch (e) {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
