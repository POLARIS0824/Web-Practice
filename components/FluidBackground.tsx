/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useEffect, useRef } from 'react';

/**
 * Canvas 星空背景：
 * - 星星按视差深度缓慢流动（近处快、远处慢），方向向右下倾斜。
 * - 平时只画星点 + 微弱拖尾；按住鼠标/手指时流动加速，恒星拖出长条星轨。
 * - 松开后速度缓慢回落，星轨被残影缓冲自然拖成长曝光的效果。
 */
const FluidBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let rafId = 0;
    let lastTime = performance.now();

    // ---- 可调参数 ----------------------------------------------------------
    const TILT = 0.38;          // 流动方向与水平轴的夹角（弧度），>0 表示向右下
    const BASE_SPEED = 0.014;   // 基准流速：每秒横穿屏幕对角线的比例
    const HOLD_SPEED = 0.55;    // 按住时的目标流速
    const EASE_UP = 2.4;        // 按下后速度爬升速率（越大越跟手）
    const EASE_DOWN = 0.9;      // 松开后速度回落速率（越小余韵越长）
    // ------------------------------------------------------------------------

    const dirX = Math.cos(TILT);
    const dirY = Math.sin(TILT);
    const perpX = -dirY;
    const perpY = dirX;
    // 屏幕对角线长度（px）：星星沿对角线走，不会在上游侧留下空洞
    const diag = Math.hypot(width, height);

    interface Star {
      u: number;   // 沿流动方向的位置 [0,1)，对应 0..diag
      v: number;   // 垂直于流动方向的偏移 [0,1)，对应 0..diag
      depth: number; // 视差深度 0.25~1，越大越近、越快、越亮
      size: number;
      phase: number;
      freq: number;
    }

    let stars: Star[] = [];
    const STAR_COLORS = ['#ffffff', '#cfe4ff', '#ffeecf', '#ffd6ec', '#d8fff4'];

    const spawn = (initial: boolean): Star => ({
      u: initial ? Math.random() : -0.04 - Math.random() * 0.06,
      v: Math.random(),
      depth: 0.25 + Math.pow(Math.random(), 1.5) * 0.75,
      size: 0.4 + Math.random() * 1.6,
      phase: Math.random() * Math.PI * 2,
      freq: 0.4 + Math.random() * 1.6,
    });

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(420, Math.max(160, Math.floor((width * height) / 4200)));
      stars = Array.from({ length: count }, () => spawn(true));
      ctx.fillStyle = '#070a1c';
      ctx.fillRect(0, 0, width, height);
    };
    resize();

    // ---- 按住检测（鼠标 + 触摸）-------------------------------------------
    let holding = false;
    let speed = BASE_SPEED;

    const isInteractive = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      return !!el?.closest?.('button, a, input, textarea, select, [data-hover]');
    };
    const onDown = (e: Event) => {
      // 点在按钮/链接上时不抢交互
      if (!isInteractive(e.target)) holding = true;
    };
    const onUp = () => { holding = false; };

    window.addEventListener('mousedown', onDown);
    window.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    window.addEventListener('touchcancel', onUp);
    window.addEventListener('blur', onUp);
    window.addEventListener('resize', resize);

    // ---- 渲染循环 ----------------------------------------------------------
    const draw = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const target = holding ? HOLD_SPEED : BASE_SPEED;
      const k = holding ? EASE_UP : EASE_DOWN;
      speed += (target - speed) * (1 - Math.exp(-dt * k));

      // 用半透明背景覆盖上一帧：星轨随速度变长，透明度相应调低以防过曝
      const speedT = Math.min(1, Math.max(0, (speed - BASE_SPEED) / (HOLD_SPEED - BASE_SPEED)));
      const fade = 0.42 - speedT * 0.34;
      ctx.fillStyle = `rgba(7, 10, 28, ${fade})`;
      ctx.fillRect(0, 0, width, height);

      // 星星每帧前进的距离（屏幕对角线比例）
      const advance = speed * dt;

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        // 视差：远处慢、近处快
        const prevU = s.u;
        s.u += advance * s.depth;
        if (s.u > 1.04) {
          stars[i] = spawn(false); // 从上游重新进入，方向保持倾斜
          continue;
        }

        // 把 (u,v) 映射回屏幕坐标，中心对齐
        const cx = width / 2;
        const cy = height / 2;
        const x0 = cx + (prevU - 0.5) * diag * dirX + (s.v - 0.5) * diag * perpX;
        const y0 = cy + (prevU - 0.5) * diag * dirY + (s.v - 0.5) * diag * perpY;
        const x1 = cx + (s.u - 0.5) * diag * dirX + (s.v - 0.5) * diag * perpX;
        const y1 = cy + (s.u - 0.5) * diag * dirY + (s.v - 0.5) * diag * perpY;

        const twinkle = 0.55 + 0.45 * Math.sin(now / 1000 * s.freq * 2 + s.phase);
        const alpha = Math.min(1, s.depth * twinkle);
        const color = STAR_COLORS[i % STAR_COLORS.length];

        // 拖尾线段（星轨）：速度越快线段越长
        const trailBoost = 1 + speedT * 26;
        const tx = (x1 - x0) * trailBoost;
        const ty = (y1 - y0) * trailBoost;

        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha * (0.35 + speedT * 0.55);
        ctx.lineWidth = s.size * (0.5 + s.depth * 0.6);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1 - tx, y1 - ty);
        ctx.lineTo(x1, y1);
        ctx.stroke();

        // 星点本体
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x1, y1, s.size * (0.5 + s.depth * 0.6), 0, Math.PI * 2);
        ctx.fill();

        // 亮星加一圈淡淡的光晕
        if (s.depth > 0.85) {
          ctx.globalAlpha = alpha * 0.12;
          ctx.beginPath();
          ctx.arc(x1, y1, s.size * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 按住时整体轻微提亮，模拟长曝光累积
      if (speedT > 0.02) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = `rgba(150, 175, 255, ${speedT * 0.045})`;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.globalAlpha = 1;

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('touchstart', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('touchcancel', onUp);
      window.removeEventListener('blur', onUp);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#070a1c]">
      {/* 夜空底色：上方深空、下方微亮的地平线 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 120% 90% at 50% 110%, #1c2450 0%, #0d1230 45%, #070a1c 78%)',
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
};

export default FluidBackground;
