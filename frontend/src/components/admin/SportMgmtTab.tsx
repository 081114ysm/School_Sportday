'use client';

import { useEffect, useState } from 'react';
import styles from '@/app/admin/admin.module.css';
import {
  DEFAULT_SPORTS,
  getCustomSports,
  setCustomSports,
} from './adminConstants';

export function SportMgmtTab() {
  const [custom, setCustom] = useState<string[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    setCustom(getCustomSports());
    const onChange = () => setCustom(getCustomSports());
    window.addEventListener('sportday:customSportsChanged', onChange);
    return () => window.removeEventListener('sportday:customSportsChanged', onChange);
  }, []);

  const add = () => {
    const name = input.trim();
    if (!name) return;
    if (DEFAULT_SPORTS.includes(name) || custom.includes(name)) {
      alert('이미 존재하는 종목입니다.');
      return;
    }
    const next = [...custom, name];
    setCustom(next);
    setCustomSports(next);
    setInput('');
  };

  const remove = (name: string) => {
    if (!confirm(`"${name}" 종목을 삭제하시겠습니까?`)) return;
    const next = custom.filter((s) => s !== name);
    setCustom(next);
    setCustomSports(next);
  };

  return (
    <div>
      <h2 className={styles.adminSectionTitle}>{'\uD83C\uDFC5'} 종목 관리</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          className={styles.formInput}
          type="text"
          placeholder="새 종목 이름"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add();
          }}
          style={{ flex: 1 }}
        />
        <button className={styles.formSubmitBtn} onClick={add}>
          추가
        </button>
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>기본 종목</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {DEFAULT_SPORTS.map((s) => (
          <span
            key={s}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text2)',
            }}
          >
            {s}
          </span>
        ))}
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>사용자 추가 종목</h3>
      {custom.length === 0 ? (
        <div className={styles.noData}>추가된 종목이 없습니다</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {custom.map((s) => (
            <div
              key={s}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 10,
              }}
            >
              <span style={{ fontWeight: 700 }}>{s}</span>
              <button
                onClick={() => remove(s)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: '#fef2f2',
                  color: '#b91c1c',
                  border: '1px solid #fecaca',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
