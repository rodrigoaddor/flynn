import { Command, DiscordCommand } from '@discord-nestjs/core';
import {
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageActionRowComponent,
  MessageButton,
  MessageEmbed,
} from 'discord.js';
import { Track } from 'shoukaku';
import { MusicService } from '../music.service';
import dayjs from 'src/utils/dayjs';

@Command({
  name: 'queue',
  description: 'Shows the current music queue',
})
export class QueueCommand implements DiscordCommand {
  constructor(private readonly service: MusicService) {}

  async handler(interaction: CommandInteraction) {
    const currentQueue = this.service.queue.get(interaction.guildId) ?? [];

    if (currentQueue.length) {
      // componentize this?
      const limit = 10;
      const page = 0;

      await interaction.reply({
        fetchReply: true,
        content: 'Loading...',
        ephemeral: true,
      });

      this.handleReactions(interaction, currentQueue, page, limit);
    } else {
      interaction.reply({
        content: 'There are no musics in the queue',
        ephemeral: true,
      });
    }
  }

  private buildEmbed(queue: Track[], pagination?: { page: number; limit: number }): MessageEmbed {
    const { page, limit } = pagination ?? {};
    const hasPagination = page !== undefined && limit !== undefined;

    const maxPages = hasPagination ? queue.length / limit : 0;

    if (hasPagination) {
      queue = queue.slice(page * limit, (page + 1) * limit);
    }

    return new MessageEmbed({
      description: queue
        .map((track, index) => {
          const { title, author, length } = track.info;
          const duration = dayjs.duration(length).format('m[m]:ss[s]');

          return `${page * limit + index + 1}) ${title} - ${author} - ${duration}`;
        })
        .join('\n'),
      footer: hasPagination
        ? {
            text: `Page ${page + 1}/${maxPages}`,
          }
        : undefined,
    });
  }

  private buildButtons(page: number, maxPages: number) {
    return new MessageActionRow({
      components: [
        new MessageButton({
          customId: 'previous',
          label: 'Previous',
          disabled: page <= 0,
          style: 'SECONDARY',
        }),
        new MessageButton({
          customId: 'next',
          label: 'Next',
          disabled: page >= maxPages - 1,
          style: 'SECONDARY',
        }),
      ],
    });
  }

  private async handleReactions(interaction: CommandInteraction, queue: Track[], page: number, limit: number) {
    const message = (await interaction.editReply({
      content: `There are ${queue.length} tracks in the queue.`,
      embeds: [this.buildEmbed(queue, { page, limit })],
      components: [this.buildButtons(page, queue.length / limit)],
    })) as Message;

    message
      .awaitMessageComponent({
        componentType: 'BUTTON',
        filter: (interaction) => {
          interaction.deferUpdate();
          return ['previous', 'next'].includes(interaction.customId);
        },
        time: 60e3,
      })
      .then((result) => {
        switch (result.customId) {
          case 'previous':
            return this.handleReactions(interaction, queue, page - 1, limit);
          case 'next':
            return this.handleReactions(interaction, queue, page + 1, limit);
        }
      })
      .catch();
  }
}
