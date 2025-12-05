import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CsvController } from './csv.controller';
import { CsvService } from './csv.service';
import { CsvColumn } from '../entities/csv-column.entity';
import { CsvRow } from '../entities/csv-row.entity';
import { Project } from '../entities/project.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([CsvColumn, CsvRow, Project]),
    ],
    controllers: [CsvController],
    providers: [CsvService],
    exports: [CsvService],
})
export class CsvModule { }
