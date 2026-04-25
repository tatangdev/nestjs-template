import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Cat } from './cats.dto';

@Injectable()
export class CatsService {
  private readonly cats = new Map<string, Cat>();

  list(limit: number, offset: number): { items: Cat[]; total: number } {
    const all = Array.from(this.cats.values());
    return { items: all.slice(offset, offset + limit), total: all.length };
  }

  get(id: string): Cat {
    const cat = this.cats.get(id);
    if (!cat) throw new NotFoundException(`Cat ${id} not found`);
    return cat;
  }

  create(data: Omit<Cat, 'id'>): Cat {
    const cat: Cat = { id: randomUUID(), ...data };
    this.cats.set(cat.id, cat);
    return cat;
  }

  update(id: string, data: Partial<Omit<Cat, 'id'>>): Cat {
    const existing = this.get(id);
    const updated: Cat = { ...existing, ...data };
    this.cats.set(id, updated);
    return updated;
  }

  remove(id: string): void {
    if (!this.cats.delete(id)) {
      throw new NotFoundException(`Cat ${id} not found`);
    }
  }
}
