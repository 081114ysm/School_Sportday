import type { CSSProperties } from 'react';

// 타이포그래피 프리셋. globals.css 의 Google Fonts 로드와 함께 사용한다.
export const font = {
  display: {
    fontFamily: "'Bebas Neue', 'Noto Sans KR', sans-serif",
    fontWeight: 700,
    letterSpacing: '0.02em',
  } as CSSProperties,
  h1: { fontSize: '2rem', fontWeight: 900, lineHeight: 1.2 } as CSSProperties,
  h2: { fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.25 } as CSSProperties,
  h3: { fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.3 } as CSSProperties,
  body: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.5 } as CSSProperties,
  caption: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.4 } as CSSProperties,
  numeric: {
    fontFamily: "'Black Ops One', 'Bebas Neue', monospace",
    fontVariantNumeric: 'tabular-nums',
  } as CSSProperties,
} as const;
