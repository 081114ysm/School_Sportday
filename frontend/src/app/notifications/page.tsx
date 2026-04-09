'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { Bell } from 'lucide-react';
import {
  isPushSupported,
  enablePush,
  disablePush,
  currentPushSubscription,
  sendTestPush,
} from '@/services/push';

const btnStyle: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  fontSize: 13,
  cursor: 'pointer',
};
const btnPrimary: CSSProperties = {
  ...btnStyle,
  background: 'var(--green)',
  color: '#fff',
  border: '1px solid var(--green)',
  fontWeight: 700,
};

export default function NotificationsPage() {
  const [pushOn, setPushOn] = useState(false);
  const [pushMsg, setPushMsg] = useState<string>('');
  const [pushBusy, setPushBusy] = useState(false);
  const pushSupported = typeof window !== 'undefined' && isPushSupported();

  useEffect(() => {
    if (!pushSupported) return;
    currentPushSubscription().then((s) => setPushOn(!!s)).catch(() => {});
  }, [pushSupported]);

  const handleEnablePush = async () => {
    setPushBusy(true);
    setPushMsg('');
    try {
      await enablePush();
      setPushOn(true);
      setPushMsg('✅ 푸시 알림이 활성화되었습니다.');
    } catch (e: unknown) {
      setPushMsg(`❌ ${(e as Error)?.message ?? '활성화 실패'}`);
    } finally {
      setPushBusy(false);
    }
  };

  const handleDisablePush = async () => {
    setPushBusy(true);
    setPushMsg('');
    try {
      await disablePush();
      setPushOn(false);
      setPushMsg('🔕 푸시 알림이 해제되었습니다.');
    } catch (e: unknown) {
      setPushMsg(`❌ ${(e as Error)?.message ?? '해제 실패'}`);
    } finally {
      setPushBusy(false);
    }
  };

  const handleTestPush = async () => {
    setPushBusy(true);
    setPushMsg('');
    try {
      const r = await sendTestPush('🧪 테스트 알림', '이 메시지가 보이면 PWA 푸시가 정상입니다.');
      setPushMsg(`전송 완료 (sent ${r.sent}, failed ${r.failed})`);
    } catch (e: unknown) {
      setPushMsg(`❌ ${(e as Error)?.message ?? '전송 실패'}`);
    } finally {
      setPushBusy(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">알림</h1>
      <p className="page-subtitle">경기 시작 · 유튜브 라이브 시작 시 브라우저로 알림을 받습니다.</p>

      <div
        style={{
          padding: 16,
          border: '1px solid var(--border)',
          borderRadius: 12,
          background: 'var(--bg2)',
          marginBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Bell size={18} />
        <strong>PWA 푸시 알림</strong>
        {!pushSupported ? (
          <span style={{ color: 'var(--text2)' }}>
            이 브라우저는 지원하지 않습니다 (iOS는 홈화면 추가 후 사용).
          </span>
        ) : (
          <>
            <span style={{ color: pushOn ? 'var(--green)' : 'var(--text2)' }}>
              {pushOn ? '활성' : '비활성'}
            </span>
            {pushOn ? (
              <button onClick={handleDisablePush} disabled={pushBusy} style={btnStyle}>
                알림 끄기
              </button>
            ) : (
              <button onClick={handleEnablePush} disabled={pushBusy} style={btnPrimary}>
                알림 켜기
              </button>
            )}
            <button onClick={handleTestPush} disabled={pushBusy || !pushOn} style={btnStyle}>
              테스트 전송
            </button>
          </>
        )}
        {pushMsg && <span style={{ marginLeft: 'auto', fontSize: 13 }}>{pushMsg}</span>}
      </div>

      <details
        style={{
          padding: '12px 16px',
          border: '1px solid var(--border)',
          borderRadius: 12,
          background: 'var(--bg2)',
          marginBottom: 20,
        }}
      >
        <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
          📖 PWA 푸시 알림 사용 방법
        </summary>
        <ol
          style={{
            marginTop: 12,
            paddingLeft: 20,
            fontSize: 13,
            lineHeight: 1.8,
            color: 'var(--text2)',
          }}
        >
          <li>
            위 <strong>"알림 켜기"</strong> 버튼을 누르고 브라우저 권한 팝업에서{' '}
            <strong>허용</strong>을 선택하세요.
          </li>
          <li>
            옆의 <strong>"테스트 전송"</strong> 버튼으로 알림이 정상적으로 뜨는지 바로
            확인할 수 있습니다.
          </li>
          <li>
            사이트를 닫아도 경기가 <strong>LIVE</strong>로 전환되거나 유튜브 중계가
            시작되면 자동으로 푸시 알림이 도착합니다 (🔴 경기 시작 / 📺 라이브 시작).
          </li>
          <li>
            알림을 클릭하면 해당 유튜브 중계 또는 <strong>오늘 경기</strong> 페이지로
            바로 이동합니다.
          </li>
          <li>
            <strong>📱 아이폰 (iOS 16.4 이상)</strong> — Safari로 접속한 뒤 하단{' '}
            <strong>공유</strong> 버튼 → <strong>"홈 화면에 추가"</strong>로 앱을 설치해
            주세요. 홈 화면에서 앱을 열고 "알림 켜기"를 눌러야 푸시가 작동합니다.
          </li>
          <li>
            <strong>📱 안드로이드</strong> — Chrome으로 접속 후 주소창 우측의{' '}
            <strong>"앱 설치"</strong> 또는 메뉴 → <strong>"홈 화면에 추가"</strong>를
            누르면 앱처럼 사용할 수 있습니다. 일반 브라우저에서도 알림은 정상
            동작합니다.
          </li>
          <li>
            <strong>💻 PC</strong> — Chrome / Edge / Firefox에서 바로 동작합니다. 브라우저를
            닫아도 OS 알림 센터로 전달됩니다.
          </li>
          <li>
            더 이상 알림을 받고 싶지 않다면 <strong>"알림 끄기"</strong>로 언제든 해제할
            수 있습니다.
          </li>
        </ol>
      </details>
    </div>
  );
}
