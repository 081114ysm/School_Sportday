# School_Sportday

학교 공식 체육대회 실시간 스코어보드.
- Frontend: Next.js (Vercel)
- Backend: NestJS + Socket.IO (AWS EC2)
- DB: Postgres (AWS RDS) / SQLite (로컬 개발)

## 로컬 개발

```bash
# 백엔드
cd backend && npm install && npm run start:dev

# 프론트엔드 (별도 터미널)
cd frontend && npm install && npm run dev
```

환경변수는 각각 `backend/.env.example`, `frontend/.env.example` 참고.

## 배포 가이드 (Vercel + AWS)

### 1. AWS — 백엔드 환경변수 설정
EC2 인스턴스의 `.env` 또는 환경변수에 아래 항목 설정:

| 변수명 | 값 |
|---|---|
| `DATABASE_URL` | Postgres 연결 URL |
| `FRONTEND_URL` | `https://your-app.vercel.app` (Vercel 배포 후 추가) |
| `ADMIN_TOKEN` | 임의의 강력한 비밀값 |
| `VAPID_PUBLIC_KEY` | (로컬에서 생성한 VAPID 공개키) |
| `VAPID_PRIVATE_KEY` | (로컬에서 생성한 VAPID 비밀키) |
| `VAPID_SUBJECT` | `mailto:admin@yourdomain.com` |

> VAPID 키 생성: `node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(JSON.stringify(k,null,2))"`

### 2. Vercel — 프론트엔드 연결
1. [vercel.com](https://vercel.com) 에서 **Add New Project → GitHub Repo** 선택
2. **Root Directory** 를 `frontend` 로 설정
3. Vercel이 `vercel.json` 을 감지해 Next.js 자동 빌드

### 3. Vercel 환경변수 입력
| 변수명 | 값 |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | `https://<AWS 백엔드 도메인>` |

### 4. CORS 마무리
Vercel 배포 완료 후 백엔드의 `FRONTEND_URL` 에 Vercel URL 추가:
```
FRONTEND_URL=https://your-app.vercel.app
```
여러 도메인을 허용하려면 콤마로 구분:
```
FRONTEND_URL=https://your-app.vercel.app,https://custom-domain.com
```

### Socket.IO 주의사항
- Vercel은 서버리스라 Socket.IO 서버를 호스팅할 수 없음 → Socket.IO 서버는 AWS 백엔드에서만 실행
- 프론트엔드 클라이언트가 `NEXT_PUBLIC_BACKEND_URL` 로 WebSocket 연결하므로 AWS 도메인을 정확히 입력할 것
