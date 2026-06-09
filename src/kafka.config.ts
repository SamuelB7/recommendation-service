import { Transport } from '@nestjs/microservices';
import type { ClientProviderOptions, MicroserviceOptions } from '@nestjs/microservices';
import { DEFAULT_SERVICE_NAME, KAFKA_CLIENT } from './kafka.constants';

const brokers = () => (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',');
const serviceName = () => process.env.SERVICE_NAME ?? DEFAULT_SERVICE_NAME;
const kafkaRetry = () => ({
  retries: Number(process.env.KAFKA_RETRIES ?? 10),
  initialRetryTime: Number(process.env.KAFKA_INITIAL_RETRY_TIME_MS ?? 300)
});

export const kafkaMicroserviceOptions = (): MicroserviceOptions => ({
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: process.env.KAFKA_CLIENT_ID ?? serviceName(),
      brokers: brokers(),
      retry: kafkaRetry()
    },
    consumer: {
      groupId: process.env.KAFKA_CONSUMER_GROUP_ID ?? `${serviceName()}-demo-group`
    }
  }
});

export const kafkaClientProvider = (): ClientProviderOptions => ({
  name: KAFKA_CLIENT,
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: `${process.env.KAFKA_CLIENT_ID ?? serviceName()}-producer`,
      brokers: brokers(),
      retry: kafkaRetry()
    },
    consumer: {
      groupId: `${process.env.KAFKA_CONSUMER_GROUP_ID ?? `${serviceName()}-demo-group`}-producer`
    }
  }
});
