import { plainToClass } from 'class-transformer';
import { IsDefined, IsEnum, IsInt, IsIP, IsOptional, IsString, validateSync } from 'class-validator';

export enum Env {
  PROD = 'production',
  DEV = 'development',
  TEST = 'testing',
}

export class Configuration {
  @IsEnum(Env)
  NODE_ENV: Env = Env.DEV;

  @IsIP('4')
  @IsOptional()
  HOST?: string;

  @IsInt()
  @IsOptional()
  PORT?: number = 3000;

  @IsString()
  TOKEN: string;

  @IsDefined()
  LAVALINK_HOST: string;

  @IsInt()
  LAVALINK_PORT: number;

  @IsString()
  LAVALINK_PASSWORD: string;

  @IsString()
  @IsOptional()
  DEV_GUILDS: string;
}

export const validateConfig = (config: Record<string, unknown>) => {
  const nulledConfig = Object.fromEntries(Object.entries(config).filter(([, value]) => value !== ''));

  const validatedConfig = plainToClass(Configuration, nulledConfig, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) throw new Error(errors.toString());

  return validatedConfig;
};
