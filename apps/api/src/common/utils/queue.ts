import { Queue } from "bullmq";
import IORedis from "ioredis";

export const redis = new IORedis({
  host: process.env.REDIS_HOST ?? "localhost",
  port: parseInt(process.env.REDIS_PORT ?? "6379"),
  maxRetriesPerRequest: null,
});

export const ingestionQueue = new Queue("document-ingestion", { connection: redis });
