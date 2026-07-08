import dotenv from "dotenv";

dotenv.config();

function getString(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getNumber(name: string, fallback: number) {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number.`);
  }

  return parsed;
}

export const env = {
  port: getNumber("PORT", 3000),
  nodeEnv: getString("NODE_ENV", "development"),
  databaseUrl: getString("DATABASE_URL", "postgres://ticketing_user:ticketing_password@localhost:5432/ticketing_db"),
  redisUrl: getString("REDIS_URL", "redis://localhost:6379"),
  rabbitmqUrl: getString("RABBITMQ_URL", "amqp://guest:guest@localhost:5672"),
  jwtSecret: getString("JWT_SECRET", "dev_secret_change_me"),
  reservationTtlSeconds: getNumber("RESERVATION_TTL_SECONDS", 600),
};
