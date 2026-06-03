import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApplyDto } from './dto/apply.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { JobStatus } from '@prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  // ─── APPLY ── candidate applies to a job ──────────────────
  async apply(jobId: string, candidateId: string, dto: ApplyDto) {
    // 1. job must exist and be active
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== JobStatus.ACTIVE)
      throw new ForbiddenException('This job is not accepting applications');

    // 2. can't apply to your own job
    if (job.employerId === candidateId)
      throw new ForbiddenException('You cannot apply to your own job');

    // 3. check for duplicate application
    const existing = await this.prisma.application.findUnique({
      where: { jobId_candidateId: { jobId, candidateId } },
    });
    if (existing)
      throw new ConflictException('You have already applied to this job');

    // 4. create the application
    return this.prisma.application.create({
      data: {
        jobId,
        candidateId,
        coverLetter: dto.coverLetter,
      },
      include: {
        job: { select: { id: true, title: true } },
      },
    });
  }

  // ─── MY APPLICATIONS ── candidate's own applications ──────
  async findMyApplications(candidateId: string) {
    return this.prisma.application.findMany({
      where: { candidateId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            type: true,
            status: true,
            employer: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── JOB APPLICATIONS ── employer sees applicants ────────
  async findJobApplications(jobId: string, employerId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    // ownership check — only see applicants for your own job
    if (job.employerId !== employerId)
      throw new ForbiddenException('You do not own this job');

    return this.prisma.application.findMany({
      where: { jobId },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            bio: true,
            resumeUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── UPDATE STATUS ── employer moves applicant in pipeline ─
  async updateStatus(
    applicationId: string,
    employerId: string,
    dto: UpdateApplicationDto,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });
    if (!application) throw new NotFoundException('Application not found');

    // ownership check — only the job's employer can update status
    if (application.job.employerId !== employerId)
      throw new ForbiddenException('You do not own this job');

    return this.prisma.application.update({
      where: { id: applicationId },
      data: { status: dto.status },
      include: {
        candidate: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
