import { PrismaService } from '../prisma.service';
import { PaginationDto, PaginatedResponse } from '../dtos/pagination.dto';

export abstract class BaseRepository<
  T,
  CreateInput = any,
  UpdateInput = any,
  Include = object,
> {
  constructor(protected readonly prisma: PrismaService) {}

  abstract get model(): {
    findUnique(args: {
      where: { id: string };
      include?: Include;
    }): Promise<T | null>;
    findFirst(args: { where?: object; include?: Include }): Promise<T | null>;
    findMany(args: {
      where?: object;
      include?: Include;
      skip?: number;
      take?: number;
      orderBy?: object;
    }): Promise<T[]>;
    count(args?: { where?: object }): Promise<number>;
    create(args: { data: CreateInput; include?: Include }): Promise<T>;
    update(args: {
      where: { id: string };
      data: UpdateInput;
      include?: Include;
    }): Promise<T>;
    delete(args: { where: { id: string }; include?: Include }): Promise<T>;
  };

  findById(id: string, include?: Include): Promise<T | null> {
    return this.model.findUnique({ where: { id }, include });
  }

  findMany(
    where: object = {},
    pagination?: PaginationDto,
    include?: Include,
  ): Promise<PaginatedResponse<T>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination || {};

    return Promise.all([
      this.model.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include,
      }),
      this.model.count({ where }),
    ]).then(
      ([data, total]) =>
        new PaginatedResponse(data, total, {
          page,
          limit,
          sortBy,
          sortOrder,
        } as PaginationDto),
    );
  }

  create(data: CreateInput, include?: Include): Promise<T> {
    return this.model.create({ data, include });
  }

  update(id: string, data: UpdateInput, include?: Include): Promise<T> {
    return this.model.update({ where: { id }, data, include });
  }

  delete(id: string, include?: Include): Promise<T> {
    return this.model.delete({ where: { id }, include });
  }

  count(where: object = {}): Promise<number> {
    return this.model.count({ where });
  }

  async exists(where: object): Promise<boolean> {
    const count = await this.model.count({ where });
    return count > 0;
  }
}
