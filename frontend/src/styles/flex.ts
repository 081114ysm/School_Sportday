import type { CSSProperties } from 'react';

// 인라인 스타일 / styled 컴포넌트에서 재사용할 flex 프리셋.
export const flex = {
  row: { display: 'flex', flexDirection: 'row' } as CSSProperties,
  col: { display: 'flex', flexDirection: 'column' } as CSSProperties,
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,
  between: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as CSSProperties,
  start: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
  } as CSSProperties,
  end: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  } as CSSProperties,
  colCenter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,
} as const;
