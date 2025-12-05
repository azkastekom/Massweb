import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { OrganizationMember, OrganizationRole } from '../entities/organization-member.entity';

export interface RegisterDto {
    email: string;
    password: string;
    name: string;
    organizationName?: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface JwtPayload {
    sub: string;
    email: string;
    isSuperAdmin: boolean;
}

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Organization)
        private organizationRepository: Repository<Organization>,
        @InjectRepository(OrganizationMember)
        private orgMemberRepository: Repository<OrganizationMember>,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto): Promise<{ user: User; token: string; organization?: Organization }> {
        const { email, password, name, organizationName } = registerDto;

        // Check if registration is allowed
        const allowSignup = process.env.ALLOW_SIGNUP !== 'false';
        if (!allowSignup) {
            throw new UnauthorizedException('Registration is currently disabled');
        }

        // Check if user already exists
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new UnauthorizedException('Email already registered');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if this should be a super admin
        const superAdminEmail = process.env.SUPERADMIN_EMAIL;
        const isSuperAdmin = email === superAdminEmail;

        // Create user
        const user = this.userRepository.create({
            email,
            password: hashedPassword,
            name,
            isSuperAdmin,
        });

        const savedUser = await this.userRepository.save(user);

        // Create organization if organizationName provided
        let organization: Organization | undefined;
        if (organizationName) {
            const slug = this.generateSlug(organizationName);
            organization = this.organizationRepository.create({
                name: organizationName,
                slug,
                ownerId: savedUser.id,
            });
            const savedOrg = await this.organizationRepository.save(organization);

            // Add user as OrgAdmin member
            const membership = this.orgMemberRepository.create({
                userId: savedUser.id,
                organizationId: savedOrg.id,
                role: OrganizationRole.ORG_ADMIN,
            });
            await this.orgMemberRepository.save(membership);

            organization = savedOrg;
        }

        // Generate JWT token
        const token = this.generateToken(savedUser);

        // Remove password from response
        delete savedUser.password;

        return { user: savedUser, token, organization };
    }

    async login(loginDto: LoginDto): Promise<{ user: User; token: string }> {
        const { email, password } = loginDto;

        // Find user with password
        const user = await this.userRepository
            .createQueryBuilder('user')
            .where('user.email = :email', { email })
            .addSelect('user.password')
            .getOne();

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.password) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Check if user is active (super admins bypass this check)
        if (!user.isActive && !user.isSuperAdmin) {
            throw new UnauthorizedException('Your account has been deactivated. Please contact support.');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate token
        const token = this.generateToken(user);

        // Remove password from response
        delete user.password;

        return { user, token };
    }

    async validateUser(userId: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return user;
    }

    private generateToken(user: User): string {
        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            isSuperAdmin: user.isSuperAdmin,
        };
        return this.jwtService.sign(payload);
    }

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}
