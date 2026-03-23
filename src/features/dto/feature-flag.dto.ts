import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class EnableFeatureDto {
    @ApiProperty({ example: 'candidates_module', description: 'Feature key to enable' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    feature_key: string;
}

export class DisableFeatureDto {
    @ApiProperty({ example: 'candidates_module', description: 'Feature key to disable' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    feature_key: string;
}
