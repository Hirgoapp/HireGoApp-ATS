import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomField } from './entities/custom-field.entity';
import { CustomFieldValue } from './entities/custom-field-value.entity';
import { CustomFieldGroup } from './entities/custom-field-group.entity';
import { CustomFieldRepository } from './repositories/custom-field.repository';
import { CustomFieldValueRepository } from './repositories/custom-field-value.repository';
import { CustomFieldGroupRepository } from './repositories/custom-field-group.repository';
import { CustomFieldsService } from './services/custom-fields.service';
import { CustomFieldValidationService } from './services/custom-field-validation.service';
import { CustomFieldFeatureGuard } from './guards/custom-field-feature.guard';
import { CustomFieldsController } from './controllers/custom-fields.controller';
import { LicensingModule } from '../licensing/licensing.module';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [
        CommonModule,
        TypeOrmModule.forFeature([
            CustomField,
            CustomFieldValue,
            CustomFieldGroup,
        ]),
        LicensingModule,
    ],
    providers: [
        CustomFieldRepository,
        CustomFieldValueRepository,
        CustomFieldGroupRepository,
        CustomFieldsService,
        CustomFieldValidationService,
        CustomFieldFeatureGuard,
    ],
    controllers: [CustomFieldsController],
    exports: [
        CustomFieldsService,
        CustomFieldValidationService,
        CustomFieldFeatureGuard,
    ],
})
export class CustomFieldsModule { }
