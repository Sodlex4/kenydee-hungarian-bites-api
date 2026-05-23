import app, { initApp } from './app.js';
import { config } from './config/env.js';

async function main() {
  try {
    await initApp();
    app.listen(config.port, () => {
      console.log(`[server] Hungarian Bites API running on http://localhost:${config.port}`);
      console.log(`[server] Health check: http://localhost:${config.port}/api/health`);
      console.log(`[server] Environment: ${config.nodeEnv}`);
    });
  } catch (err) {
    console.error('[server] Failed to start:', err);
    process.exit(1);
  }
}

main();
