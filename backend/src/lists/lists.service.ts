import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserList } from "./user-list.entity";
import { User } from "../users/user.entity";
import { ListType } from "./list-type.enum";
import { UserListItem } from "./user-list-item.entity";
import { Title } from "../titles/title.entity";
import { TitleKind } from "../titles/title-kind.enum";

@Injectable()
export class ListsService {
  constructor(
    @InjectRepository(UserList) private listsRepo: Repository<UserList>,
    @InjectRepository(UserListItem) private itemsRepo: Repository<UserListItem>,
    @InjectRepository(Title) private titlesRepo: Repository<Title>,
  ) {}

  private async ensureDefaultLists(userId: string) {
    const existing = await this.listsRepo.find({ where: { user: { id: userId } as any } });
    if (existing.length > 0) return;

    const user = { id: userId } as User;

    const lists = [
      this.listsRepo.create({ user, type: ListType.WATCHED, items: [] }),
      this.listsRepo.create({ user, type: ListType.CONTINUE, items: [] }),
      this.listsRepo.create({ user, type: ListType.WISHLIST, items: [] }),
    ];
    await this.listsRepo.save(lists);
  }

  async getMyLists(userId: string, kind?: "MOVIE" | "SERIES" | "ALL") {
    await this.ensureDefaultLists(userId);

    const lists = await this.listsRepo.find({
      where: { user: { id: userId } as any },
      relations: { items: true },
      order: { createdAt: "ASC" },
    });

    // kind filtresi (sol panelde film/dizi ayrımı için)
    if (!kind || kind === "ALL") return lists;

    const k = kind as TitleKind;
    return lists.map((l) => ({
      ...l,
      items: l.items.filter((it) => it.title.kind === k),
    }));
  }

  async addToList(userId: string, type: ListType, titleId: string) {
    await this.ensureDefaultLists(userId);

    const list = await this.listsRepo.findOne({
      where: { user: { id: userId } as any, type },
    });
    if (!list) throw new NotFoundException("Liste bulunamadı");

    const title = await this.titlesRepo.findOne({ where: { id: titleId } });
    if (!title) throw new NotFoundException("Film/dizi bulunamadı");

    const exists = await this.itemsRepo.findOne({
      where: { list: { id: list.id } as any, title: { id: title.id } as any },
    });
    if (exists) throw new BadRequestException("Zaten listede.");

    const item = this.itemsRepo.create({ list, title });
    return this.itemsRepo.save(item);
  }

  async removeFromList(userId: string, type: ListType, titleId: string) {
    const list = await this.listsRepo.findOne({
      where: { user: { id: userId } as any, type },
    });
    if (!list) throw new NotFoundException("Liste bulunamadı");

    const item = await this.itemsRepo.findOne({
      where: { list: { id: list.id } as any, title: { id: titleId } as any },
    });
    if (!item) throw new NotFoundException("Listede yok.");

    await this.itemsRepo.remove(item);
    return { ok: true };
  }
}
