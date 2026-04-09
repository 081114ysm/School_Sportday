// 반응형 브레이크포인트. CSS Module 의 @media 쿼리에서는 직접 값을 쓰고,
// JS 측 계산(useMediaQuery 등)에서는 이 상수를 사용할 것.
export const breakpoint = {
  mobile: 480,
  tablet: 768,
  laptop: 1024,
  desktop: 1280,
  wide: 1536,
} as const;

export const media = {
  mobile: `(max-width: ${breakpoint.mobile}px)`,
  tablet: `(max-width: ${breakpoint.tablet}px)`,
  laptop: `(max-width: ${breakpoint.laptop}px)`,
  desktop: `(min-width: ${breakpoint.desktop}px)`,
} as const;

export type Breakpoint = keyof typeof breakpoint;
