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

      let query: string;
      if (isUrl(input)) {
        query = input;
      } else {
        query = `ytsearch:${input}`;
      }

      const tracks = await this.service.search(query);

      this.service.play(member, tracks[0]);
      return {
        ephemeral: true,
        content: `Playing ${tracks[0].info.title}`,
      } as InteractionReplyOptions;
    } catch (e) {
      return {
        ephemeral: true,
        content: e?.message ?? e ? `${e}` : 'Unknown error',
      } as InteractionReplyOptions;
    }
  }
}
