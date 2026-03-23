import { IsArray, IsUUID, IsNotEmpty } from 'class-validator';

export class BulkSetCustomFieldValuesDto {
    @IsArray()
    @IsUUID('4', { each: true })
    entityIds: string[];

    @IsNotEmpty()
    value: any;
}
