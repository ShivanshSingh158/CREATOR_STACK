import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  startDateStr: string; // ISO string
  hoursToWait?: number; // default 48
  onExpire?: () => void;
  title?: string;
}

export function CountdownTimer({ 
  startDateStr, 
  hoursToWait = 48, 
  onExpire,
  title = "Time Remaining"
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!startDateStr) return;

    const startDate = new Date(startDateStr).getTime();
    const targetDate = startDate + hoursToWait * 60 * 60 * 1000;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        if (onExpire) onExpire();
        return;
      }

      setTimeLeft({
        hours: Math.floor((difference / (1000 * 60 * 60))),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [startDateStr, hoursToWait, onExpire]);

  if (!timeLeft) return null;

  const isExpiringSoon = timeLeft.hours < 12; // Turn red if < 12 hours

  return (
    <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
      isExpiringSoon ? 'bg-rose-100 text-rose-700' : 'bg-white text-black'
    }`}>
      <Clock className={`w-4 h-4 ${isExpiringSoon ? 'text-rose-600 animate-pulse' : 'text-indigo-600'}`} />
      <div className="flex flex-col">
        <span className="text-[9px] font-bold uppercase tracking-widest leading-none mb-0.5 opacity-70">
          {title}
        </span>
        <div className="font-mono font-black text-sm tracking-widest flex items-center">
          <span>{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="opacity-50 mx-0.5">:</span>
          <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="opacity-50 mx-0.5">:</span>
          <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
        </div>
      </div>
    </div>
  );
}
