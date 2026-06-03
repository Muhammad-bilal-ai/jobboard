import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ApplicationsService } from './applications.service';
import { ApplyDto } from './dto/apply.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller()
export class ApplicationsController {
  constructor(private applicationsService: ApplicationsService) {}

  // POST /api/jobs/:id/apply — candidate only
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  @Post('jobs/:id/apply')
  apply(
    @Param('id') jobId: string,
    @Body() dto: ApplyDto,
    @GetUser('id') userId: string,
  ) {
    return this.applicationsService.apply(jobId, userId, dto);
  }

  // GET /api/applications/my — candidate only
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  @Get('applications/my')
  findMyApplications(@GetUser('id') userId: string) {
    return this.applicationsService.findMyApplications(userId);
  }

  // GET /api/jobs/:id/applications — employer only
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  @Get('jobs/:id/applications')
  findJobApplications(
    @Param('id') jobId: string,
    @GetUser('id') userId: string,
  ) {
    return this.applicationsService.findJobApplications(jobId, userId);
  }

  // PATCH /api/applications/:id — employer only
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  @Patch('applications/:id')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto,
    @GetUser('id') userId: string,
  ) {
    return this.applicationsService.updateStatus(id, userId, dto);
  }
}
