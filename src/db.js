import { Pool } from "pg";
import { createClient } from "redis";

export const pgPool = new Pool({
  user: "user",
  host: "postgres",
  database: "events_demo",
  password: "password",
  port: 5432
});

export const redisClient = createClient({ url: "redis://redis:6379" });
await redisClient.connect();
