import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../users/user.entity";

export enum RequestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

@Entity()
export class EditorRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { eager: true, onDelete: "CASCADE" })
  requestedBy: User;

  @ManyToOne(() => User, { nullable: true, eager: true, onDelete: "SET NULL" })
  reviewedBy: User | null;

  @Column({ type: "enum", enum: RequestStatus, default: RequestStatus.PENDING })
  status: RequestStatus;

  @Column({ type: "text", nullable: true })
  rejectReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
