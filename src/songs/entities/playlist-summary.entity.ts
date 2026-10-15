import { ApiProperty } from '@nestjs/swagger';

export class PlaylistSummary {
  @ApiProperty({ example: 5 })
  totalSongs: number;

  @ApiProperty({ example: 1046 })
  totalDurationSeconds: number;

  @ApiProperty({ example: '17 min 26 sec' })
  totalDurationFormatted: string;

  @ApiProperty({ example: 3 })
  favoriteCount: number;
}
