import { Injectable, BadRequestException } from '@nestjs/common';
import {
    CustomFieldType,
    ValidationRules,
    FieldOption,
} from '../entities/custom-field.entity';

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}

@Injectable()
export class CustomFieldValidationService {
    /**
     * Validate value against field configuration
     */
    validateValue(
        value: any,
        fieldType: CustomFieldType,
        validationRules: ValidationRules,
        options: FieldOption[],
        isRequired: boolean
    ): ValidationResult {
        const errors: ValidationError[] = [];

        // Check required
        if (isRequired && (value === null || value === undefined || value === '')) {
            errors.push({
                field: 'value',
                message: 'This field is required',
            });
            return { valid: false, errors };
        }

        // If not required and empty, pass
        if (value === null || value === undefined || value === '') {
            return { valid: true, errors: [] };
        }

        // Type-specific validation
        const typeErrors = this.validateByType(
            fieldType,
            value,
            validationRules,
            options
        );
        errors.push(...typeErrors);

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    private validateByType(
        fieldType: CustomFieldType,
        value: any,
        rules: ValidationRules,
        options: FieldOption[]
    ): ValidationError[] {
        const errors: ValidationError[] = [];

        switch (fieldType) {
            case CustomFieldType.TEXT:
            case CustomFieldType.TEXTAREA:
            case CustomFieldType.RICH_TEXT:
                errors.push(...this.validateText(value, rules));
                break;

            case CustomFieldType.NUMBER:
            case CustomFieldType.CURRENCY:
                errors.push(...this.validateNumber(value, rules));
                break;

            case CustomFieldType.DATE:
                errors.push(...this.validateDate(value, rules, false));
                break;

            case CustomFieldType.DATETIME:
                errors.push(...this.validateDate(value, rules, true));
                break;

            case CustomFieldType.URL:
                errors.push(...this.validateUrl(value, rules));
                break;

            case CustomFieldType.EMAIL:
                errors.push(...this.validateEmail(value));
                break;

            case CustomFieldType.PHONE:
                errors.push(...this.validatePhone(value));
                break;

            case CustomFieldType.SELECT:
                errors.push(...this.validateSelect(value, options, rules));
                break;

            case CustomFieldType.MULTISELECT:
                errors.push(...this.validateMultiSelect(value, options, rules));
                break;

            case CustomFieldType.BOOLEAN:
                errors.push(...this.validateBoolean(value));
                break;

            case CustomFieldType.RATING:
                errors.push(...this.validateRating(value));
                break;
        }

        return errors;
    }

    private validateText(
        value: any,
        rules: ValidationRules
    ): ValidationError[] {
        const errors: ValidationError[] = [];
        const strValue = String(value).trim();

        if (rules.minLength && strValue.length < rules.minLength) {
            errors.push({
                field: 'value',
                message: `Minimum length is ${rules.minLength} characters`,
            });
        }

        if (rules.maxLength && strValue.length > rules.maxLength) {
            errors.push({
                field: 'value',
                message: `Maximum length is ${rules.maxLength} characters`,
            });
        }

        if (rules.pattern) {
            const regex = new RegExp(rules.pattern);
            if (!regex.test(strValue)) {
                errors.push({
                    field: 'value',
                    message: rules.customErrorMessage || 'Invalid format',
                });
            }
        }

        return errors;
    }

    private validateNumber(
        value: any,
        rules: ValidationRules
    ): ValidationError[] {
        const errors: ValidationError[] = [];

        if (isNaN(value)) {
            errors.push({ field: 'value', message: 'Must be a number' });
            return errors;
        }

        const num = Number(value);

        if (rules.min !== undefined && num < rules.min) {
            errors.push({
                field: 'value',
                message: `Minimum value is ${rules.min}`,
            });
        }

        if (rules.max !== undefined && num > rules.max) {
            errors.push({
                field: 'value',
                message: `Maximum value is ${rules.max}`,
            });
        }

        return errors;
    }

    private validateDate(
        value: any,
        rules: ValidationRules,
        includeTime: boolean
    ): ValidationError[] {
        const errors: ValidationError[] = [];
        const date = new Date(value);

        if (isNaN(date.getTime())) {
            errors.push({ field: 'value', message: 'Invalid date format' });
            return errors;
        }

        if (rules.disablePastDates) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (date < today) {
                errors.push({ field: 'value', message: 'Past dates are not allowed' });
            }
        }

        if (rules.disableFutureDates) {
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            if (date > today) {
                errors.push({
                    field: 'value',
                    message: 'Future dates are not allowed',
                });
            }
        }

        return errors;
    }

    private validateEmail(value: any): ValidationError[] {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
            return [{ field: 'value', message: 'Invalid email format' }];
        }
        return [];
    }

    private validateUrl(value: any, rules: ValidationRules): ValidationError[] {
        const errors: ValidationError[] = [];

        try {
            new URL(value);
        } catch {
            errors.push({ field: 'value', message: 'Invalid URL format' });
            return errors;
        }

        if (rules.pattern) {
            const regex = new RegExp(rules.pattern);
            if (!regex.test(String(value))) {
                errors.push({
                    field: 'value',
                    message: rules.customErrorMessage || 'Invalid URL',
                });
            }
        }

        return errors;
    }

    private validatePhone(value: any): ValidationError[] {
        // Simple phone validation: at least 10 digits
        const phoneRegex = /\d{10,}/;
        if (!phoneRegex.test(String(value).replace(/\D/g, ''))) {
            return [{ field: 'value', message: 'Invalid phone format' }];
        }
        return [];
    }

    private validateSelect(
        value: any,
        options: FieldOption[],
        rules: ValidationRules
    ): ValidationError[] {
        const allowCustom = rules.allowCustomOptions !== false;
        const optionIds = options.map((o) => o.id);

        if (!allowCustom && !optionIds.includes(String(value))) {
            return [{ field: 'value', message: 'Invalid option selected' }];
        }

        return [];
    }

    private validateMultiSelect(
        value: any,
        options: FieldOption[],
        rules: ValidationRules
    ): ValidationError[] {
        const errors: ValidationError[] = [];
        const allowCustom = rules.allowCustomOptions !== false;
        const optionIds = options.map((o) => o.id);

        if (!Array.isArray(value)) {
            return [{ field: 'value', message: 'Must be an array' }];
        }

        for (const item of value) {
            if (!allowCustom && !optionIds.includes(String(item))) {
                errors.push({
                    field: 'value',
                    message: `Invalid option: ${item}`,
                });
            }
        }

        return errors;
    }

    private validateBoolean(value: any): ValidationError[] {
        if (
            typeof value !== 'boolean' &&
            value !== '0' &&
            value !== '1' &&
            value !== 0 &&
            value !== 1
        ) {
            return [{ field: 'value', message: 'Must be true or false' }];
        }
        return [];
    }

    private validateRating(value: any): ValidationError[] {
        const num = Number(value);
        if (isNaN(num) || num < 1 || num > 5 || !Number.isInteger(num)) {
            return [
                {
                    field: 'value',
                    message: 'Rating must be an integer from 1 to 5',
                },
            ];
        }
        return [];
    }
}
