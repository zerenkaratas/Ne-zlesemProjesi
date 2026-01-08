import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Title } from "./title.entity";
import { CreateTitleDto } from "./dto/create-title.dto";
import { UpdateTitleDto } from "./dto/update-title.dto";
import { TitleKind } from "./title-kind.enum";
import { UsersService } from "../users/users.service";
import { UserRole } from "../users/user-role.enum";

@Injectable()
export class TitlesService {
  constructor(
    @InjectRepository(Title) private repo: Repository<Title>,
    private usersService: UsersService
  ) { }

  async list(kind?: "MOVIE" | "SERIES" | "ALL") {
    if (!kind || kind === "ALL") return this.repo.find({ order: { createdAt: "DESC" } });
    return this.repo.find({ where: { kind: kind as TitleKind }, order: { createdAt: "DESC" } });
  }

  async listByCreator(actorId: string) {
    return this.repo.find({ where: { createdById: actorId }, order: { createdAt: "DESC" } });
  }

  async create(dto: CreateTitleDto, actorId: string) {
    const actor = await this.usersService.findById(actorId);
    if (![UserRole.ADMIN, UserRole.EDITOR].includes(actor.role)) {
      throw new ForbiddenException("Sadece admin veya editör ekleyebilir.");
    }
    const t = this.repo.create({ ...dto, createdById: actorId } as any);
    return this.repo.save(t);
  }

  async update(id: string, dto: UpdateTitleDto, actorId: string) {
    const actor = await this.usersService.findById(actorId);
    if (![UserRole.ADMIN, UserRole.EDITOR].includes(actor.role)) {
      throw new ForbiddenException("Sadece admin veya editör güncelleyebilir.");
    }

    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new NotFoundException("Bulunamadı");

    // Editors can now update any title
    // if (actor.role === UserRole.EDITOR && t.createdById !== actorId) {
    //   throw new ForbiddenException('Sadece kendi eklediklerini güncelleyebilirsiniz.');
    // }

    Object.assign(t, dto);
    return this.repo.save(t);
  }

  async remove(id: string, actorId: string) {
    const actor = await this.usersService.findById(actorId);
    if (![UserRole.ADMIN, UserRole.EDITOR].includes(actor.role)) {
      throw new ForbiddenException("Sadece admin veya editör silebilir.");
    }

    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new NotFoundException("Bulunamadı");

    // Editors can now delete any title
    // if (actor.role === UserRole.EDITOR && t.createdById !== actorId) {
    //   throw new ForbiddenException('Sadece kendi eklediklerinizi silebilirsiniz.');
    // }

    await this.repo.remove(t);
    return { ok: true };
  }
}
