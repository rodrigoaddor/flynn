import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlayCommand } from './play.command';

import { INJECT_DISCORD_CLIENT } from '@discord-nestjs/core';
import { Client } from 'discord.js';
import { Connectors, Shoukaku } from 'shoukaku';
import { AppModule } from 'src/app.module';

@Module({
  imports: [forwardRef(() => AppModule)],
  providers: [
    PlayCommand,
    {
      provide: Shoukaku,
      inject: [ConfigService, INJECT_DISCORD_CLIENT],
      useFactory: (config: ConfigService, client: Client) => {
        const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), [
          {
            name: 'default',
            url: `${config.get('LAVALINK_HOST')}:${config.get(
              'LAVALINK_PORT',
            )}`,
            auth: config.get('LAVALINK_PASSWORD'),
          },
        ]);

        shoukaku.on('error', (_, err) => console.error(err));

        return shoukaku;
      },
    },
  ],
})
export class MusicModule {}
