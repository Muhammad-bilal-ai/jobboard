import { PartialType } from '@nestjs/mapped-types';
import { CreateJobDto } from './create-job.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { JobStatus } from '@prisma/client';

export class UpdateJobDto extends PartialType(CreateJobDto) {
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}
