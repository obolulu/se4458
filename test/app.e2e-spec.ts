import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/app.setup';
import { Song } from './../src/songs/entities/song.entity';

const BLINDING_LIGHTS = 'a1b2c3d4-0001-4000-8000-000000000001';
const LEVITATING = 'a1b2c3d4-0002-4000-8000-000000000002';
const PEACHES = 'a1b2c3d4-0005-4000-8000-000000000005';
const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

const newSong = {
  title: 'Starboy',
  artist: 'The Weeknd',
  album: 'Starboy',
  duration: 230,
  genre: 'R&B',
};

describe('Playlist API (e2e)', () => {
  let app: INestApplication<App>;

  // A fresh app per test, so the in-memory data starts from the seed each time.
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const listSongs = async (query = '') =>
    (await http().get(`/songs${query}`).expect(200)).body as Song[];

  describe('app', () => {
    it('redirects / to /api-docs', () =>
      http().get('/').expect(302).expect('Location', '/api-docs'));

    it('serves the Swagger page', () => http().get('/api-docs').expect(200));
  });

  describe('GET /songs', () => {
    it('returns the 5 seed songs in position order', async () => {
      const songs = await listSongs();
      expect(songs.map((s) => s.position)).toEqual([1, 2, 3, 4, 5]);
      expect(songs[0].title).toBe('Blinding Lights');
    });

    it('searches title, artist and album case-insensitively', async () => {
      expect(await listSongs('?search=weeknd')).toHaveLength(2);
      expect(await listSongs('?search=NOSTALGIA')).toHaveLength(1);
      expect(await listSongs('?search=sugar')).toHaveLength(1);
    });

    it('filters by genre and favorite', async () => {
      const rnb = await listSongs('?genre=r%26b');
      expect(rnb.map((s) => s.title)).toEqual(['Save Your Tears']);
      expect(await listSongs('?favorite=true')).toHaveLength(3);
      expect(await listSongs('?favorite=false')).toHaveLength(2);
    });

    it('combines search, genre and favorite', async () => {
      const songs = await listSongs('?search=weeknd&genre=pop&favorite=true');
      expect(songs.map((s) => s.title)).toEqual(['Blinding Lights']);
    });

    it('sorts by duration asc and desc', async () => {
      const asc = await listSongs('?sortBy=duration');
      expect(asc.map((s) => s.duration)).toEqual([154, 212, 214, 220, 246]);
      const desc = await listSongs('?sortBy=duration&order=desc');
      expect(desc.map((s) => s.duration)).toEqual([246, 220, 214, 212, 154]);
    });

    it('sorts by title A-Z like the mockup', async () => {
      const songs = await listSongs('?sortBy=title');
      expect(songs.map((s) => s.title)).toEqual([
        'Blinding Lights',
        'Levitating',
        'Peaches',
        'Save Your Tears',
        'Watermelon Sugar',
      ]);
    });

    it.each(['?sortBy=year', '?order=up', '?favorite=yes', '?page=2'])(
      'rejects bad query %s with 400',
      (query) => http().get(`/songs${query}`).expect(400),
    );
  });

  describe('GET /songs/:id', () => {
    it('returns one song', async () => {
      const res = await http().get(`/songs/${LEVITATING}`).expect(200);
      expect(res.body).toMatchObject({ title: 'Levitating', position: 2 });
    });

    it('returns 404 for an unknown id', () =>
      http().get(`/songs/${UNKNOWN_ID}`).expect(404));
  });

  describe('POST /songs', () => {
    it('creates a song at the end with a UUID and isFavorite false', async () => {
      const res = await http().post('/songs').send(newSong).expect(201);
      const song = res.body as Song;
      expect(song).toMatchObject({
        ...newSong,
        position: 6,
        isFavorite: false,
      });
      expect(song.id).toMatch(/^[0-9a-f-]{36}$/);
      await http().get(`/songs/${song.id}`).expect(200);
    });

    it.each([
      ['an unknown field', { ...newSong, foo: 'bar' }],
      ['an id', { ...newSong, id: 'abc' }],
      ['a missing title', { ...newSong, title: undefined }],
      ['an empty artist', { ...newSong, artist: '' }],
      ['a zero duration', { ...newSong, duration: 0 }],
      ['a string duration', { ...newSong, duration: '230' }],
      ['a non-integer duration', { ...newSong, duration: 1.5 }],
      ['an invalid coverUrl', { ...newSong, coverUrl: 'not a url' }],
    ])('rejects %s with 400', (_, body) =>
      http().post('/songs').send(body).expect(400),
    );
  });

  describe('PUT /songs/:id', () => {
    it('replaces all fields and keeps id and position', async () => {
      const res = await http()
        .put(`/songs/${LEVITATING}`)
        .send(newSong)
        .expect(200);
      expect(res.body).toMatchObject({
        ...newSong,
        id: LEVITATING,
        position: 2,
        isFavorite: false,
      });
      expect((res.body as Song).coverUrl).toBeUndefined();
    });

    it('requires all required fields', () =>
      http().put(`/songs/${LEVITATING}`).send({ title: 'Only' }).expect(400));

    it('returns 404 for an unknown id', () =>
      http().put(`/songs/${UNKNOWN_ID}`).send(newSong).expect(404));
  });

  describe('PATCH /songs/:id', () => {
    it('updates only the sent fields', async () => {
      const res = await http()
        .patch(`/songs/${LEVITATING}`)
        .send({ genre: 'Dance' })
        .expect(200);
      expect(res.body).toMatchObject({
        title: 'Levitating',
        genre: 'Dance',
        position: 2,
      });
    });

    it('clears album with null but rejects null title', async () => {
      const res = await http()
        .patch(`/songs/${LEVITATING}`)
        .send({ album: null })
        .expect(200);
      expect((res.body as Song).album).toBeUndefined();
      await http()
        .patch(`/songs/${LEVITATING}`)
        .send({ title: null })
        .expect(400);
    });

    it('rejects position changes through PATCH', () =>
      http().patch(`/songs/${LEVITATING}`).send({ position: 1 }).expect(400));

    it('returns 404 for an unknown id', () =>
      http().patch(`/songs/${UNKNOWN_ID}`).send({ genre: 'Pop' }).expect(404));
  });

  describe('DELETE /songs/:id', () => {
    it('returns the removed song and renumbers the rest', async () => {
      const res = await http().delete(`/songs/${BLINDING_LIGHTS}`).expect(200);
      expect((res.body as Song).title).toBe('Blinding Lights');
      const songs = await listSongs();
      expect(songs.map((s) => s.position)).toEqual([1, 2, 3, 4]);
      expect(songs[0].title).toBe('Levitating');
      await http().get(`/songs/${BLINDING_LIGHTS}`).expect(404);
    });

    it('returns 404 for an unknown id', () =>
      http().delete(`/songs/${UNKNOWN_ID}`).expect(404));
  });

  describe('PATCH /songs/:id/favorite', () => {
    it('toggles isFavorite', async () => {
      const first = await http()
        .patch(`/songs/${LEVITATING}/favorite`)
        .expect(200);
      expect((first.body as Song).isFavorite).toBe(true);
      const second = await http()
        .patch(`/songs/${LEVITATING}/favorite`)
        .expect(200);
      expect((second.body as Song).isFavorite).toBe(false);
    });

    it('returns 404 for an unknown id', () =>
      http().patch(`/songs/${UNKNOWN_ID}/favorite`).expect(404));
  });

  describe('PATCH /songs/:id/position', () => {
    it('moves a song and shifts the others', async () => {
      const res = await http()
        .patch(`/songs/${PEACHES}/position`)
        .send({ position: 1 })
        .expect(200);
      const songs = res.body as Song[];
      expect(songs.map((s) => s.title)).toEqual([
        'Peaches',
        'Blinding Lights',
        'Levitating',
        'Watermelon Sugar',
        'Save Your Tears',
      ]);
      expect(songs.map((s) => s.position)).toEqual([1, 2, 3, 4, 5]);
    });

    it.each([0, 6, 99, -1, 2.5, '2'])(
      'rejects position %p with 400',
      (position) =>
        http()
          .patch(`/songs/${PEACHES}/position`)
          .send({ position })
          .expect(400),
    );

    it('returns 404 for an unknown id', () =>
      http()
        .patch(`/songs/${UNKNOWN_ID}/position`)
        .send({ position: 1 })
        .expect(404));
  });

  describe('playlist', () => {
    it('GET /playlist/summary matches the mockup header', async () => {
      const res = await http().get('/playlist/summary').expect(200);
      expect(res.body).toEqual({
        totalSongs: 5,
        totalDurationSeconds: 1046,
        totalDurationFormatted: '17 min 26 sec',
        favoriteCount: 3,
      });
    });

    it('summary follows changes', async () => {
      await http().post('/songs').send(newSong).expect(201);
      await http().delete(`/songs/${PEACHES}`).expect(200);
      const res = await http().get('/playlist/summary').expect(200);
      expect(res.body).toEqual({
        totalSongs: 5,
        totalDurationSeconds: 1046 - 154 + 230,
        totalDurationFormatted: '18 min 42 sec',
        favoriteCount: 2,
      });
    });

    it('GET /genres returns distinct genres', async () => {
      const res = await http().get('/genres').expect(200);
      expect(res.body).toEqual(['Pop', 'R&B']);
    });
  });
});
