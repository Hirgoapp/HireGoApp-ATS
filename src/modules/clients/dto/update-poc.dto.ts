import { PartialType } from '@nestjs/swagger';
import { CreatePocDto } from './create-poc.dto';

export class UpdatePocDto extends PartialType(CreatePocDto) {}
