// Client-side Web Push helpers. Subscribes the browser to the backend's VAPID
// push channel and mirrors the subscription to `/api/notifications/push/*`.

import { BASE_URL } from './config';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
  return output;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

async function getReg(): Promise<ServiceWorkerRegistration> {
  const reg =
    (await navigator.serviceWorker.getRegistration('/sw.js')) ||
    (await navigator.serviceWorker.register('/sw.js'));
  await navigator.serviceWorker.ready;
  return reg;
}

export async function currentPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await getReg();
  return reg.pushManager.getSubscription();
}

export async function enablePush(opts?: { userSub?: string | null; teamId?: number | null }) {
  if (!isPushSupported()) throw new Error('이 브라우저는 푸시 알림을 지원하지 않습니다.');

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('알림 권한이 거부되었습니다.');

  const keyRes = await fetch(`${BASE_URL}/api/notifications/push/public-key`);
  if (!keyRes.ok) throw new Error('VAPID 공개 키를 가져올 수 없습니다.');
  const { key } = (await keyRes.json()) as { key: string };
  if (!key) throw new Error('서버에 VAPID 공개 키가 없습니다.');

  const reg = await getReg();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key) as unknown as BufferSource,
    });
  }

  const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  const res = await fetch(`${BASE_URL}/api/notifications/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription: { endpoint: json.endpoint, keys: json.keys },
      userSub: opts?.userSub ?? null,
      teamId: opts?.teamId ?? null,
    }),
  });
  if (!res.ok) throw new Error('서버에 구독 등록을 실패했습니다.');
  return sub;
}

export async function disablePush() {
  const sub = await currentPushSubscription();
  if (!sub) return;
  try {
    await fetch(`${BASE_URL}/api/notifications/push/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
  } catch {
    /* ignore */
  }
  await sub.unsubscribe();
}

export async function sendTestPush(
  title = '테스트 알림',
  body = 'PWA 푸시 동작 확인',
): Promise<{ sent: number; failed: number }> {
  const sub = await currentPushSubscription();
  if (!sub) throw new Error('먼저 알림을 켜주세요.');
  const res = await fetch(`${BASE_URL}/api/notifications/push/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body, url: '/', endpoint: sub.endpoint }),
  });
  if (!res.ok) throw new Error('테스트 전송 실패');
  return res.json();
}
