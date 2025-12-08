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
        rowCount: number;
        totalCombinations: number;
    }> {
        const csvContent = file.buffer.toString('utf-8');

        // Parse CSV using PapaParse
        const parsed = Papa.parse(csvContent, {
            header: true,
            skipEmptyLines: true,
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

        // Save columns
        const columnEntities: CsvColumn[] = headers.map((header, i) =>
            this.csvColumnRepository.create({
                projectId,
                columnName: header,
                columnType: 'text',
                columnOrder: i,
            })
        );
        const savedColumns = await this.csvColumnRepository.save(columnEntities);

        // STREAMING BATCH SAVE - process in chunks without holding all entities in memory
        const BATCH_SIZE = 200;
        let rowCount = 0;
        const uniqueValuesByColumn: Map<string, Set<string>> = new Map();

        // Initialize sets for combination calculation
        headers.forEach(header => {
            uniqueValuesByColumn.set(header, new Set());
        });

        for (let i = 0; i < data.length; i += BATCH_SIZE) {
            const batchData = data.slice(i, i + BATCH_SIZE);

            // Create entities for this batch only
            const batchEntities = batchData.map((rowData, idx) => {
                // Track unique values for combinations while processing
                headers.forEach(header => {
                    if (rowData[header]) {
                        uniqueValuesByColumn.get(header)?.add(rowData[header]);
                    }
                });

                return this.csvRowRepository.create({
                    projectId,
                    rowData,
                    rowOrder: i + idx,
                });
            });

            // Save batch and discard from memory
            await this.csvRowRepository.save(batchEntities);
            rowCount += batchEntities.length;

            // Allow GC to clean up
            if (global.gc) {
                global.gc();
            }
        }

        // Calculate total combinations
        let totalCombinations = 1;
        uniqueValuesByColumn.forEach(valueSet => {
            totalCombinations *= Math.max(valueSet.size, 1);
        });

        // Clear the parsed data from memory
        data.length = 0;

        return {
            columns: savedColumns,
            rowCount,
            totalCombinations,
        };
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
