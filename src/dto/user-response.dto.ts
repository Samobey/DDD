import { IUser } from '../interfaces/user.interface';

export class UserResponseDto implements IUser {
    id!: number;
    name!: string;
    email!: string;
  }
  