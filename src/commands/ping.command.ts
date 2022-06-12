import { Command, DiscordCommand } from '@discord-nestjs/core';
import { Injectable } from '@nestjs/common';

@Command({
  name: 'ping',
  description: 'Pong!',
})
@Injectable()
export class PingCommand implements DiscordCommand {
  handler() {
    return 'Pong!';
  }
}
