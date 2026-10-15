import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  // 0.0.0.0 so the server is reachable inside Render's container.
  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
void bootstrap();
