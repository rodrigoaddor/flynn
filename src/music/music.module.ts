import { forwardRef, Module } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { JoinCommand } from './commands/join.command';
import { PlayCommand } from './commands/play.command';
import { QueueCommand } from './commands/queue.command';
import { SearchCommand } from './commands/search.command';
import { SkipCommand } from './commands/skip.command';
import { MusicService } from './music.service';

@Module({
  imports: [forwardRef(() => AppModule)],
  providers: [MusicService, JoinCommand, PlayCommand, SearchCommand, QueueCommand, SkipCommand],
})
export class MusicModule {}
