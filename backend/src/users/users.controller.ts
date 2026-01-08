import { Body, Controller, Get, Patch, Req, UseGuards, Param, ForbiddenException, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from './user-role.enum';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) { }

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Req() req: any) {
    const actor = await this.usersService.findById(req.user.userId);
    if (actor.role !== UserRole.ADMIN) throw new ForbiddenException('Yalnızca admin görebilir.');

    const users = await this.usersService.list();
    return users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      avatar: u.avatar,
      role: u.role,
      createdAt: u.createdAt,
    }));
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const actor = await this.usersService.findById(req.user.userId);

    // Allow admin OR the user themselves
    if (actor.role !== UserRole.ADMIN && actor.id !== id) {
      throw new ForbiddenException('Yalnızca admin veya hesap sahibi güncelleyebilir.');
    }

    // If role change requested, use setRole to ensure validation
    if (body.role) {
      if (actor.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Rol değiştirme yetkiniz yok.');
      }
      await this.usersService.setRole(id, body.role);
    }

    const allowed = {
      firstName: body.firstName,
      lastName: body.lastName,
      avatar: body.avatar,
    };

    // Remove undefined keys
    Object.keys(allowed).forEach(key => allowed[key] === undefined && delete allowed[key]);

    // Only call update if there are fields to update
    let updated;
    if (Object.keys(allowed).length > 0) {
      updated = await this.usersService.update(id, allowed as any);
    } else {
      updated = await this.usersService.findById(id);
    }

    return {
      id: updated.id,
      username: updated.username,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      avatar: updated.avatar,
      role: updated.role,
      createdAt: updated.createdAt,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const actor = await this.usersService.findById(req.user.userId);
    if (actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Yalnızca admin kullanıcı silebilir.');
    }
    return this.usersService.remove(id);
  }
}
