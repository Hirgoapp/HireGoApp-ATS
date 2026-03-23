import { IsString, IsOptional, IsEmail, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePocDto {
    @ApiProperty({ description: 'POC name', example: 'Jane Smith' })
    @IsString()
    @MaxLength(255)
    name: string;

    @ApiPropertyOptional({ description: 'Job title/designation', example: 'HR Manager' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    designation?: string;

    @ApiPropertyOptional({ description: 'Email', example: 'jane.smith@client.com' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ description: 'Phone', example: '+1-555-0199' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    phone?: string;

    @ApiPropertyOptional({ description: 'LinkedIn profile URL' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    linkedin?: string;

    @ApiPropertyOptional({ description: 'Notes' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ description: 'Status', example: 'Active', enum: ['Active', 'Inactive'] })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    status?: string;
}
