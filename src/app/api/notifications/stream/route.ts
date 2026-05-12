import { getToken } from "next-auth/jwt";
import { type NextRequest } from "next/server";
import { getRedisClient } from "@/lib/redis";

export const runtime = "edge";
export const maxDuration = 60;

type SessionToken = {
  id?: string;
  role?: string;
};

type RedisChannelMessage = {
  channel: string;
  message: string;
};

type RedisSubscriber = {
  on(type: "message", listener: (event: RedisChannelMessage) => void): void;
  on(type: "error", listener: (error: Error) => void): void;
  unsubscribe(channels?: string[]): Promise<void>;
  removeAllListeners(): void;
};

function sseHeaders() {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };
}

function encodeMessage(event: string, data: string) {
  return `event: ${event}\ndata: ${data}\n\n`;
}

export async function GET(request: NextRequest) {
  const token = (await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })) as SessionToken | null;

  if (!token?.id || !token.role) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");
  const sellerId = url.searchParams.get("sellerId");

  if (scope === "admin" && token.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const client = getRedisClient();

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
      let subscriber: RedisSubscriber | null = null;
      let closed = false;

      const write = (payload: string) => {
        if (!closed) {
          controller.enqueue(encoder.encode(payload));
        }
      };

      const cleanup = async () => {
        if (closed) {
          return;
        }
        closed = true;
        if (keepAliveTimer) {
          clearInterval(keepAliveTimer);
        }
        if (subscriber) {
          subscriber.removeAllListeners();
          await subscriber.unsubscribe().catch(() => undefined);
        }
        try {
          controller.close();
        } catch {}
      };

      write(": ping\n\n");

      keepAliveTimer = setInterval(() => {
        write(": keepalive\n\n");
      }, 30_000);

      if (client) {
        const channels = new Set<string>([`notifications:user:${token.id}`]);
        if (scope === "admin" && token.role === "admin") {
          channels.add("notifications:admin");
        }
        if (token.role === "seller" && sellerId) {
          channels.add(`notifications:seller:${sellerId}`);
        }

        const nextSubscriber = client.subscribe<string>([...channels]) as unknown as RedisSubscriber;
        subscriber = nextSubscriber;
        nextSubscriber.on("message", (event: RedisChannelMessage) => {
          if (!event || event instanceof Error) {
            return;
          }

          try {
            const payload = typeof event.message === "string" ? JSON.parse(event.message) : event.message;
            write(encodeMessage("notification", JSON.stringify(payload)));
          } catch {
            write(encodeMessage("notification", JSON.stringify(event.message)));
          }
        });
        nextSubscriber.on("error", () => {
          write(": keepalive\n\n");
        });
      }

      request.signal.addEventListener("abort", () => {
        void cleanup();
      });
    },
    cancel() {
      return undefined;
    },
  });

  return new Response(stream, {
    headers: sseHeaders(),
  });
}
