import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { demoProtoPath, PACKAGE_NAME } from '@demo/contracts';

async function bootstrap() {
  const url = process.env.GRPC_URL ?? '0.0.0.0:5104';
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: PACKAGE_NAME,
      protoPath: demoProtoPath(),
      url,
      loader: {
        keepCase: false,
        longs: Number,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    },
  });
  await app.listen();
  Logger.log(`gRPC payment backend listening on ${url}`, 'Bootstrap');
}
bootstrap();