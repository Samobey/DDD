// config/appConfig.ts
import dotenv from "dotenv";

dotenv.config();

export default {
  dbUri: process.env.DB_URI as string,
};
