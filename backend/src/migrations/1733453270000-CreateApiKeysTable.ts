import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateApiKeysTable1733453270000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'api_keys',
                columns: [
                    {
                        name: 'id',
                        type: 'varchar',
                        length: '36',
                        isPrimary: true,
                    },
                    {
                        name: 'key',
                        type: 'varchar',
                        length: '255',
                        isUnique: true,
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'organizationId',
                        type: 'varchar',
                        length: '36',
                    },
                    {
                        name: 'isActive',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'lastUsedAt',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'expiresAt',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'createdById',
                        type: 'varchar',
                        length: '36',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        // Add foreign key to organizations
        await queryRunner.createForeignKey(
            'api_keys',
            new TableForeignKey({
                columnNames: ['organizationId'],
                referencedTableName: 'organizations',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        // Add foreign key to users (createdBy)
        await queryRunner.createForeignKey(
            'api_keys',
            new TableForeignKey({
                columnNames: ['createdById'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('api_keys');
    }
}
