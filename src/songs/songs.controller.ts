import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/error-response.dto';
import { CreateSongDto } from './dto/create-song.dto';
import { MovePositionDto } from './dto/move-position.dto';
import { QuerySongsDto } from './dto/query-songs.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { Song } from './entities/song.entity';
import { EXAMPLE_SONG_ID } from './songs.seed';
import { SongsService } from './songs.service';

const ApiSongId = () =>
  ApiParam({
    name: 'id',
    description: 'Song id (UUID)',
    example: EXAMPLE_SONG_ID,
  });

const ApiSongNotFound = () =>
  ApiNotFoundResponse({
    description: 'No song with this id',
    type: ErrorResponseDto,
  });

const ApiValidationError = (description = 'Invalid request body') =>
  ApiBadRequestResponse({ description, type: ErrorResponseDto });

@ApiTags('Songs')
@Controller('songs')
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Get()
  @ApiOperation({
    summary: 'List songs',
    description:
      'Returns songs in playlist order by default. All query parameters are optional and can be combined. Sorting does not change stored positions.',
  })
  @ApiOkResponse({ type: Song, isArray: true })
  @ApiValidationError('Invalid query parameter')
  findAll(@Query() query: QuerySongsDto): Song[] {
    return this.songsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one song' })
  @ApiSongId()
  @ApiOkResponse({ type: Song })
  @ApiSongNotFound()
  findOne(@Param('id') id: string): Song {
    return this.songsService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Add a song',
    description: 'The song is appended to the end of the playlist.',
  })
  @ApiCreatedResponse({ type: Song })
  @ApiValidationError()
  create(@Body() dto: CreateSongDto): Song {
    return this.songsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Replace a song',
    description:
      'Replaces all editable fields. Omitted optional fields are cleared; id and position are kept.',
  })
  @ApiSongId()
  @ApiOkResponse({ type: Song })
  @ApiValidationError()
  @ApiSongNotFound()
  replace(@Param('id') id: string, @Body() dto: CreateSongDto): Song {
    return this.songsService.replace(id, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a song',
    description:
      'Updates only the fields sent. Send null for album or coverUrl to clear them.',
  })
  @ApiSongId()
  @ApiOkResponse({ type: Song })
  @ApiValidationError()
  @ApiSongNotFound()
  update(@Param('id') id: string, @Body() dto: UpdateSongDto): Song {
    return this.songsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove a song',
    description:
      'Returns the removed song. Positions of the remaining songs are renumbered 1..n.',
  })
  @ApiSongId()
  @ApiOkResponse({ type: Song, description: 'The removed song' })
  @ApiSongNotFound()
  remove(@Param('id') id: string): Song {
    return this.songsService.remove(id);
  }

  @Patch(':id/favorite')
  @ApiOperation({ summary: 'Toggle favorite' })
  @ApiSongId()
  @ApiOkResponse({ type: Song })
  @ApiSongNotFound()
  toggleFavorite(@Param('id') id: string): Song {
    return this.songsService.toggleFavorite(id);
  }

  @Patch(':id/position')
  @ApiOperation({
    summary: 'Move a song',
    description:
      'Moves the song to the given position and shifts the others. Returns the whole playlist in its new order.',
  })
  @ApiSongId()
  @ApiOkResponse({ type: Song, isArray: true })
  @ApiValidationError('Position is not an integer between 1 and the song count')
  @ApiSongNotFound()
  move(@Param('id') id: string, @Body() dto: MovePositionDto): Song[] {
    return this.songsService.move(id, dto.position);
  }
}
