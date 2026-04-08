import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

// Simple shared-secret guard. Compares the `x-admin-token` request header
// against the `ADMIN_TOKEN` environment variable. Good enough for a small
// single-tenant operator panel; replace with real auth before going public.
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
