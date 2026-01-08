import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../users/user.entity";
import { ListType } from "./list-type.enum";
import { UserListItem } from "./user-list-item.entity";

@Entity()
export class UserList {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { eager: false, onDelete: "CASCADE" })
  user: User;

  @Column({ type: "enum", enum: ListType })
  type: ListType;

  @OneToMany(() => UserListItem, (item) => item.list, { cascade: true })
  items: UserListItem[];

  @CreateDateColumn()
  createdAt: Date;
}
