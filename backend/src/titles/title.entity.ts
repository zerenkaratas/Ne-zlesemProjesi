import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { TitleKind } from "./title-kind.enum";

@Entity()
export class Title {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string; // film/dizi adı

  @Column({ type: "enum", enum: TitleKind })
  kind: TitleKind; // MOVIE | SERIES

  @Column({ nullable: true })
  posterUrl?: string; // istersen sonra

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
  
  @Column({ nullable: true })
  createdById?: string;
}
