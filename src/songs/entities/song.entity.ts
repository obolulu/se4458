import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Song {
  @ApiProperty({
    format: 'uuid',
    example: 'a1b2c3d4-0001-4000-8000-000000000001',
  })
  id: string;

  @ApiProperty({ example: 'Blinding Lights' })
  title: string;

  @ApiProperty({ example: 'The Weeknd' })
  artist: string;

  @ApiPropertyOptional({ example: 'After Hours' })
  album?: string;

  @ApiProperty({ description: 'Length in seconds', example: 212, minimum: 1 })
  duration: number;

  @ApiProperty({ example: 'Pop' })
  genre: string;

  @ApiProperty({ example: true })
  isFavorite: boolean;

  @ApiProperty({
    description: '1-based order in the playlist',
    example: 1,
    minimum: 1,
  })
  position: number;

  @ApiPropertyOptional({
    example: 'https://picsum.photos/seed/blinding-lights/300',
  })
  coverUrl?: string;
}
