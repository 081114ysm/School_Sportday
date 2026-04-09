// 전역 디자인 토큰. CSS 변수와 매핑되는 값은 globals.css 와 동기화할 것.
export const theme = {
  color: {
    primary: '#2bbf7e',
    primaryDark: '#0a5433',
    primaryLight: '#6fe6a8',
    bg: '#f6f8fa',
    surface: '#ffffff',
    text: '#0d1117',
    textMuted: '#6b7280',
    border: '#e5e7eb',
    danger: '#ef4444',
    live: '#ef4444',
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    full: '9999px',
  },
  space: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
  },
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.06)',
    md: '0 4px 12px rgba(0,0,0,0.08)',
    lg: '0 10px 30px rgba(0,0,0,0.12)',
  },
  font: {
    sans: "'Noto Sans KR', system-ui, -apple-system, sans-serif",
    display: "'Bebas Neue', 'Noto Sans KR', sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
} as const;

export type Theme = typeof theme;
