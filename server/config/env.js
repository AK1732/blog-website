import 'dotenv/config';

export function getRequiredEnv(name) {
  const value = process.env[name];

  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function validateServerEnv() {
  const required = [
    'PORT',
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET',
  ];

  required.forEach(getRequiredEnv);

  const numeric = ['PORT', 'DB_PORT'];
  numeric.forEach((name) => {
    const value = Number(process.env[name]);
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`Environment variable ${name} must be a positive integer`);
    }
  });
}
