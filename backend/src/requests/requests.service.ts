import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EditorRequest, RequestStatus } from "./editor-request.entity";
import { UsersService } from "../users/users.service";
import { UserRole } from "../users/user-role.enum";

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(EditorRequest) private repo: Repository<EditorRequest>,
    private usersService: UsersService
  ) {}

  async createBecomeEditorRequest(userId: string) {
    const user = await this.usersService.findById(userId);

    if (user.role === UserRole.EDITOR || user.role === UserRole.ADMIN) {
      throw new BadRequestException("Zaten editör yetkin var.");
    }

    const existingPending = await this.repo.findOne({
      where: { requestedBy: { id: userId }, status: RequestStatus.PENDING } as any,
    });
    if (existingPending) {
      throw new BadRequestException("Zaten beklemede bir talebin var.");
    }

    const req = this.repo.create({
      requestedBy: user,
      status: RequestStatus.PENDING,
      reviewedBy: null,
    });

    return this.repo.save(req);
  }

  async getMyRequests(userId: string) {
    return this.repo.find({
      where: { requestedBy: { id: userId } } as any,
      order: { createdAt: "DESC" },
    });
  }

  async listPending() {
    return this.repo.find({
      where: { status: RequestStatus.PENDING },
      order: { createdAt: "ASC" },
    });
  }

  async approve(requestId: string, adminId: string) {
    const req = await this.repo.findOne({ where: { id: requestId } });
    if (!req) throw new NotFoundException("Talep bulunamadı.");

    if (req.status !== RequestStatus.PENDING) {
      throw new BadRequestException("Bu talep artık beklemede değil.");
    }

    const admin = await this.usersService.findById(adminId);
    if (admin.role !== UserRole.ADMIN) {
      throw new BadRequestException("Sadece admin onaylayabilir.");
    }

    // kullanıcı rolünü editör yap
    await this.usersService.setRole(req.requestedBy.id, UserRole.EDITOR);

    req.status = RequestStatus.APPROVED;
    req.reviewedBy = admin;

    return this.repo.save(req);
  }

  async reject(requestId: string, adminId: string, reason?: string) {
    const req = await this.repo.findOne({ where: { id: requestId } });
    if (!req) throw new NotFoundException("Talep bulunamadı.");

    if (req.status !== RequestStatus.PENDING) {
      throw new BadRequestException("Bu talep artık beklemede değil.");
    }

    const admin = await this.usersService.findById(adminId);
    if (admin.role !== UserRole.ADMIN) {
      throw new BadRequestException("Sadece admin reddedebilir.");
    }

    req.status = RequestStatus.REJECTED;
    req.reviewedBy = admin;
    req.rejectReason = reason ?? null;

    return this.repo.save(req);
  }
}
