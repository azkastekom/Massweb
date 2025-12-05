import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

export enum OrganizationRole {
    ORG_ADMIN = 'org_admin',
    ORG_MEMBER = 'org_member',
}

@Entity('organization_members')
export class OrganizationMember {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column()
    organizationId: string;

    @Column({
        type: 'enum',
        enum: OrganizationRole,
        default: OrganizationRole.ORG_MEMBER,
    })
    role: OrganizationRole;

    @CreateDateColumn()
    joinedAt: Date;

    // Relations
    @ManyToOne(() => User, user => user.organizationMemberships, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => Organization, org => org.members, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organizationId' })
    organization: Organization;
}
