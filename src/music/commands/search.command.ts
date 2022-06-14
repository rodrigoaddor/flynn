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
import {
  GuildMember,
  InteractionReplyOptions,
  Message,
  MessageActionRow,
  MessageActionRowComponent,
  MessageActionRowComponentResolvable,
  MessageButton,
  MessageSelectMenu,
  SelectMenuInteraction,
} from 'discord.js';
import { Track } from 'shoukaku';
import { isUrl, truncate } from 'src/utils/string';
import { MusicService } from '../music.service';

class SearchCommandDto {
  @Param({
    name: 'music',
    description: 'A music name, or a link to a song or playlist',
    required: true,
    type: ParamType.STRING,
  })
  input: string;
}

@UsePipes(TransformPipe)
@Command({ name: 'search', description: 'Search for a music' })
export class SearchCommand implements DiscordTransformedCommand<SearchCommandDto> {
  constructor(private readonly service: MusicService) {}

  async handler(@Payload() { input }: SearchCommandDto, { interaction }: TransformedCommandExecutionContext) {
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

      if (tracks.length === 1) {
        this.service.play(member, tracks[0]);
        return 'Playing';
      } else {
        const message = (await interaction.reply({
          content: `Found ${tracks.length} results${tracks.length > 25 ? ' _(showing first 25)_' : ''}`,
          fetchReply: true,
          ephemeral: true,
          components: [
            this.buildSelect(tracks),
            new MessageActionRow({
              components: [
                new MessageButton({
                  customId: 'add_all',
                  label: 'Add all to queue',
                  style: 'PRIMARY',
                }),
              ],
            }),
          ],
        })) as Message<boolean>;

        message
          .awaitMessageComponent({
            filter: (interaction) => {
              interaction.deferUpdate();
              return interaction.customId === 'track_select' || interaction.customId === 'add_all';
            },
            time: 30000,
          })
          .then((result) => {
            if (result.customId === 'track_select') {
              const {
                values: [value],
              } = result as SelectMenuInteraction;
              const track = tracks[+value];

              interaction.editReply({
                content: `Choose ${track.info.title}`,
                components: [],
              });

              this.service.play(member, track);
            } else {
              interaction.editReply({
                content: 'Added all to queue',
                components: [],
              });

              this.service.play(member, tracks);
            }
          })
          .catch(() => {
            interaction.editReply({
              content: 'No music choosen.',
              components: [],
            });
          });
      }
    } catch (e) {
      return {
        ephemeral: true,
        content: e?.message ?? e ? `${e}` : 'Unknown error',
      } as InteractionReplyOptions;
    }
  }

  private buildSelect(tracks: Track[]) {
    return new MessageActionRow({
      components: [
        new MessageSelectMenu({
          custom_id: 'track_select',
          options: tracks.slice(0, 25).map((track, index) => ({
            label: track.info.title,
            description: track.info.author,
            value: `${index}`,
          })),
          placeholder: 'Select a music',
        }),
      ],
    });
  }

  private buildList(
    tracks: Track[],
  ): MessageActionRow<MessageActionRowComponent, MessageActionRowComponentResolvable, any>[] {
    return tracks.map(
      (track, index) =>
        new MessageActionRow({
          components: [
            new MessageButton({
              customId: `${index}`,
              label: truncate(track.info.title, 80),
              style: 'PRIMARY',
            }),
          ],
        }),
    );
  }
}
