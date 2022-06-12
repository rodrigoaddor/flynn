import { InjectDiscordClient } from '@discord-nestjs/core';
import { Controller, Get } from '@nestjs/common';
import { Client } from 'discord.js';

@Controller()
export class AppController {
  constructor(@InjectDiscordClient() private readonly discord: Client) {}

  @Get('status')
  async status() {
    const guilds = await this.discord.guilds.fetch();

    return {
      status: 'ok',
      guilds: guilds.size,
    };
  }
}
