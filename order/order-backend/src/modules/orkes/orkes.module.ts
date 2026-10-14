import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrkesService } from './orkes.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [OrkesService],
  exports: [OrkesService],
})
export class OrkesModule {}
