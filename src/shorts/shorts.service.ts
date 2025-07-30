import { Injectable } from '@nestjs/common';
import { Short } from './short.interface';
import { shorts } from './shorts.data';

@Injectable()
export class ShortsService {
  findAll(): Short[] {
    return shorts;
  }

  findOne(id: number): Short | undefined {
    return shorts.find((short) => short.id === id);
  }

  getRandomShort(): Short {
    const randomIndex = Math.floor(Math.random() * shorts.length);
    return shorts[randomIndex];
  }

  findByTitle(searchTerm: string): Short[] {
    return shorts.filter((short) =>
      short.title.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }
}
