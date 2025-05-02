import { IsEmail, IsString, Length } from 'class-validator';
import { IUser } from '../interfaces/user.interface';

export class CreateUserDto implements IUser {
  @IsString()
  @Length(2, 50)
  name!: string;

  @IsEmail()
  email!: string;
}
