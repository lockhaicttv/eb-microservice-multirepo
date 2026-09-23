import { Consumer, EachMessagePayload, Kafka } from 'kafkajs';

export interface ConsumerBinding {
  groupId: string;
  topics: string[];
  consumer: Consumer;
  disconnect: () => Promise<void>;
}

export async function createConsumer(
  kafka: Kafka,
  app: string,
  groupId: string,
  topics: string[],
  onMessage: (payload: EachMessagePayload) => Promise<void>,
): Promise<ConsumerBinding> {
  const consumer = kafka.consumer({ groupId: `${app}-${groupId}` });
  let attempts = 0;
  for (;;) {
    try {
      await consumer.connect();
      break;
    } catch (err) {
      attempts++;
      console.log(`[Kafka] consumer ${groupId} connect failed (attempt ${attempts}), retrying...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  await consumer.subscribe({ topics, fromBeginning: true });
  await consumer.run({
    eachMessage: async (payload) => {
      try {
        await onMessage(payload);
      } catch (err) {
        console.error(`[Kafka] consumer ${groupId} handler error:`, (err as Error).message);
      }
    },
  });
  return { groupId, topics, consumer, disconnect: () => consumer.disconnect() };
}