import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, MaxLength, IsOptional } from 'class-validator';

export class ConnectIntegrationDto {
    @ApiProperty({
        example: 'aws_s3',
        description: 'Integration type: google_drive, onedrive, slack, aws_s3, smtp, etc.',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    integration_type: string;

    @ApiPropertyOptional({
        example: { access_key: '...', secret_key: '...', bucket: 'company-files' },
        description: 'Credentials and settings for the integration',
    })
    @IsOptional()
    @IsObject()
    config?: Record<string, unknown>;
}

export class DisconnectIntegrationDto {
    @ApiProperty({
        example: 'aws_s3',
        description: 'Integration type to disconnect',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    integration_type: string;
}
