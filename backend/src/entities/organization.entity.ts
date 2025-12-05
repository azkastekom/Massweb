import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Project } from './project.entity';
import { User } from './user.entity';
import { OrganizationMember } from './organization-member.entity';

@Entity('organizations')
export class Organization {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    slug: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    ownerId: string;

    @Column({ type: 'json', nullable: true })
    settings: Record<string, any>;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @OneToMany(() => Project, project => project.organization)
    projects: Project[];

    @OneToMany(() => OrganizationMember, member => member.organization)
    members: OrganizationMember[];
}
