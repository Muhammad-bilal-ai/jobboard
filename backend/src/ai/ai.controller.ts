import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  // POST /api/ai/generate-description — employer only
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  @Post('generate-description')
  generate(@Body() body: { title: string; points: string }) {
    return this.aiService.generateDescription(body.title, body.points);
  }
}
