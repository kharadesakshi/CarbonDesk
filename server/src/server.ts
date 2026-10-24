import dotenv from 'dotenv';
import app from './app';
import { sequelize } from './models';
import { getEnvConfig } from './utils/env';

dotenv.config();

// Validate environment configuration on startup
const envConfig = getEnvConfig();

async function start() {
  try {
    console.log('[DB] Testing database connection...');
    await sequelize.authenticate();
    console.log('[DB] Connected successfully.');

    console.log('[DB] Running migrations...');
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('[DB] Migrations complete.');

    app.listen(envConfig.PORT, () => {
      console.log(`[Server] CarbonDesk CPMS API listening on http://localhost:${envConfig.PORT}`);
      console.log(`[Server] Health check: http://localhost:${envConfig.PORT}/health`);
    });
  } catch (err) {
    console.error('[Boot] Failed to start server:', err);
    process.exit(1);
  }
}

start();
