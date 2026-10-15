import { Module } from '@nestjs/common';
import { SongsModule } from '../songs/songs.module';
import { PlaylistController } from './playlist.controller';

@Module({
  imports: [SongsModule],
  controllers: [PlaylistController],
})
export class PlaylistModule {}
