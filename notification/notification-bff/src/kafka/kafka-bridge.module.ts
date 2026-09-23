import { Global, Injectable, Logger, Module, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PubSub } from 'graphql-subscriptions';
import { TOPICS } from '@demo/contracts';

export const PUB_SUB = 'PUB_SUB';

@Injectable()
export class KafkaBridgeService implements OnModuleInit {
  private readonly logger = new Logger(KafkaBridgeService.name);

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const kafka = new Kafka({
      clientId: 'demo-notification-bff-bridge',
      brokers: [this.config.get<string>('KAFKA_BROKER') ?? 'localhost:9092'],
    });

    const consumer: Consumer = kafka.consumer({ groupId: 'demo-notification-bff-bridge' });
    let attempts = 0;
    for (;;) {
      try {
        await consumer.connect();
        break;
      } catch (err) {
        attempts++;
        this.logger.log(`kafka bridge connect failed (attempt ${attempts}), retrying...`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    const topics = [TOPICS.NOTIFICATION_CREATED];
    await consumer.subscribe({ topics, fromBeginning: false });
    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const payload = JSON.parse((message.value ?? Buffer.from('{}')).toString());
          this.pubsub?.publish(topic, { topic, payload });
          this.logger.log(`bridged ${topic}`);
        } catch (err) {
          this.logger.error(`bridge ${topic} failed: ${(err as Error).message}`);
        }
      },
    });
    this.logger.log(`bridging ${topics.join(', ')} -> graphql subscriptions`);
  }

  private pubsub?: PubSub;

  setPubSub(pubsub: PubSub) {
    this.pubsub = pubsub;
  }
}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    KafkaBridgeService,
    {
      provide: PUB_SUB,
      useFactory: (bridge: KafkaBridgeService) => {
        const pubsub = new PubSub();
        bridge.setPubSub(pubsub);
        return pubsub;
      },
      inject: [KafkaBridgeService],
    },
  ],
  exports: [KafkaBridgeService, PUB_SUB],
})
export class KafkaBridgeModule {}