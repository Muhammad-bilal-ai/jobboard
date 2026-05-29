import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobStatus } from '@prisma/client';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateJobDto, employerId: string) {
    return this.prisma.job.create({
      data: {
        ...dto,
        employerId,
        status: JobStatus.DRAFT,
      },
      include: { employer: { select: { id: true, name: true } } },
    });
  }

  async findAll(query: {
    search?: string;
    type?: string;
    location?: string;
    status?: JobStatus;
  }) {
    const { search, type, location, status } = query;
    return this.prisma.job.findMany({
      where: {
        status: status ?? JobStatus.ACTIVE,
        ...(type && { type }),
        ...(location && {
          location: { contains: location, mode: 'insensitive' },
        }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { tags: { has: search } },
          ],
        }),
      },
      include: {
        employer: { select: { id: true, name: true, avatar: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        employer: { select: { id: true, name: true, avatar: true } },
        _count: { select: { applications: true } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async update(id: string, dto: UpdateJobDto, employerId: string) {
    const job = await this.findOne(id);
    if (job.employerId !== employerId)
      throw new ForbiddenException('You do not own this job');
    return this.prisma.job.update({
      where: { id },
      data: dto,
      include: { employer: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string, employerId: string) {
    const job = await this.findOne(id);
    if (job.employerId !== employerId)
      throw new ForbiddenException('You do not own this job');
    await this.prisma.job.delete({ where: { id } });
    return { message: 'Job deleted' };
  }

  async findMyJobs(employerId: string) {
    return this.prisma.job.findMany({
      where: { employerId },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
