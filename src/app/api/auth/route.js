import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export async function POST(request) {
  const ratelimit = new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(5, "10 m"),
  });

  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return Response.json(
      { error: "Demasiados intentos. Intentá de nuevo en 10 minutos." },
      { status: 429 }
    );
  }

  return Response.json({ success: true });
}