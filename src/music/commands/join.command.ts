import { Command, DiscordCommand } from '@discord-nestjs/core';
import { CommandInteraction, GuildMember, InteractionReplyOptions } from 'discord.js';
import { MusicService } from '../music.service';

@Command({ name: 'join', description: 'Join a voice channel' })
export class JoinCommand implements DiscordCommand {
  constructor(private readonly service: MusicService) {}

  async handler(interaction: CommandInteraction) {
    try {
      const player = await this.service.join(interaction.member as GuildMember);

      await interaction.reply({
        ephemeral: true,
        content: `Joined <#${player.connection.channelId}>`,
      } as InteractionReplyOptions);
    } catch (e) {
      return {
        ephemeral: true,
        content: e?.message ?? e ? `${e}` : 'Unknown error',
      } as InteractionReplyOptions;
    }
  }
}
