import { DiscordModule } from '@discord-nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Intents } from 'discord.js';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PingCommand } from './commands/ping.command';
import { validateConfig } from './config.validator';
import { MusicModule } from './music/music.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: validateConfig,
      cache: true,
      isGlobal: true,
    }),
    DiscordModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        token: config.get<string>('TOKEN'),
        discordClientOptions: {
          intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES],
        },
        registerCommandOptions: [{ forGuild: '819258123940003881' }],
      }),
    }),
    MusicModule,
  ],
  controllers: [AppController],
  providers: [AppService, PingCommand],
  exports: [DiscordModule],
})
export class AppModule {}
