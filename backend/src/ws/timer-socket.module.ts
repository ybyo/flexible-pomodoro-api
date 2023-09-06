import { Module } from '@nestjs/common';

import { RedisModule } from '@/redis/redis.module';
import { RedisAuthService } from '@/redis/redis-auth.service';
import { TimerGateway } from '@/ws/timer.gateway';

@Module({
  imports: [RedisModule],
  providers: [TimerGateway, RedisAuthService],
})
export class TimerSocketModule {}
