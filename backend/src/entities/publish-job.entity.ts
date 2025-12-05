import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './project.entity';

export enum JobStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    PAUSED = 'paused',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
}

@Entity('publish_jobs')
export class PublishJob {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    projectId: string;

    @Column({
        type: 'enum',
        enum: JobStatus,
        default: JobStatus.PENDING,
    })
    status: JobStatus;

    @Column({ type: 'int', default: 0 })
    totalContents: number;

    @Column({ type: 'int', default: 0 })
    processedCount: number;

    @Column({ type: 'int', default: 5 })
    delaySeconds: number;

    @Column({ type: 'text', nullable: true })
    errorMessage: string;

    @Column({ type: 'datetime', nullable: true })
    startedAt: Date;

    @Column({ type: 'datetime', nullable: true })
    completedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Project, (project) => project.publishJobs, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'projectId' })
    project: Project;
}
