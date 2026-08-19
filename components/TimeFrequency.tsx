/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

interface TimeBreakdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const ENCOUNTER_DATE = new Date(2026, 5, 7, 0, 0, 0); // 2026-06-07 00:00:00 (Month 5 = June)
const REUNION_DATE = new Date(2026, 8, 5, 16, 0, 0);   // 2026-09-05 16:00:00 (Month 8 = September)

const breakdown = (ms: number): TimeBreakdown => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(totalSeconds / (3600 * 24)),
    hours: Math.floor((totalSeconds % (3600 * 24)) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
};

const format2 = (n: number) => String(n).padStart(2, '0');

const TimeFrequency: React.FC = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const countUp = breakdown(now.getTime() - ENCOUNTER_DATE.getTime());
  const countdown = breakdown(REUNION_DATE.getTime() - now.getTime());
  const isReunited = now.getTime() >= REUNION_DATE.getTime();

  const totalDuration = REUNION_DATE.getTime() - ENCOUNTER_DATE.getTime();
  const progressPercent = Math.min(100, Math.max(0, ((now.getTime() - ENCOUNTER_DATE.getTime()) / totalDuration) * 100));

  const clockUnits = [
    { value: countdown.days, label: '天 · DAYS', accent: false },
    { value: countdown.hours, label: '时 · HRS', accent: false },
    { value: countdown.minutes, label: '分 · MIN', accent: false },
    { value: countdown.seconds, label: '秒 · SEC', accent: true },
  ];

  return (
    <section id="chronicles" className="relative z-10 py-12 md:py-20 overflow-hidden">
      {/* Soft ambient glow, echoing the Letters section */}
      <div className="absolute top-[-10%] left-[-15%] w-[45vw] h-[45vw] bg-[#4fb7b3]/15 rounded-full blur-[60px] pointer-events-none will-change-transform" style={{ transform: 'translateZ(0)' }} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative">
        {/* Section header, mirroring the Moments section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6 mb-8 md:mb-12 px-4">
          <h2 className="text-4xl md:text-7xl font-heading font-bold uppercase leading-[0.9] drop-shadow-lg break-words">
            OUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a8fbd3] to-[#4fb7b3]">
              Chronicles
            </span>
          </h2>
          <div className="flex items-center gap-3 font-mono text-xs md:text-sm text-[#a8fbd3] tracking-[0.2em] uppercase bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/5">
            <span>Reunion</span>
            <span className="w-1.5 h-1.5 bg-[#4fb7b3] rounded-full animate-pulse" />
            <span>2026.09.05 16:00</span>
          </div>
        </div>

        {/* Single glass panel */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#637ab9] to-[#4fb7b3] rounded-3xl rotate-1 opacity-20 blur-2xl pointer-events-none" />
          <div className="relative rounded-3xl border border-white/10 bg-black/20 backdrop-blur-md px-6 py-8 md:px-14 md:py-12 shadow-2xl overflow-hidden">
            <p className="text-center font-mono text-xs uppercase tracking-[0.3em] text-gray-400 mb-6 md:mb-8">
              Until we meet again · 距离重逢
            </p>

            {isReunited ? (
              <div className="text-center py-4 md:py-8 mb-8 md:mb-10">
                <div className="text-4xl md:text-7xl font-heading font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#a8fbd3] to-[#4fb7b3]">
                  Now Together
                </div>
                <p className="mt-4 font-mono text-xs md:text-sm uppercase tracking-[0.3em] text-gray-300">
                  相逢在此刻 · Reunion achieved
                </p>
              </div>
            ) : (
              /* Single-line clock: DD : HH : MM : SS */
              <div className="flex items-start justify-center gap-1.5 md:gap-4 mb-8 md:mb-10 whitespace-nowrap">
                {clockUnits.map((unit, i) => (
                  <React.Fragment key={unit.label}>
                    {i > 0 && (
                      <span className="font-heading font-black text-4xl sm:text-5xl md:text-7xl leading-none text-white/25 select-none">:</span>
                    )}
                    <div className="flex flex-col items-center">
                      <div
                        className={`font-heading font-black text-4xl sm:text-5xl md:text-7xl tracking-tighter leading-none tabular-nums ${
                          unit.accent
                            ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#a8fbd3] to-[#4fb7b3]'
                            : 'text-white drop-shadow-lg'
                        }`}
                      >
                        {format2(unit.value)}
                      </div>
                      <div className="mt-2 font-mono text-[10px] md:text-xs uppercase tracking-[0.25em] text-[#a8fbd3]">
                        {unit.label}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Journey progress */}
            <div className="max-w-2xl mx-auto">
              <div className="flex justify-between font-mono text-[10px] md:text-xs uppercase tracking-[0.25em] text-gray-400 mb-3">
                <span>06.07 → 09.05</span>
                <span className="text-[#a8fbd3] font-bold">{progressPercent.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#4fb7b3] to-[#a8fbd3] transition-all duration-1000 ease-linear"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="h-px my-8 md:my-10 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Count-up, demoted to a single secondary line */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 font-mono text-xs md:text-sm uppercase tracking-[0.2em] text-gray-400">
              <span>相遇 · 2026.06.07</span>
              <span className="hidden sm:inline text-white/20">/</span>
              <span className="tabular-nums">
                已共度{' '}
                <span className="text-[#a8fbd3] font-bold">
                  {countUp.days} 天 {format2(countUp.hours)}:{format2(countUp.minutes)}:{format2(countUp.seconds)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TimeFrequency;
