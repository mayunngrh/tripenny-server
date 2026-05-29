import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Trippenny / Crawler API')
    .setDescription('Endpoints for crawling and serving Bali places data')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`\nServer running at http://localhost:${port}`);
  console.log(`API docs at  http://localhost:${port}/api`);
  console.log(
    'POST http://localhost:3000/crawler/crawl?lat=-8.7211&lon=115.1691&category=restaurant&radius=10000',
  );
  console.log('GET  http://localhost:3000/crawler/places\n');
}

bootstrap();
