import { CreateCronJobDto } from './create-cron-job.request.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateCronJobDto extends PartialType(CreateCronJobDto) {}