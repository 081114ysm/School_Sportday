# Trouble Shooting

---

## Lighthouse 성능 최적화

- 아래 결과와 같이 Performance 점수와 Speed Index가 낮았음.
    - Google Fonts `<link rel="stylesheet">` 제거 → `next/font/google` 자가 호스팅 교체로 렌더 블로킹 제거, Speed Index 개선
    - `optimizePackageImports: ['lucide-react']` 설정으로 아이콘 라이브러리 트리쉐이킹 적용, 미사용 JS 코드 절감
    - Noto Sans KR 로드 웨이트 5종 → 3종으로 축소하여 미사용 CSS 용량 절감

성능 개선 전

- Performance 점수 : 낮음
- Speed Index : **3.1 s**
- 미사용 CSS : **113 KiB**
- 미사용 JS : **67 KiB**
- Google Fonts 외부 링크 방식으로 렌더 블로킹 발생

성능 개선 후

- Performance 점수 : **100**
- First Contentful Paint : **0.5 s**
- Largest Contentful Paint : **0.6 s**
- Total Blocking Time : **10 ms**
- Cumulative Layout Shift : **0**
- Speed Index : **0.7 s** (3.1 s → 0.7 s, 2.4 s 단축)
- 미사용 CSS : **26 KiB** (113 KiB → 26 KiB, 87 KiB 절감)
- 미사용 JS : **66 KiB** (67 KiB → 66 KiB 절감)
- Google Fonts 렌더 블로킹 제거 (`next/font` 자가 호스팅)