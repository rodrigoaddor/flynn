import { TransformPipe } from '@discord-nestjs/common';
import {
  Command,
  DiscordTransformedCommand,
  Param,
  ParamType,
  Payload,
  TransformedCommandExecutionContext,
  UsePipes,
} from '@discord-nestjs/core';
import { GuildMember, InteractionReplyOptions } from 'discord.js';
import { isUrl } from 'src/utils/string';
import { MusicService } from '../music.service';

class PlayDto {
  @Param({
    name: 'music',
    description: 'A music name, or a link to a song or playlist',
    required: true,
    type: ParamType.STRING,
  })
  input: string;
}

@UsePipes(TransformPipe)
@Command({ name: 'play', description: 'Play a music or playlist' })
export class PlayCommand implements DiscordTransformedCommand<PlayDto> {
  constructor(private readonly service: MusicService) {}

  async handler(@Payload() { input }: PlayDto, { interaction }: TransformedCommandExecutionContext) {
    try {
      const { member } = interaction;
      if (!(member instanceof GuildMember)) throw new Error('Member is not a GuildMember');
      await this.service.join(member as GuildMember);
      const isSearch = !isUrl(input);

      const query = isSearch ? `ytsearch:${input}` : input;

      const tracks = await this.service.search(query);

      this.service.play(member, isSearch ? tracks[0] : tracks);

      return {
        ephemeral: true,
        content: isSearch ? `Playing ${tracks[0].info.title}` : `Added ${tracks.length} to the queue`,
      } as InteractionReplyOptions;
    } catch (e) {
      return {
        ephemeral: true,
        content: e?.message ?? e ? `${e}` : 'Unknown error',
      } as InteractionReplyOptions;
    }
  }
}
