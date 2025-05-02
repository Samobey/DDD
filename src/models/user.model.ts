import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class UserModel extends Model {
  public id!: number;
  public email!: string;
  public name!: string;
  public createdAt!: Date;
}

UserModel.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: new DataTypes.STRING(128),
    allowNull: false,
  },
  name: {
    type: new DataTypes.STRING(128),
    allowNull: false,
  }
}, {
  sequelize,
  tableName: 'users',
});
