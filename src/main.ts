import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { GatewayAccessGuard, RMQ_QUEUES } from '@justkel/shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalGuards(new GatewayAccessGuard());

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: RMQ_QUEUES.HOSPITAL_AUDIT_LOG,
      queueOptions: {
        durable: true,
      },
      socketOptions: {
        heartbeatIntervalInSeconds: 5,
        reconnectTimeInSeconds: 5,
      },
    },
  });

  await app.startAllMicroservices();

  const port = process.env.PORT || 3002;
  await app.listen(port);
  app.enableCors({
    origin: '*',
  });
  console.log(`Audit Service running on http://localhost:${port}/graphql`);
}
bootstrap();
