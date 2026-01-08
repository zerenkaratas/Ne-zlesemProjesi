import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Title } from "./title.entity";
import { TitlesService } from "./titles.service";
import { TitlesController } from "./titles.controller";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [TypeOrmModule.forFeature([Title]), UsersModule],
  providers: [TitlesService],
  controllers: [TitlesController],
  exports: [TypeOrmModule],
})
export class TitlesModule {}
