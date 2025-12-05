import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as Papa from 'papaparse';
import { Project } from '../entities/project.entity';
import { CsvColumn } from '../entities/csv-column.entity';
import { CsvRow } from '../entities/csv-row.entity';

@Injectable()
export class CsvService {
    constructor(
        @InjectRepository(CsvColumn)
        private csvColumnRepository: Repository<CsvColumn>,
        @InjectRepository(CsvRow)
        private csvRowRepository: Repository<CsvRow>,
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
    ) { }

    async parseAndSaveCsv(projectId: string, file: Express.Multer.File): Promise<{
        columns: CsvColumn[];
        rows: CsvRow[];
        totalCombinations: number;
    }> {
        const csvContent = file.buffer.toString('utf-8');

        // Parse CSV using PapaParse
        const parsed = Papa.parse(csvContent, {
            header: true,
            skipEmptyLines: true,
            // Let papaparse auto-detect delimiter
            transformHeader: (header) => header.trim(),
        });

        if (parsed.errors && parsed.errors.length > 0) {
            throw new BadRequestException(`CSV parsing error: ${parsed.errors[0].message}`);
        }

        const data = parsed.data as Record<string, string>[];
        const headers = parsed.meta.fields;

        if (!headers || headers.length === 0) {
            throw new BadRequestException('CSV file must have headers');
        }

        if (data.length === 0) {
            throw new BadRequestException('CSV file must have at least one row of data');
        }

        // Delete existing CSV data for this project
        await this.csvColumnRepository.delete({ projectId });
        await this.csvRowRepository.delete({ projectId });

        // Save column definitions
        const columns: CsvColumn[] = [];
        for (let i = 0; i < headers.length; i++) {
            const column = this.csvColumnRepository.create({
                projectId,
                columnName: headers[i],
                columnType: 'text',
                columnOrder: i,
            });
            columns.push(await this.csvColumnRepository.save(column));
        }

        // Save rows
        const rows: CsvRow[] = [];
        for (let i = 0; i < data.length; i++) {
            const row = this.csvRowRepository.create({
                projectId,
                rowData: data[i],
                rowOrder: i,
            });
            rows.push(await this.csvRowRepository.save(row));
        }

        // Calculate total combinations (Cartesian product)
        const totalCombinations = this.calculateCombinations(data, headers);

        return {
            columns,
            rows,
            totalCombinations,
        };
    }

    private calculateCombinations(data: Record<string, string>[], headers: string[]): number {
        // Group rows by unique values in each column
        const uniqueValuesByColumn: Map<string, Set<string>> = new Map();

        headers.forEach(header => {
            uniqueValuesByColumn.set(header, new Set());
        });

        data.forEach(row => {
            headers.forEach(header => {
                if (row[header]) {
                    const valueSet = uniqueValuesByColumn.get(header);
                    if (valueSet) {
                        valueSet.add(row[header]);
                    }
                }
            });
        });

        // Calculate Cartesian product size
        let total = 1;
        uniqueValuesByColumn.forEach(valueSet => {
            total *= valueSet.size;
        });

        return total;
    }

    async getCsvData(projectId: string): Promise<{
        columns: CsvColumn[];
        rows: CsvRow[];
    }> {
        const columns = await this.csvColumnRepository.find({
            where: { projectId },
            order: { columnOrder: 'ASC' },
        });

        const rows = await this.csvRowRepository.find({
            where: { projectId },
            order: { rowOrder: 'ASC' },
        });

        return { columns, rows };
    }
}
