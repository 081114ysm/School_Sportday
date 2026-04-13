import type { Metadata, Viewport } from 'next';
import { Bebas_Neue, Black_Ops_One, Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bebas',
});

const blackOpsOne = Black_Ops_One({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-black-ops',
});

const notoSansKR = Noto_Sans_KR({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto',
});

export const metadata: Metadata = {
  title: '경소마고 체육대회',
  description: '2026 경북소프트웨어마이스터고등학교 체육대회 예선전 실시간 운영 플랫폼',
  keywords: ['체육대회', '예선전', '경북소프트웨어마이스터고', '실시간', '스포츠'],
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#2bbf7e',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head />
      <body className={`${bebasNeue.variable} ${blackOpsOne.variable} ${notoSansKR.variable}`}>
        <Header />
        <main className="app-main">{children}</main>
        <Footer />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});}`,
          }}
        />
      </body>
    </html>
  );
}
