import Image from 'next/image';

export default function Loading() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: '#fff',
        zIndex: 9999,
      }}
    >
      <Image
        src="/logo.png"
        alt="경소마 로고"
        width={96}
        height={96}
        priority
        style={{ animation: 'splashPulse 1.4s ease-in-out infinite' }}
      />
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: '#0f172a',
          letterSpacing: '-0.01em',
        }}
      >
        경북소프트웨어마이스터고등학교
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: '#2bbf7e',
        }}
      >
        2026 체육대회 예선전
      </div>
      <style>{`
        @keyframes splashPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.94); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
