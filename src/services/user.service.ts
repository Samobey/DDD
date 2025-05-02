import { CreateUserDto } from '../dto/create-user.dto';
import { UserModel } from '../models/user.model';
import { UserMapper } from '../mappers/user.mapper';
import { User } from '../domain/user.entity';

export class UserService {
  async create(dto: CreateUserDto): Promise<User> {
    const created = await UserModel.create({...dto});
    return UserMapper.toDomain(created);
  }

  async findAll(): Promise<User[]> {
    const users = await UserModel.findAll();
    return users.map(UserMapper.toDomain);
  }
}
