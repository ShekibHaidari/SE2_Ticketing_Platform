import { createApp } from "./app";
import { pool } from "./config/db";
import { env } from "./config/env";
import { getRedisClient } from "./config/redis";
import { getRabbitChannel } from "./config/rabbitmq";

async function bootstrap() {
  await pool.query("SELECT 1");
  await getRedisClient();
  await getRabbitChannel();

  const app = createApp();

  app.listen(env.port, () => {
    console.log(
      `SE2 Ticketing Platform MVP running on port ${env.port} in ${env.nodeEnv} mode.`,
    );
  });
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap backend:", error);
  process.exit(1);
});
