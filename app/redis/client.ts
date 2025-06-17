import Redis from 'ioredis';

// Configuração do Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: () => 100,
  maxRetriesPerRequest: 3,
});

// Tratamento de erros
redis.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

export default redis; 