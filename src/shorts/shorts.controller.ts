import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { ShortsService } from './shorts.service';
import { Short } from './short.interface';

@Controller('shorts')
export class ShortsController {
  constructor(private readonly shortsService: ShortsService) {}

  @Get()
  findAll(@Query('search') search?: string): Short[] {
    if (search) {
      return this.shortsService.findByTitle(search);
    }
    return this.shortsService.findAll();
  }

  @Get('random')
  getRandomShort(): Short {
    return this.shortsService.getRandomShort();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Short {
    const short = this.shortsService.findOne(id);
    if (!short) {
      throw new NotFoundException(`Short with ID ${id} not found`);
    }
    return short;
  }
}
