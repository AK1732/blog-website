import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let client;
let connectingPromise;
let available = false;
let status = process.env.REDIS_URL ? 'disabled' : 'disabled';

function getClient() {
  if (!process.env.REDIS_URL) return null;
  if (client) return client;

  client = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS) || 1000,
      reconnectStrategy: false,
    },
  });

  client.on('error', (error) => {
    available = false;
    status = 'disabled';
    console.warn('Redis unavailable:', error.message);
  });

  client.on('connect', () => {
    console.log('Redis connecting...');
  });

  client.on('ready', () => {
    available = true;
    status = 'connected';
    console.log('Redis cache ready');
  });

  client.on('end', () => {
    available = false;
    status = 'disabled';
    console.warn('Redis connection closed');
  });

  return client;
}

export async function getRedisClient() {
  const redisClient = getClient();
  if (!redisClient) {
    available = false;
    status = 'disabled';
    return null;
  }

  if (available && redisClient.isOpen) return redisClient;

  if (!redisClient.isOpen && !connectingPromise) {
    connectingPromise = redisClient
      .connect()
      .catch((error) => {
        available = false;
        status = 'disabled';
        console.warn('Redis connection failed:', error.message);
        return null;
      })
      .finally(() => {
        connectingPromise = null;
      });
  }

  await connectingPromise;
  return available && redisClient.isOpen ? redisClient : null;
}

export function isRedisAvailable() {
  return available && client?.isOpen;
}

export function getRedisStatus() {
  return status;
}

export async function initializeRedis() {
  if (!process.env.REDIS_URL) {
    available = false;
    status = 'disabled';
    console.warn('Redis cache disabled: REDIS_URL is not set');
    return status;
  }

  const redisClient = await getRedisClient();
  if (redisClient) {
    status = 'connected';
    console.log('Redis connected');
  } else {
    status = 'disabled';
    console.warn('Redis skipped: cache will run disabled');
  }

  return status;
}
