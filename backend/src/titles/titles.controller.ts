import { Body, Controller, Delete, Get, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { TitlesService } from "./titles.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateTitleDto } from "./dto/create-title.dto";
import { UpdateTitleDto } from "./dto/update-title.dto";

@Controller("titles")
export class TitlesController {
  constructor(private service: TitlesService) {}

  // herkes görebilir (çark + listeler)
  @Get()
  list(@Query("kind") kind?: "MOVIE" | "SERIES" | "ALL") {
    return this.service.list(kind);
  }

  @UseGuards(JwtAuthGuard)
  @Get("mine")
  myList(@Req() req: any) {
    return this.service.listByCreator(req.user.userId);
  }

  // editör/admin ekler
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateTitleDto, @Req() req: any) {
    return this.service.create(dto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  update(@Req() req: any, @Body() dto: UpdateTitleDto) {
    const id = req.params.id;
    return this.service.update(id, dto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  remove(@Req() req: any) {
    const id = req.params.id;
    return this.service.remove(id, req.user.userId);
  }
}
