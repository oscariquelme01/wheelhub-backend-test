import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from './user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

 async create(data: { name: string; email: string }) {
    const user = this.usersRepo.create(data);
    try {
      return await this.usersRepo.save(user);
    } catch (err: any) {
      // TypeORM QueryFailedError en SQLite
      if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('UNIQUE')) {
        throw new BadRequestException('Email already in use');
      }
      throw err; // otros errores
    }
  }

  async findAll(): Promise<User[]> {
    return this.usersRepo.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

async update(id: number, data: Partial<{ name: string; email: string; isActive?: boolean }>) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // Si el email viene en data, comprobamos que no exista otro usuario con ese email
    if (data.email) {
      const existing = await this.usersRepo.findOne({ where: { email: data.email } });
      if (existing && existing.id !== id) {
        throw new BadRequestException('Email already in use');
      }
    }

    Object.assign(user, data);
    return this.usersRepo.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepo.remove(user);
  }
}
