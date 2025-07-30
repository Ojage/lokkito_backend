import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global route prefix
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: '*', // Adjust this to your needs
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  // Increase body size limits
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

  await app.listen(3000);
}
bootstrap();
