import { UserModel } from '../models/user.model';
import { User } from '../domain/user.entity';

export class UserMapper {
  static toDomain(model: UserModel): User {
    return new User(model.id, model.name, model.email, model.createdAt);
  }

  static toPersistence(entity: User): any {
    return {
      name: entity.name,
      email: entity.email
    };
  }
}
