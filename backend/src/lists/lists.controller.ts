import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ListsService } from "./lists.service";
import { ListType } from "./list-type.enum";

@Controller("lists")
@UseGuards(JwtAuthGuard)
export class ListsController {
  constructor(private service: ListsService) {}

  @Get()
  myLists(@Req() req: any, @Query("kind") kind?: "MOVIE" | "SERIES" | "ALL") {
    return this.service.getMyLists(req.user.userId, kind);
  }

  @Post(":type/add")
  add(@Req() req: any, @Param("type") type: ListType, @Body() body: { titleId: string }) {
    return this.service.addToList(req.user.userId, type, body.titleId);
  }

  @Post(":type/remove")
  remove(@Req() req: any, @Param("type") type: ListType, @Body() body: { titleId: string }) {
    return this.service.removeFromList(req.user.userId, type, body.titleId);
  }
}
