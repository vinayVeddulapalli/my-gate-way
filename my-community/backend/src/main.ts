import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS for local Next.js frontend and mobile emulators
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global DTO Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('MyCommunity API')
    .setDescription('Enterprise-grade Gated Community Security & Management Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.log(`================================================================`);
  logger.log(`🚀 MyCommunity Backend API is running on: http://localhost:${port}`);
  logger.log(`📑 Interactive Swagger API Documentation: http://localhost:${port}/api/docs`);
  logger.log(`================================================================`);
}

bootstrap();
