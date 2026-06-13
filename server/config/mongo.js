import { MongoClient } from 'mongodb';

let client;
let database;
let connectionPromise;

function getMongoConfig() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_LOG_DB_NAME || 'blogging_logs';
  const serverSelectionTimeoutMS = Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000);

  if (!uri) {
    return null;
  }

  return { uri, dbName, serverSelectionTimeoutMS };
}

export function isMongoLoggingConfigured() {
  return Boolean(getMongoConfig());
}

export async function getMongoLogDb() {
  const config = getMongoConfig();
  if (!config) {
    throw new Error('Missing MONGODB_URI in environment variables');
  }

  if (database) {
    return database;
  }

  if (!connectionPromise) {
    client = new MongoClient(config.uri, {
      serverSelectionTimeoutMS: config.serverSelectionTimeoutMS,
    });
    connectionPromise = client.connect();
  }

  await connectionPromise;
  database = client.db(config.dbName);
  return database;
}

export async function closeMongoLogDb() {
  if (client) {
    await client.close();
  }

  client = null;
  database = null;
  connectionPromise = null;
}
