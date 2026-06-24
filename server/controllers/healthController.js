import { checkPostgresConnection } from '../config/database.js';
import { getMongoLogStatus } from '../config/mongo.js';
import { getRedisStatus } from '../config/redis.js';

export async function getHealth(req, res) {
  let postgres = 'connected';

  try {
    await checkPostgresConnection();
  } catch {
    postgres = 'failed';
  }

  res.status(postgres === 'connected' ? 200 : 503).json({
    server: 'ok',
    postgres,
    mongoLogs: getMongoLogStatus(),
    redis: getRedisStatus(),
  });
}
