import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../users/user-role.enum';
import { BadRequestException } from "@nestjs/common";
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // 🔥 ADMIN SEED
  async onModuleInit() {
    const admin = await this.usersService.findByUsername('admin');
    if (!admin) {
      const hash = await bcrypt.hash('admin123', 10);
      await this.usersService.create({
        username: 'admin',
        email: 'admin@admin.com',
        passwordHash: hash,
        role: UserRole.ADMIN,
        firstName: 'Admin',
        lastName: 'User',
        avatar: 'male',
      });
      console.log('✅ Admin user created (admin / admin123)');
    }
  }

  async login(username: string, password: string) {
    const user = await this.usersService.findByLogin(username);
    if (!user) throw new UnauthorizedException();

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException();

    const payload = { sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
  async register(dto: RegisterDto) {
    const existsUsername = await this.usersService.findByUsername(dto.username);
  if (existsUsername) throw new BadRequestException("Username already exists");

    const existsEmail = await this.usersService.findByEmail(dto.email);
  if (existsEmail) throw new BadRequestException("Email already exists");

    const hash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      username: dto.username,
      email: dto.email,
    passwordHash: hash,
      role: UserRole.USER,
      firstName: dto.firstName || dto.username,
      lastName: dto.lastName || '',
      avatar: dto.avatar || 'female',
  });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
    };
  }
}

