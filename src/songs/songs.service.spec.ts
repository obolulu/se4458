import { BadRequestException, NotFoundException } from '@nestjs/common';
import { formatDuration, SongsService } from './songs.service';

const BLINDING_LIGHTS = 'a1b2c3d4-0001-4000-8000-000000000001';
const PEACHES = 'a1b2c3d4-0005-4000-8000-000000000005';

describe('SongsService', () => {
  let service: SongsService;

  beforeEach(() => {
    service = new SongsService();
  });

  const titles = () => service.findAll().map((s) => s.title);
  const positions = () => service.findAll().map((s) => s.position);

  it('starts with the five mockup songs in order', () => {
    expect(titles()).toEqual([
      'Blinding Lights',
      'Levitating',
      'Watermelon Sugar',
      'Save Your Tears',
      'Peaches',
    ]);
    expect(positions()).toEqual([1, 2, 3, 4, 5]);
  });

  it('moves a song down and shifts the others up', () => {
    service.move(BLINDING_LIGHTS, 3);
    expect(titles()).toEqual([
      'Levitating',
      'Watermelon Sugar',
      'Blinding Lights',
      'Save Your Tears',
      'Peaches',
    ]);
    expect(positions()).toEqual([1, 2, 3, 4, 5]);
  });

  it('moves a song up and shifts the others down', () => {
    service.move(PEACHES, 1);
    expect(titles()[0]).toBe('Peaches');
    expect(titles()[1]).toBe('Blinding Lights');
    expect(positions()).toEqual([1, 2, 3, 4, 5]);
  });

  it('rejects positions outside 1..n', () => {
    expect(() => service.move(PEACHES, 0)).toThrow(BadRequestException);
    expect(() => service.move(PEACHES, 6)).toThrow(BadRequestException);
  });

  it('renumbers after remove', () => {
    service.remove(BLINDING_LIGHTS);
    expect(positions()).toEqual([1, 2, 3, 4]);
    expect(() => service.findOne(BLINDING_LIGHTS)).toThrow(NotFoundException);
  });

  it('sorting does not change stored positions', () => {
    service.findAll({ sortBy: 'title', order: 'desc' });
    expect(positions()).toEqual([1, 2, 3, 4, 5]);
    expect(titles()[0]).toBe('Blinding Lights');
  });

  it('dedupes genres case-insensitively', () => {
    service.create({ title: 'X', artist: 'Y', duration: 60, genre: 'pop' });
    expect(service.getGenres()).toEqual(['Pop', 'R&B']);
  });

  it.each([
    [1046, '17 min 26 sec'],
    [59, '0 min 59 sec'],
    [3600, '60 min 0 sec'],
  ])('formats %i seconds as "%s"', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});
