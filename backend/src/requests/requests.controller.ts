import { Body, Controller, Get, Post, Param, UseGuards, Req } from "@nestjs/common";
import { RequestsService } from "./requests.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller()
export class RequestsController {
  constructor(private service: RequestsService) {}

  // USER: editör olma talebi
  @UseGuards(JwtAuthGuard)
  @Post("requests/become-editor")
  create(@Req() req: any) {
    return this.service.createBecomeEditorRequest(req.user.userId);
  }

  // USER: kendi taleplerim (home bildirim için)
  @UseGuards(JwtAuthGuard)
  @Get("requests/my")
  my(@Req() req: any) {
    return this.service.getMyRequests(req.user.userId);
  }

  // ADMIN: bekleyen talepler
  @UseGuards(JwtAuthGuard)
  @Get("admin/requests")
  listPending(@Req() req: any) {
    // admin kontrolünü servis zaten yapıyor, ama burada da yapacağız frontendde kolay olsun
    return this.service.listPending();
  }

  // ADMIN: onayla
  @UseGuards(JwtAuthGuard)
  @Post("admin/requests/:id/approve")
  approve(@Param("id") id: string, @Req() req: any) {
    return this.service.approve(id, req.user.userId);
  }

  // ADMIN: reddet
  @UseGuards(JwtAuthGuard)
  @Post("admin/requests/:id/reject")
  reject(@Param("id") id: string, @Req() req: any, @Body() body: { reason?: string }) {
    return this.service.reject(id, req.user.userId, body?.reason);
  }
}
