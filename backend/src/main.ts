import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from "@nestjs/common";


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true, // Tüm adreslere izin verir (Sınav projesi için en hızlı çözüm)
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen(port);

  console.log(`✅ Backend running on: http://localhost:${port}`);
}
bootstrap();
