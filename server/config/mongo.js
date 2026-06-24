import { MongoClient } from 'mongodb';

let client;
let database;
let connectionPromise;
let status = 'disabled';

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

export function getMongoLogStatus() {
  return status;
}

export async function initializeMongoLogs() {
  const config = getMongoConfig();
  if (!config) {
    status = 'disabled';
    console.warn('MongoDB logs disabled: MONGODB_URI is not set');
    return status;
  }

  try {
    const db = await getMongoLogDb();
    await db.command({ ping: 1 });
    status = 'connected';
    console.log(`MongoDB logs connected: ${config.dbName}`);
  } catch (error) {
    status = 'disabled';
    connectionPromise = null;
    database = null;
    client = null;
    console.warn(`MongoDB logs skipped: ${error.message}`);
  }

  return status;
}

export async function getMongoLogDb() {
  const config = getMongoConfig();
  if (!config) {
    status = 'disabled';
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
  status = 'connected';
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
