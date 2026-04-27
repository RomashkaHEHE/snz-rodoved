import { buildApp } from "./app.js";

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "127.0.0.1";

const app = await buildApp({
  logger: true
});

try {
  await app.listen({ port, host });
  app.log.info(`Rodoved API listening on http://${host}:${port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
