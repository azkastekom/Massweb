import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './project.entity';

export enum PublishStatus {
    PENDING = 'pending',
    PUBLISHED = 'published',
    FAILED = 'failed',
}

@Entity('generated_contents')
export class GeneratedContent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    projectId: string;

    @Column({ type: 'longtext' })
    content: string;

    @Column({ nullable: true })
    title: string;

    @Column({ type: 'text', nullable: true })
    metaDescription: string;

    @Column({ type: 'text', nullable: true })
    tags: string;

    @Column({ nullable: true })
    thumbnailUrl: string;

    @Column()
    slug: string;

    @Column({
        type: 'enum',
        enum: PublishStatus,
        default: PublishStatus.PENDING,
    })
    publishStatus: PublishStatus;

    @Column({ type: 'timestamp', nullable: true })
    publishedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Project, (project) => project.generatedContents, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'projectId' })
    project: Project;
}
