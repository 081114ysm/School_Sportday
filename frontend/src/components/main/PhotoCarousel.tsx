'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './PhotoCarousel.module.css';

const IMAGES = [
  { src: '/carousel/mainImg1.png', alt: '체육대회 사진 1' },
  { src: '/carousel/mainImg2.png', alt: '체육대회 사진 2' },
  { src: '/carousel/mainImg3.png', alt: '체육대회 사진 3' },
];

const INTERVAL = 4000;

export default function PhotoCarousel() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((prev) => (prev + 1) % IMAGES.length);
    }, INTERVAL);
    return () => clearInterval(t);
  }, []);

  const go = (next: number) => {
    const n = (next + IMAGES.length) % IMAGES.length;
    setIdx(n);
  };

  return (
    <div className={styles.carousel}>
      <div className={styles.frame}>
        {IMAGES.map((img, i) => (
          <div
            key={img.src}
            className={`${styles.slide} ${i === idx ? styles.slideActive : ''}`}
            aria-hidden={i !== idx}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 960px) 100vw, 520px"
              className={styles.image}
              priority={i === 0}
            />
          </div>
        ))}

        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowPrev}`}
          onClick={() => go(idx - 1)}
          aria-label="이전 사진"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowNext}`}
          onClick={() => go(idx + 1)}
          aria-label="다음 사진"
        >
          <ChevronRight size={20} />
        </button>

        <div className={styles.dots}>
          {IMAGES.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.dot} ${i === idx ? styles.dotActive : ''}`}
              onClick={() => go(i)}
              aria-label={`${i + 1}번 사진으로 이동`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
