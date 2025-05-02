import express from 'express';
import bodyParser from 'body-parser';
import { userRouter } from './controllers/user.controller';

export const app = express();
app.use(bodyParser.json());
app.use('/users', userRouter);
