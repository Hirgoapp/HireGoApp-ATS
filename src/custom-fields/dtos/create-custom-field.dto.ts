import {
    IsString,
    IsEnum,
    IsOptional,
    IsBoolean,
    IsObject,
    IsArray,
    ValidateNested,
    IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CustomFieldType } from '../entities/custom-field.entity';

export class FieldOptionDto {
    @IsString()
    id: string;

    @IsString()
    label: string;

    @IsOptional()
    @IsString()
    color?: string;
}

export class CreateCustomFieldDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    entityType: string;

    @IsEnum(CustomFieldType)
    fieldType: CustomFieldType;

    @IsOptional()
    @IsBoolean()
    isRequired?: boolean;

    @IsOptional()
    @IsBoolean()
    isUnique?: boolean;

    @IsOptional()
    @IsObject()
    validationRules?: Record<string, any>;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FieldOptionDto)
    options?: FieldOptionDto[];

    @IsOptional()
    @IsNumber()
    displayOrder?: number;
}
