import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { GrpcClientsModule } from './clients/grpc-clients.module';
import { AuthResolver } from './graphql/auth.resolver';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      path: '/demo/auth/graphql',
      subscriptions: {
        'graphql-ws': true,
      },
    }),
    GrpcClientsModule,
  ],
  providers: [AuthResolver],
})
export class AppModule {}