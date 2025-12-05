import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { OrganizationMember } from './organization-member.entity';

export enum UserRole {
    SUPER_ADMIN = 'super_admin',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ select: false, nullable: true })
    password?: string;

    @Column()
    name: string;

    @Column({ default: false })
    isSuperAdmin: boolean;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @OneToMany(() => OrganizationMember, member => member.user)
    organizationMemberships: OrganizationMember[];
}
