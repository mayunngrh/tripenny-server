import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3000);
  console.log('\nServer running at http://localhost:3000');
  console.log(
    'POST http://localhost:3000/crawler/crawl?lat=-8.7211&lon=115.1691&category=restaurant&radius=10000',
  );
  console.log('GET  http://localhost:3000/crawler/places\n');
}

bootstrap();
