'use client';

import { useState, useEffect } from 'react';

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  colorClass: string;
  bgClass: string;
  totalSeconds: number;
}

export function useCountdown(expiryAt?: string): CountdownState {
  const [state, setState] = useState<CountdownState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    colorClass: 'text-emerald-500',
    bgClass: 'bg-emerald-500/10',
    totalSeconds: 0,
  });

  useEffect(() => {
    if (!expiryAt) return;

    const calculate = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiryAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setState({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          colorClass: 'text-rose-500',
          bgClass: 'bg-rose-500/10',
          totalSeconds: 0,
        });
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let colorClass = 'text-emerald-500';
      let bgClass = 'bg-emerald-500/10';
      if (days < 3) {
        colorClass = 'text-rose-500 animate-pulse';
        bgClass = 'bg-rose-500/10';
      } else if (days < 7) {
        colorClass = 'text-amber-500';
        bgClass = 'bg-amber-500/10';
      }

      setState({ days, hours, minutes, seconds, isExpired: false, colorClass, bgClass, totalSeconds });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [expiryAt]);

  return state;
}
