// src/infrastructure/server/server.ts
import express from "express";
import postController from "../../adapters/controllers/postController";
import mongoose from "mongoose";

export const connect = async () => {
  try {
    await mongoose.connect(process.env.DB_URI as string);
    console.log('Database connected');
  } catch (error) {
    console.error('Database connection error', error);
    process.exit(1);
  }
};

const app = express();

connect();

app.use(express.json());
app.use(postController);

app.use((err: Error, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
