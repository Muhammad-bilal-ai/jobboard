import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('jobs')
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  @Post()
  create(@Body() dto: CreateJobDto, @GetUser('id') userId: string) {
    return this.jobsService.create(dto, userId);
  }

  @Get()
  findAll(
    @Query() query: { search?: string; type?: string; location?: string },
  ) {
    return this.jobsService.findAll(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  @Get('my')
  findMyJobs(@GetUser('id') userId: string) {
    return this.jobsService.findMyJobs(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
    @GetUser('id') userId: string,
  ) {
    return this.jobsService.update(id, dto, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  @Delete(':id')
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.jobsService.remove(id, userId);
  }
}
