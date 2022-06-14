import { forwardRef, Module } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { JoinCommand } from './commands/join.command';
import { PlayCommand } from './commands/play.command';
import { SearchCommand } from './commands/search.command';
import { MusicService } from './music.service';

@Module({
  imports: [forwardRef(() => AppModule)],
  providers: [MusicService, JoinCommand, PlayCommand, SearchCommand],
})
export class MusicModule {}
