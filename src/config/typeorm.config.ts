import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/user.entity';

export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const isTest = process.env.NODE_ENV === 'test';

  return {
    type: 'sqlite',
    database: isTest ? ':memory:' : 'database.sqlite',
    entities: [User],
    synchronize: true,
    logging: false,
  };
};
