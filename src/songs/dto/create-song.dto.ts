import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateSongDto {
  @ApiProperty({ example: 'Starboy' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'The Weeknd' })
  @IsString()
  @IsNotEmpty()
  artist: string;

  @ApiPropertyOptional({ example: 'Starboy' })
  @IsOptional()
  @IsString()
  album?: string;

  @ApiProperty({ description: 'Length in seconds', example: 230, minimum: 1 })
  @IsInt()
  @Min(1)
  duration: number;

  @ApiProperty({ example: 'R&B' })
  @IsString()
  @IsNotEmpty()
  genre: string;

  @ApiPropertyOptional({ default: false, example: false })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @ApiPropertyOptional({ example: 'https://picsum.photos/seed/starboy/300' })
  @IsOptional()
  @IsUrl()
  coverUrl?: string;
}
