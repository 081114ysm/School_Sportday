import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

// 단순 공유 비밀 가드. 요청 헤더 `x-admin-token`을 환경 변수 `ADMIN_TOKEN`과 비교한다.
// 소규모 단일 테넌트 운영 패널에 적합하며, 공개 배포 전 실제 인증으로 교체해야 한다.
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const header = (req.headers['x-admin-token'] || req.headers['X-Admin-Token']) as
      | string
      | undefined;
    const expected = process.env.ADMIN_TOKEN || 'gbsw2026!!';
    if (!header || header !== expected) {
      throw new UnauthorizedException('Invalid admin token');
    }
    return true;
  }
}
