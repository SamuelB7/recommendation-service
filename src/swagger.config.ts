import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DEFAULT_SERVICE_NAME } from './kafka.constants';

export function setupSwagger(app: INestApplication): void {
  const serviceName = process.env.SERVICE_NAME ?? DEFAULT_SERVICE_NAME;
  const config = new DocumentBuilder()
    .setTitle(serviceName)
    .setDescription('Boilerplate NestJS service with Kafka demo events.')
    .setVersion('0.1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}

