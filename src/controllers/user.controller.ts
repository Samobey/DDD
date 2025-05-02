import express from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserService } from '../services/user.service';
import { UserResponseDto } from '../dto/user-response.dto';

export const userRouter = express.Router();
const userService = new UserService();

userRouter.post('/', async (req, res) => {
  const dto = plainToInstance(CreateUserDto, req.body);
  const errors = await validate(dto);
  if (errors.length) return res.status(400).json(errors);

  const user = await userService.create(dto);
  const response = plainToInstance(UserResponseDto, user);
  return res.status(201).json(response);
});

userRouter.get('/', async (_, res) => {
  const users = await userService.findAll();
  const response = users.map(user =>
    plainToInstance(UserResponseDto, user)
  );
  return res.json(response);
});
