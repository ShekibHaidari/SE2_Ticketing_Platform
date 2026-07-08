import { createClient } from "redis";
import { env } from "./env";

type RedisClient = ReturnType<typeof createClient>;

let client: RedisClient | null = null;
let connectPromise: Promise<RedisClient> | null = null;

export async function getRedisClient(): Promise<RedisClient> {
  if (client?.isOpen) {
    return client;
  }

  if (!connectPromise) {
    const nextClient: RedisClient = createClient({
      url: env.redisUrl,
    });

    nextClient.on("error", (error) => {
      console.error("Redis error:", error);
    });

    connectPromise = nextClient.connect().then(() => {
      client = nextClient;
      return nextClient;
    });
  }

  return connectPromise;
}
