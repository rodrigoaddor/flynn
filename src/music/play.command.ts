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
import { GuildMember } from 'discord.js';
import { Shoukaku } from 'shoukaku';

class PlayDto {
  @Param({
    description: 'Music search query',
    required: true,
    type: ParamType.STRING,
  })
  query: string;
}

@UsePipes(TransformPipe)
@Command({ name: 'play', description: 'Play some music' })
export class PlayCommand implements DiscordTransformedCommand<PlayDto> {
  constructor(private readonly shoukaku: Shoukaku) {}

  async handler(
    @Payload() { query }: PlayDto,
    context: TransformedCommandExecutionContext,
  ) {
    const { guildId, member } = context.interaction;
    const channelId = (member as GuildMember)?.voice?.channelId;

    if (!channelId) {
      return 'You must be in a voice channel to play music!';
    }

    const node = this.shoukaku.getNode();
    const result = await node.rest.resolve('scsearch:snowhalation');

    if (!result || !result.tracks.length) return 'Nothing found';

    const metadata = result.tracks.shift();
    const player = await node.joinChannel({
      guildId,
      channelId,
      shardId: 0,
    });

    player.playTrack({ track: metadata.track });
  }
}
