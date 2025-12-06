import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { ContentGeneratorModule } from '../content-generator/content-generator.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
    imports: [ContentGeneratorModule, ApiKeysModule],
    controllers: [PublicController],
})
export class PublicModule { }
