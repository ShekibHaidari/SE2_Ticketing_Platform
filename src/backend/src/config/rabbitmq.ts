import amqp from "amqplib";
import { env } from "./env";

type RabbitConnection = Awaited<ReturnType<typeof amqp.connect>>;
type RabbitChannel = Awaited<ReturnType<RabbitConnection["createChannel"]>>;

let connection: RabbitConnection | null = null;
let channel: RabbitChannel | null = null;
let initPromise: Promise<RabbitChannel | null> | null = null;

const QUEUE_NAME = "ticketing.events";

async function createChannel(): Promise<RabbitChannel | null> {
  try {
    const nextConnection = await amqp.connect(env.rabbitmqUrl);
    nextConnection.on("error", (error: Error) => {
      console.warn("RabbitMQ connection error:", error.message);
      channel = null;
      connection = null;
      initPromise = null;
    });

    const nextChannel = await nextConnection.createChannel();
    await nextChannel.assertQueue(QUEUE_NAME, { durable: true });
    connection = nextConnection;
    channel = nextChannel;
    return nextChannel;
  } catch (error) {
    console.warn("RabbitMQ unavailable. Continuing without async messaging.");
    return null;
  }
}

export async function getRabbitChannel(): Promise<RabbitChannel | null> {
  if (channel) {
    return channel;
  }

  if (!initPromise) {
    initPromise = createChannel();
  }

  return initPromise;
}

export async function publishEvent(
  eventName: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  const activeChannel = await getRabbitChannel();

  if (!activeChannel) {
    console.warn(`Skipping RabbitMQ publish for ${eventName}.`);
    return false;
  }

  const body = JSON.stringify({
    eventName,
    payload,
    occurredAt: new Date().toISOString(),
  });

  activeChannel.sendToQueue(QUEUE_NAME, Buffer.from(body), {
    persistent: true,
  });

  return true;
}
