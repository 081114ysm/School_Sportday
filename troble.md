# Trouble Shooting

---

## Lighthouse 성능 최적화

- 아래 결과와 같이 Performance 점수와 Speed Index가 낮았음.
    - Google Fonts `<link rel="stylesheet">` 제거 → `next/font/google` 자가 호스팅 교체로 렌더 블로킹 제거, Speed Index 개선
    - `optimizePackageImports: ['lucide-react']` 설정으로 아이콘 라이브러리 트리쉐이킹 적용, 미사용 JS 67 KiB 절감
    - Noto Sans KR 로드 웨이트 5종 → 3종으로 축소하여 미사용 CSS 113 KiB 절감

| 지표 | 개선 전 | 개선 후 | 변화 |
|------|--------|--------|------|
| Performance 점수 | 낮음 | **100** | ▲ 대폭 향상 |
| First Contentful Paint | - | **0.5 s** | ▲ +10점 기여 |
| Largest Contentful Paint | - | **0.6 s** | ▲ +25점 기여 |
| Total Blocking Time | - | **10 ms** | ▲ +30점 기여 |
| Cumulative Layout Shift | - | **0** | ▲ +25점 기여 |
| Speed Index | 3.1 s | **0.7 s** | ▲ 2.4 s 단축 (+10점 기여) |
| 미사용 CSS | 113 KiB | **26 KiB** | ▼ 87 KiB 절감 |
| 미사용 JS | 67 KiB | **66 KiB** | ▼ 1 KiB 절감 |
