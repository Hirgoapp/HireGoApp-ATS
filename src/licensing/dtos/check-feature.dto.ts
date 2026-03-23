import { IsString } from 'class-validator';

export class CheckFeatureDto {
    @IsString()
    feature_name: string;
}
