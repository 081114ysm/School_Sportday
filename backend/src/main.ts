// .env 로드 (Node 21.7+). 파일이 없으면 기본값으로 동작한다.
try {
  (process as unknown as { loadEnvFile?: (p?: string) => void }).loadEnvFile?.(
    '.env',
  );
} catch {
  /* .env 없음 — 기본값 사용 */
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

// FRONTEND_URL 환경변수: 콤마로 구분된 다중 origin 허용 (Railway → Vercel CORS)
function getAllowedOrigins(): string[] {
  const envVal = process.env.FRONTEND_URL;
  if (envVal) {
    return envVal.split(',').map((u) => u.trim()).filter(Boolean);
  }
  return ['http://localhost:3000', 'http://localhost:3001'];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const origins = getAllowedOrigins();

  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token', 'X-Admin-Token'],
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const port = parseInt(process.env.PORT || '4001', 10);
  await app.listen(port, '0.0.0.0');
console.log('CORS 설정 적용됨');
  console.log(
    `Backend running on port ${port} (origins: ${origins.join(', ')})`,
  );
}
bootstrap();
