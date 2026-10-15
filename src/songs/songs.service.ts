import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateSongDto } from './dto/create-song.dto';
import { QuerySongsDto, SortField } from './dto/query-songs.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { Song } from './entities/song.entity';
import { PlaylistSummary } from './entities/playlist-summary.entity';
import { createSeedSongs } from './songs.seed';

// Fields that PATCH may not set to null (album and coverUrl may be cleared).
const NON_NULLABLE_FIELDS = [
  'title',
  'artist',
  'duration',
  'genre',
  'isFavorite',
] as const;

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} min ${seconds} sec`;
}

@Injectable()
export class SongsService {
  // In-memory store, always kept in playlist order (index + 1 === position).
  private songs: Song[] = createSeedSongs();

  findAll(query: QuerySongsDto = {}): Song[] {
    const {
      search,
      genre,
      favorite,
      sortBy = 'position',
      order = 'asc',
    } = query;
    let result = [...this.songs];

    if (search) {
      const term = search.toLowerCase();
      result = result.filter((song) =>
        [song.title, song.artist, song.album].some((field) =>
          field?.toLowerCase().includes(term),
        ),
      );
    }
    if (genre) {
      const wanted = genre.toLowerCase();
      result = result.filter((song) => song.genre.toLowerCase() === wanted);
    }
    if (favorite !== undefined) {
      result = result.filter((song) => song.isFavorite === favorite);
    }

    // Sorting works on the copy, so stored positions never change here.
    const direction = order === 'desc' ? -1 : 1;
    return result.sort((a, b) => {
      const cmp = compareBy(a, b, sortBy);
      return cmp !== 0 ? cmp * direction : a.position - b.position;
    });
  }

  findOne(id: string): Song {
    const song = this.songs.find((s) => s.id === id);
    if (!song) {
      throw new NotFoundException(`Song with id "${id}" not found`);
    }
    return song;
  }

  create(dto: CreateSongDto): Song {
    const song: Song = {
      ...dto,
      id: randomUUID(),
      isFavorite: dto.isFavorite ?? false,
      position: this.songs.length + 1,
    };
    this.songs.push(song);
    return song;
  }

  replace(id: string, dto: CreateSongDto): Song {
    const index = this.indexOf(id);
    const { position } = this.songs[index];
    const song: Song = {
      ...dto,
      id,
      isFavorite: dto.isFavorite ?? false,
      position,
    };
    this.songs[index] = song;
    return song;
  }

  update(id: string, dto: UpdateSongDto): Song {
    const song = this.findOne(id);
    const nullField = NON_NULLABLE_FIELDS.find((field) => dto[field] === null);
    if (nullField) {
      throw new BadRequestException(`${nullField} must not be null`);
    }
    const changes = Object.fromEntries(
      Object.entries(dto)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, value ?? undefined]),
    );
    return Object.assign(song, changes);
  }

  remove(id: string): Song {
    const index = this.indexOf(id);
    const [removed] = this.songs.splice(index, 1);
    this.renumber();
    return removed;
  }

  toggleFavorite(id: string): Song {
    const song = this.findOne(id);
    song.isFavorite = !song.isFavorite;
    return song;
  }

  move(id: string, position: number): Song[] {
    const index = this.indexOf(id);
    if (position < 1 || position > this.songs.length) {
      throw new BadRequestException(
        `position must be between 1 and ${this.songs.length}`,
      );
    }
    const [song] = this.songs.splice(index, 1);
    this.songs.splice(position - 1, 0, song);
    this.renumber();
    return [...this.songs];
  }

  getSummary(): PlaylistSummary {
    const totalDurationSeconds = this.songs.reduce(
      (sum, song) => sum + song.duration,
      0,
    );
    return {
      totalSongs: this.songs.length,
      totalDurationSeconds,
      totalDurationFormatted: formatDuration(totalDurationSeconds),
      favoriteCount: this.songs.filter((song) => song.isFavorite).length,
    };
  }

  getGenres(): string[] {
    // Dedupe case-insensitively, keeping the first spelling seen.
    const genres = new Map<string, string>();
    for (const { genre } of this.songs) {
      if (!genres.has(genre.toLowerCase())) {
        genres.set(genre.toLowerCase(), genre);
      }
    }
    return [...genres.values()].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' }),
    );
  }

  private indexOf(id: string): number {
    const index = this.songs.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new NotFoundException(`Song with id "${id}" not found`);
    }
    return index;
  }

  private renumber(): void {
    this.songs.forEach((song, index) => (song.position = index + 1));
  }
}

function compareBy(a: Song, b: Song, field: SortField): number {
  if (field === 'title' || field === 'artist') {
    return a[field].localeCompare(b[field], undefined, {
      sensitivity: 'base',
    });
  }
  return a[field] - b[field];
}
