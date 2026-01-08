import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ListsService } from "./lists.service";
import { ListsController } from "./lists.controller";
import { UserList } from "./user-list.entity";
import { UserListItem } from "./user-list-item.entity";
import { Title } from "../titles/title.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UserList, UserListItem, Title])],
  providers: [ListsService],
  controllers: [ListsController],
})
export class ListsModule {}
