import { Command, DiscordCommand } from '@discord-nestjs/core';
import { CommandInteraction, GuildMember, InteractionReplyOptions } from 'discord.js';
import { MusicService } from '../music.service';

@Command({ name: 'skip', description: 'Skips the currently playing song' })
export class SkipCommand implements DiscordCommand {
  constructor(private readonly service: MusicService) {}

  async handler(interaction: CommandInteraction) {
    try {
      await this.service.skip(interaction.member as GuildMember);
      interaction.reply({ content: 'Skipped song' } as InteractionReplyOptions);
    } catch (e) {
      return {
        ephemeral: true,
        content: e?.message ?? e ? `${e}` : 'Unknown error',
      } as InteractionReplyOptions;
    }
  }
}
