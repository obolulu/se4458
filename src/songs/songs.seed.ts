import { Song } from './entities/song.entity';

// Fixed ids so the Swagger examples point at a song that always exists.
export const EXAMPLE_SONG_ID = 'a1b2c3d4-0001-4000-8000-000000000001';

// The five songs from the assignment mockup. Album names are not shown in the
// mockup; the real album names are used so search by album has data.
const SEED_SONGS: Song[] = [
  {
    id: EXAMPLE_SONG_ID,
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 212,
    genre: 'Pop',
    isFavorite: true,
    position: 1,
    coverUrl: 'https://picsum.photos/seed/blinding-lights/300',
  },
  {
    id: 'a1b2c3d4-0002-4000-8000-000000000002',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    duration: 220,
    genre: 'Pop',
    isFavorite: false,
    position: 2,
    coverUrl: 'https://picsum.photos/seed/levitating/300',
  },
  {
    id: 'a1b2c3d4-0003-4000-8000-000000000003',
    title: 'Watermelon Sugar',
    artist: 'Harry Styles',
    album: 'Fine Line',
    duration: 214,
    genre: 'Pop',
    isFavorite: true,
    position: 3,
    coverUrl: 'https://picsum.photos/seed/watermelon-sugar/300',
  },
  {
    id: 'a1b2c3d4-0004-4000-8000-000000000004',
    title: 'Save Your Tears',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 246,
    genre: 'R&B',
    isFavorite: false,
    position: 4,
    coverUrl: 'https://picsum.photos/seed/save-your-tears/300',
  },
  {
    id: 'a1b2c3d4-0005-4000-8000-000000000005',
    title: 'Peaches',
    artist: 'Justin Bieber',
    album: 'Justice',
    duration: 154,
    genre: 'Pop',
    isFavorite: true,
    position: 5,
    coverUrl: 'https://picsum.photos/seed/peaches/300',
  },
];

// Fresh copies, so each app instance (and each test) starts from the same data.
export function createSeedSongs(): Song[] {
  return SEED_SONGS.map((song) => ({ ...song }));
}
