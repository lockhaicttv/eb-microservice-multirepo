import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { GrpcClientsModule } from './clients/grpc-clients.module';
import { KafkaBridgeModule } from './kafka/kafka-bridge.module';
import { NotificationResolver } from './graphql/notification.resolver';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      path: '/demo/notification/graphql',
      subscriptions: {
        'graphql-ws': true,
      },
    }),
    GrpcClientsModule,
    KafkaBridgeModule,
  ],
  providers: [NotificationResolver],
})
export class AppModule {}