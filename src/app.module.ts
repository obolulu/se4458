import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PlaylistModule } from './playlist/playlist.module';
import { SongsModule } from './songs/songs.module';

@Module({
  imports: [SongsModule, PlaylistModule],
  controllers: [AppController],
})
export class AppModule {}
