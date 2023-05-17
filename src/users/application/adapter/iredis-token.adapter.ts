import Redis from 'ioredis';

export interface IRedisTokenAdapter {
  setValue: (key: string, value: string, duration?: number) => Promise<void>;
  getValue: (key: string) => Promise<string | null>;
  deleteValue: (key: string) => Promise<number>;
  getClient: () => Promise<Redis>;
}