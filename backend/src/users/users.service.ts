import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./user.entity";
import { UserRole } from "./user-role.enum";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) { }

  findByUsername(username: string) {
    return this.repo.findOne({ where: { username } });
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  // login hem username hem email olabilir
  findByLogin(login: string) {
    return this.repo.findOne({
      where: [{ username: login }, { email: login }],
    });
  }

  create(user: Partial<User>) {
    return this.repo.save(user);
  }

  list() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async update(id: string, payload: Partial<User>) {
    await this.repo.update({ id }, payload);
    return this.findById(id);
  }

  async findById(id: string) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async setRole(id: string, role: UserRole) {
    await this.repo.update({ id }, { role });
    return this.findById(id);
  }

  async remove(id: string) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException("Kullanıcı bulunamadı");
    return this.repo.remove(user);
  }
}

