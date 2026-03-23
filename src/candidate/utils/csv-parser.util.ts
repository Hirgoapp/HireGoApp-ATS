import { BadRequestException } from '@nestjs/common';
import { BulkImportCandidateItemDto } from '../dto/bulk-import-candidate.dto';

/**
 * CSV Parser Utility for Candidate Bulk Import
 * Supports parsing CSV files with flexible column mapping
 */

export interface CsvParseOptions {
    delimiter?: string;
    skipEmptyLines?: boolean;
    trimFields?: boolean;
}

export interface CsvParseResult {
    data: BulkImportCandidateItemDto[];
    errors: Array<{
        row: number;
        error: string;
    }>;
}

/**
 * Parse CSV content into candidate import DTOs
 */
export function parseCandidateCsv(
    csvContent: string,
    options: CsvParseOptions = {},
): CsvParseResult {
    const {
        delimiter = ',',
        skipEmptyLines = true,
        trimFields = true,
    } = options;

    const lines = csvContent.split(/\r?\n/);
    const data: BulkImportCandidateItemDto[] = [];
    const errors: Array<{ row: number; error: string }> = [];

    if (lines.length < 2) {
        throw new BadRequestException('CSV file must contain at least a header row and one data row');
    }

    // Parse header row
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine, delimiter, trimFields);
    const columnMap = createColumnMap(headers);

    // Validate required columns
    const requiredColumns = ['candidate_name', 'email'];
    const missingColumns = requiredColumns.filter(col => !columnMap.has(col));
    if (missingColumns.length > 0) {
        throw new BadRequestException(
            `CSV file is missing required columns: ${missingColumns.join(', ')}`,
        );
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const rowNumber = i + 1;

        // Skip empty lines
        if (skipEmptyLines && !line.trim()) {
            continue;
        }

        try {
            const values = parseCSVLine(line, delimiter, trimFields);

            if (values.length === 0 || (values.length === 1 && !values[0])) {
                continue; // Skip empty rows
            }

            const candidate = parseCandidateRow(values, columnMap, rowNumber);
            data.push(candidate);
        } catch (error) {
            errors.push({
                row: rowNumber,
                error: error.message || 'Failed to parse row',
            });
        }
    }

    return { data, errors };
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string, delimiter: string, trim: boolean): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === delimiter && !inQuotes) {
            // End of field
            values.push(trim ? current.trim() : current);
            current = '';
        } else {
            current += char;
        }
    }

    // Add last field
    values.push(trim ? current.trim() : current);

    return values;
}

/**
 * Create a map of column name to column index
 */
function createColumnMap(headers: string[]): Map<string, number> {
    const map = new Map<string, number>();

    // Normalize header names (lowercase, replace spaces/underscores)
    const normalizeHeader = (header: string) =>
        header.toLowerCase().replace(/[\s-]+/g, '_').trim();

    headers.forEach((header, index) => {
        const normalized = normalizeHeader(header);
        map.set(normalized, index);

        // Add common aliases
        const aliases: Record<string, string[]> = {
            candidate_name: ['name', 'full_name', 'fullname'],
            email: ['email_address', 'e_mail'],
            phone: ['phone_number', 'telephone', 'mobile'],
            skill_set: ['skills', 'technologies', 'tech_stack'],
            total_experience: ['experience', 'years_of_experience', 'yoe', 'experience_years'],
            linkedin_url: ['linkedin', 'linkedin_profile'],
            candidate_status: ['status'],
        };

        for (const [key, aliasList] of Object.entries(aliases)) {
            if (aliasList.includes(normalized)) {
                map.set(key, index);
            }
        }
    });

    return map;
}

/**
 * Parse a single candidate row
 */
function parseCandidateRow(
    values: string[],
    columnMap: Map<string, number>,
    rowNumber: number,
): BulkImportCandidateItemDto {
    const getValue = (key: string): string | undefined => {
        const index = columnMap.get(key);
        return index !== undefined ? values[index] : undefined;
    };

    const getNumberValue = (key: string): number | undefined => {
        const value = getValue(key);
        if (!value) return undefined;

        const num = parseFloat(value);
        return isNaN(num) ? undefined : num;
    };

    // Required fields
    const candidate_name = getValue('candidate_name');
    const email = getValue('email');

    if (!candidate_name || !email) {
        throw new Error(`Row ${rowNumber}: Missing required fields (candidate_name, email)`);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error(`Row ${rowNumber}: Invalid email format: ${email}`);
    }

    // Parse status
    const candidate_status = getValue('candidate_status');

    // Parse extra fields (if column exists)
    let extra_fields: Record<string, any> | undefined;
    const extraFieldsValue = getValue('extra_fields');
    if (extraFieldsValue) {
        try {
            extra_fields = JSON.parse(extraFieldsValue);
        } catch {
            // Ignore invalid JSON in extra fields
            extra_fields = { raw: extraFieldsValue };
        }
    }

    const candidate: BulkImportCandidateItemDto = {
        candidate_name,
        email,
        phone: getValue('phone'),
        current_company: getValue('current_company'),
        skill_set: getValue('skill_set'), // Keep as string, not array
        total_experience: getNumberValue('total_experience'),
        candidate_status,
        linkedin_url: getValue('linkedin_url'),
        notes: getValue('notes'),
        extra_fields,
        recruiter_id: getValue('recruiter_id'),
    };

    return candidate;
}

/**
 * Generate a sample CSV template for candidate import
 */
export function generateCandidateCsvTemplate(): string {
    const headers = [
        'candidate_name',
        'email',
        'phone',
        'current_company',
        'skill_set',
        'total_experience',
        'candidate_status',
        'linkedin_url',
        'notes',
    ];

    const sampleRow = [
        'John Doe',
        'john.doe@example.com',
        '+1234567890',
        'Tech Corp Inc',
        'JavaScript, React, Node.js',
        '5',
        'Active',
        'https://linkedin.com/in/johndoe',
        'Experienced full-stack developer',
    ];

    return [headers.join(','), sampleRow.join(',')].join('\n');
}
