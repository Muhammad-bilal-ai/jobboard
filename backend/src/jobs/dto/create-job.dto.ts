import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsIn,
  ArrayMinSize,
} from 'class-validator';

export class CreateJobDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsNotEmpty()
  @IsIn(['remote', 'onsite', 'hybrid'])
  type: string;

  @IsOptional()
  @IsString()
  salary?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  tags?: string[];
}
