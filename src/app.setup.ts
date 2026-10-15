import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Shared by main.ts and the e2e tests, so tests run against the real config.
export function configureApp(app: INestApplication): void {
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Playlist API')
    .setDescription(
      'SE4458 Assignment 2 (Group 2). In-memory REST API for a music playlist: ' +
        'add, edit, remove, search, sort, filter by genre, favorite and reorder songs. ' +
        'Data resets when the server restarts.',
    )
    .setVersion('1.0')
    .addTag('Songs', 'Manage the songs in the playlist')
    .addTag('Playlist', 'Playlist-wide info: summary and genres')
    .addTag('Health', 'Service status')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
}
