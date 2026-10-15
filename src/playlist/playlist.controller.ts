import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlaylistSummary } from '../songs/entities/playlist-summary.entity';
import { SongsService } from '../songs/songs.service';

@ApiTags('Playlist')
@Controller()
export class PlaylistController {
  constructor(private readonly songsService: SongsService) {}

  @Get('playlist/summary')
  @ApiOperation({
    summary: 'Playlist summary',
    description:
      'Song count, total duration and favorite count (the "5 songs • 17 min 26 sec" header).',
  })
  @ApiOkResponse({ type: PlaylistSummary })
  getSummary(): PlaylistSummary {
    return this.songsService.getSummary();
  }

  @Get('genres')
  @ApiOperation({
    summary: 'List genres',
    description: 'Distinct genres in the playlist, sorted A-Z.',
  })
  @ApiOkResponse({
    type: String,
    isArray: true,
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: ['Pop', 'R&B'],
    },
  })
  getGenres(): string[] {
    return this.songsService.getGenres();
  }
}
