import app from './app.js';
import { config } from './config/env.js';

app.listen(config.port, () => {
  console.log(`[server] Hungarian Bites API running on http://localhost:${config.port}`);
  console.log(`[server] Health check: http://localhost:${config.port}/api/health`);
  console.log(`[server] Environment: ${config.nodeEnv}`);
});
