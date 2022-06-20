import { InjectDiscordClient } from '@discord-nestjs/core';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, GuildMember, VoiceBasedChannel } from 'discord.js';
import { Connectors, Node, Player, Shoukaku, Track } from 'shoukaku';

@Injectable()
export class MusicService {
  private readonly shoukaku: Shoukaku;

  protected readonly queue: Map<string, Track[]> = new Map();

  constructor(readonly config: ConfigService, @InjectDiscordClient() private readonly client: Client) {
    this.shoukaku = new Shoukaku(new Connectors.DiscordJS(client), [
      {
        name: 'default',
        url: `${config.get('LAVALINK_HOST')}:${config.get('LAVALINK_PORT')}`,
        auth: config.get('LAVALINK_PASSWORD'),
      },
    ]);

    this.shoukaku.on('error', (_, err) => console.error(err));
  }

  protected get node(): Node {
    const node = this.shoukaku.getNode();
    if (!node) {
      throw new Error('No node available');
    }
    return node;
  }

  protected get players(): Map<string, Player> {
    return this.shoukaku.players;
  }

  public getQueue(guild: string): Track[] | undefined {
    return [...this.queue.get(guild)];
  }

  async join(member: GuildMember, force: boolean = false): Promise<Player> {
    const {
      guild: { id: guildId },
      voice: { channelId },
    } = member;

    if (!channelId) {
      throw new Error('Must be in a voice channel');
    }

    if (this.players.has(guildId)) {
      const guildPlayer = this.players.get(guildId);

      if (guildPlayer.connection.channelId === channelId) {
        return guildPlayer;
      } else if (!force) {
        const currentChannel = this.client.channels.resolve(guildPlayer.connection.channelId) as VoiceBasedChannel;

        if (currentChannel.members.size > 1) {
          throw new Error('Already in channel');
        }
      }
    }

    const player = await this.node.joinChannel({
      guildId,
      channelId,
      shardId: 0,
      deaf: true,
    });

    player.on('end', ({ guildId, reason }) => {
      if (reason === 'FINISHED') {
        const currentQueue = this.queue.get(guildId);
        currentQueue.shift();
        if (currentQueue.length > 0) {
          player.playTrack(currentQueue[0]);
        }
      }
    });

    return player;
  }

  async search(query: string): Promise<Track[]> {
    const result = await this.node.rest.resolve(query);
    if (!result) throw new Error('No results found');

    return result.tracks;
  }

  async play(member: GuildMember, track: Track | Track[]) {
    const { guild } = member;
    const tracks = Array.isArray(track) ? track : [track];

    let currentQueue = this.queue.get(guild.id);
    if (!Array.isArray(currentQueue)) {
      currentQueue = [];
      this.queue.set(guild.id, currentQueue);
    }

    currentQueue.push(...tracks);

    const player = await this.join(member);
    if (!player.track) {
      player.playTrack({ track: this.queue.get(guild.id)[0].track });
    }
  }

  async skip({ guild }: GuildMember) {
    const currentQueue = this.queue.get(guild.id);

    if (!Array.isArray(currentQueue) || currentQueue.length === 0) {
      throw new Error('The queue is empty');
    } else {
      const player = this.players.get(guild.id);
      const queue = this.queue.get(guild.id);
      if (player && Array.isArray(queue) && queue.length > 0) {
        player.stopTrack();
        queue.shift();
        if (queue.length > 0) {
          player.playTrack(queue[0]);
        }
      } else {
        throw new Error('Nothing is playing');
      }
    }
  }
}
