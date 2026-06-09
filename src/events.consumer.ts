import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';
import { DEFAULT_DEMO_TOPIC, DEFAULT_SERVICE_NAME } from './kafka.constants';

@Controller()
export class EventsConsumer {
  @EventPattern(process.env.DEMO_TOPIC ?? DEFAULT_DEMO_TOPIC)
  handleDemoEvent(@Payload() payload: unknown, @Ctx() context: KafkaContext): void {
    const service = process.env.SERVICE_NAME ?? DEFAULT_SERVICE_NAME;
    console.log(`[${service}] consumed event from ${context.getTopic()}`, {
      partition: context.getPartition(),
      offset: context.getMessage().offset,
      payload
    });
  }
}

