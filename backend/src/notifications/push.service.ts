import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as webpush from 'web-push';
import { PushSubscription } from './push-subscription.entity';

const VAPID_FILE = path.resolve(process.cwd(), '.vapid.json');
// VAPID_SUBJECT 환경변수가 없으면 기본값 사용
const SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:admin@sportday.local';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private publicKey = '';
  private privateKey = '';

  constructor(
    @InjectRepository(PushSubscription)
    private readonly repo: Repository<PushSubscription>,
  ) {}

  onModuleInit() {
    this.loadOrGenerateVapid();
    webpush.setVapidDetails(SUBJECT, this.publicKey, this.privateKey);
    this.logger.log(
      `Web Push ready. VAPID public key: ${this.publicKey.slice(0, 16)}…`,
    );
  }

  getPublicKey(): string {
    return this.publicKey;
  }

  private loadOrGenerateVapid() {
    // 환경변수로 VAPID 키를 주입한 경우 우선 사용
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      this.publicKey = process.env.VAPID_PUBLIC_KEY;
      this.privateKey = process.env.VAPID_PRIVATE_KEY;
      this.logger.log('VAPID keys loaded from environment variables');
      return;
    }
    // 로컬 개발: .vapid.json 파일에서 로드하거나 새로 생성
    if (fs.existsSync(VAPID_FILE)) {
      try {
        const j = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf8'));
        if (j.publicKey && j.privateKey) {
          this.publicKey = j.publicKey;
          this.privateKey = j.privateKey;
          return;
        }
      } catch {
        /* fall through */
      }
    }
    const keys = webpush.generateVAPIDKeys();
    this.publicKey = keys.publicKey;
    this.privateKey = keys.privateKey;
    fs.writeFileSync(VAPID_FILE, JSON.stringify(keys, null, 2));
    this.logger.log(`Generated new VAPID keys at ${VAPID_FILE}`);
  }

  async saveSubscription(
    sub: webpush.PushSubscription,
    userSub: string | null = null,
    teamId: number | null = null,
  ): Promise<PushSubscription> {
    const entity = this.repo.create({
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userSub,
      teamId,
    });
    return this.repo.save(entity);
  }

  async deleteByEndpoint(endpoint: string): Promise<void> {
    await this.repo.delete({ endpoint });
  }

  async listAll(): Promise<PushSubscription[]> {
    return this.repo.find();
  }

  async sendToAll(
    payload: PushPayload,
  ): Promise<{ sent: number; failed: number }> {
    const subs = await this.repo.find();
    return this.sendToList(subs, payload);
  }

  async sendToTeam(teamId: number, payload: PushPayload) {
    const subs = await this.repo.find({ where: { teamId } });
    return this.sendToList(subs, payload);
  }

  async sendToUser(userSub: string, payload: PushPayload) {
    const subs = await this.repo.find({ where: { userSub } });
    return this.sendToList(subs, payload);
  }

  async sendToEndpoint(endpoint: string, payload: PushPayload) {
    const sub = await this.repo.findOne({ where: { endpoint } });
    if (!sub) return { sent: 0, failed: 0 };
    return this.sendToList([sub], payload);
  }

  private async sendToList(subs: PushSubscription[], payload: PushPayload) {
    let sent = 0;
    let failed = 0;
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(payload),
          );
          sent++;
        } catch (err: any) {
          failed++;
          // 404/410 = 구독 만료됨; 삭제 처리.
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await this.deleteByEndpoint(s.endpoint);
            this.logger.warn(
              `Pruned dead subscription ${s.endpoint.slice(0, 40)}…`,
            );
          } else {
            this.logger.error(
              `Push send failed: ${err?.statusCode ?? ''} ${err?.message ?? err}`,
            );
          }
        }
      }),
    );
    return { sent, failed };
  }
}
