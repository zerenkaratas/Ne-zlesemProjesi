import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { UserList } from "./user-list.entity";
import { Title } from "../titles/title.entity";

@Entity()
@Unique(["list", "title"])
export class UserListItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => UserList, (list) => list.items, { onDelete: "CASCADE", eager: false })
  list: UserList;

  @ManyToOne(() => Title, { eager: true, onDelete: "CASCADE" })
  title: Title;

  @CreateDateColumn()
  createdAt: Date;
}
