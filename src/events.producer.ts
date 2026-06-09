import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { retryKafkaStartup } from './kafka-startup';
import { DEFAULT_DEMO_TOPIC, DEFAULT_SERVICE_NAME, KAFKA_CLIENT } from './kafka.constants';

@Injectable()
export class EventsProducer implements OnModuleInit {
  constructor(@Inject(KAFKA_CLIENT) private readonly client: ClientKafka) {}

  async onModuleInit(): Promise<void> {
    await retryKafkaStartup('connect producer', () => this.client.connect());
  }

  async publishDemoEvent() {
    const service = process.env.SERVICE_NAME ?? DEFAULT_SERVICE_NAME;
    const topic = process.env.DEMO_TOPIC ?? DEFAULT_DEMO_TOPIC;
    const payload = {
      service,
      message: 'demo event produced',
      createdAt: new Date().toISOString()
    };

    await firstValueFrom(this.client.emit(topic, payload));
    console.log(`[${service}] produced event on ${topic}`, payload);

    return { topic, payload };
  }
}
