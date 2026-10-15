import { createApp } from './app';
import { env } from './config/env';
import { connectDB } from './config/db';

async function bootstrap() {
  try {
    // Connect to MongoDB
    await connectDB();

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(`[Planner API] Running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      console.log(`[Planner API] Allowed Client Origin: ${env.CLIENT_ORIGIN}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n[Planner API] Received ${signal}. Gracefully shutting down...`);
      server.close(() => {
        console.log('[Planner API] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('[Planner API] Fatal error during startup:', err);
    process.exit(1);
  }
}

bootstrap();
