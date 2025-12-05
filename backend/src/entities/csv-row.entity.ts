import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './project.entity';

@Entity('csv_rows')
export class CsvRow {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    projectId: string;

    @Column({ type: 'json' })
    rowData: Record<string, string>;

    @Column({ type: 'int' })
    rowOrder: number;

    @ManyToOne(() => Project, (project) => project.csvRows, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'projectId' })
    project: Project;
}
