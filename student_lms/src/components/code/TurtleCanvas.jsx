import { useEffect, useRef } from 'react';

export default function TurtleCanvas({ commands = [] }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Reset and clear background
    ctx.fillStyle = '#0f172a'; // dark navy slate
    ctx.fillRect(0, 0, width, height);

    // Draw subtle grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Turtle State
    let x = width / 2;
    let y = height / 2;
    let angle = 0; // 0 degrees = facing right (east), standard turtle starts facing right
    let isPenDown = true;
    let strokeColor = '#38bdf8'; // sky blue
    let strokeWidth = 2;
    let isFilling = false;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (commands.length === 0) {
      // Draw initial turtle at center
      drawTurtleCursor(ctx, x, y, angle);
      return;
    }

    // Replay commands
    ctx.beginPath();
    ctx.moveTo(x, y);

    for (const cmd of commands) {
      if (cmd.action === 'forward') {
        const rad = (angle * Math.PI) / 180;
        const newX = x + cmd.dist * Math.cos(rad);
        const newY = y - cmd.dist * Math.sin(rad); // canvas Y is inverted

        if (isPenDown) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(newX, newY);
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
          ctx.stroke();
        }
        x = newX;
        y = newY;
      } else if (cmd.action === 'backward') {
        const rad = (angle * Math.PI) / 180;
        const newX = x - cmd.dist * Math.cos(rad);
        const newY = y + cmd.dist * Math.sin(rad);

        if (isPenDown) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(newX, newY);
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
          ctx.stroke();
        }
        x = newX;
        y = newY;
      } else if (cmd.action === 'left') {
        angle = (angle + cmd.angle) % 360;
      } else if (cmd.action === 'right') {
        angle = (angle - cmd.angle) % 360;
      } else if (cmd.action === 'penup') {
        isPenDown = false;
      } else if (cmd.action === 'pendown') {
        isPenDown = true;
      } else if (cmd.action === 'color') {
        strokeColor = cmd.color || '#38bdf8';
      } else if (cmd.action === 'pensize') {
        strokeWidth = Math.max(1, cmd.width || 2);
      } else if (cmd.action === 'circle') {
        const r = cmd.radius || 30;
        if (isPenDown) {
          ctx.beginPath();
          ctx.arc(x, y - r, r, 0, Math.PI * 2);
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
          ctx.stroke();
        }
      } else if (cmd.action === 'goto') {
        const targetX = width / 2 + (cmd.x || 0);
        const targetY = height / 2 - (cmd.y || 0);
        if (isPenDown) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(targetX, targetY);
          ctx.stroke();
        }
        x = targetX;
        y = targetY;
      }
    }

    // Draw turtle cursor at final destination
    drawTurtleCursor(ctx, x, y, angle);
  }, [commands]);

  function drawTurtleCursor(ctx, x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((-angle * Math.PI) / 180);

    // Draw little green turtle triangle
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -7);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, 7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 border border-slate-700 shadow-inner">
      <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-semibold text-slate-400">
        <span className="flex items-center gap-1.5 text-emerald-400">
          🐢 Kanvas Interaktif Turtle
        </span>
        <span className="text-[11px] text-slate-500">600 x 360 px</span>
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={360}
        className="w-full h-auto rounded-xl shadow-md border border-slate-800 max-h-[360px]"
      />
    </div>
  );
}
