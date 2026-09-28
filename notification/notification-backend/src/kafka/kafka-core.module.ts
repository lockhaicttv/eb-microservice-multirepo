import { Global, Inject, Module, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TOPICS } from '@demo/contracts';

export const KAFKA = Symbol('KAFKA');
export const KAFKA_PRODUCER = Symbol('KAFKA_PRODUCER');

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: KAFKA,
      useFactory: (config: ConfigService) =>
        new Kafka({
          clientId: 'demo-notification-backend',
          brokers: [config.get<string>('KAFKA_BROKER') ?? 'localhost:29092'],
        }),
      inject: [ConfigService],
    },
    {
      provide: KAFKA_PRODUCER,
      useFactory: (kafka: Kafka) => kafka.producer(),
      inject: [KAFKA],
    },
  ],
  exports: [KAFKA, KAFKA_PRODUCER],
})
export class KafkaCoreModule implements OnModuleInit {
  constructor(
    @Inject(KAFKA) private readonly kafka: Kafka,
    @Inject(KAFKA_PRODUCER) private readonly producer: Producer,
  ) {}

  async onModuleInit() {
    await this.createTopics();
    await this.connectWithRetry(() => this.producer.connect(), 'producer');
    this.producer.on('producer.connect', () => console.log('[Kafka] producer connected'));
  }

  private async createTopics() {
    await this.connectWithRetry(async () => {
      const admin = this.kafka.admin();
      await admin.connect();
      await admin.createTopics({
        waitForLeaders: true,
        topics: Object.values(TOPICS).map((topic) => ({ topic, numPartitions: 1, replicationFactor: 1 })),
      });
      await admin.disconnect();
      console.log(`[Kafka] topics ensured: ${Object.values(TOPICS).join(', ')}`);
    }, 'topics');
  }

  private async connectWithRetry(fn: () => Promise<void>, label: string): Promise<void> {
    let attempts = 0;
    for (;;) {
      try {
        await fn();
        return;
      } catch (err) {
        attempts++;
        console.log(`[Kafka] ${label} connect failed (attempt ${attempts}), retrying in 2s...`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }
}