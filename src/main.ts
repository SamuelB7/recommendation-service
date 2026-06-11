import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { kafkaMicroserviceOptions } from './kafka.config';
import { retryKafkaStartup } from './kafka-startup';
import { setupSwagger } from './swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true
    })
  );
  app.connectMicroservice(kafkaMicroserviceOptions());
  await retryKafkaStartup('start microservices', () => app.startAllMicroservices());
  setupSwagger(app);

  const port = Number(process.env.HTTP_PORT ?? 3000);
  await app.listen(port);
  console.log(`[${process.env.SERVICE_NAME ?? 'recommendation-service'}] listening on port ${port}`);
}

void bootstrap();
