declare module 'lib/redis' {
  import { Redis } from '@upstash/redis';
  const redis: Redis;
  export default redis;
}
