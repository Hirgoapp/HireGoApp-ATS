import { IsUUID, IsNotEmpty } from 'class-validator';

export class SetCustomFieldValueDto {
    @IsNotEmpty()
    value: any;
}
