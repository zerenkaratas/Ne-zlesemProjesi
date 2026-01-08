import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RequestsService } from "./requests.service";
import { RequestsController } from "./requests.controller";
import { EditorRequest } from "./editor-request.entity";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [TypeOrmModule.forFeature([EditorRequest]), UsersModule],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
