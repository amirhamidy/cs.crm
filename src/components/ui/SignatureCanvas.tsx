"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser } from "lucide-react";

const W = 700;
const H = 240;

interface Props {
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
}

export default function SignatureCanvas({ onChange, disabled = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    ctx.fillStyle = "#111827";
  }, []);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = point(e);
    last.current = p;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || disabled || !last.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    setHasInk(true);
    onChange(canvasRef.current?.toDataURL("image/png") ?? null);
  };

  const clear = () => {
    const c = canvasRef.current;
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
    onChange(null);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-indigo-500/30 bg-white">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        aria-label="محل رسم امضا"
        className={`block h-auto w-full touch-none ${disabled ? "cursor-not-allowed opacity-60" : "cursor-crosshair"}`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
      />
      {!hasInk && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[12px] font-semibold text-gray-300">
          اینجا امضا کنید
        </span>
      )}
      <button
        type="button"
        onClick={clear}
        disabled={disabled || !hasInk}
        aria-label="پاک کردن امضا"
        title="پاک کردن امضا"
        className="absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-xl bg-black/5 text-slate-500 hover:bg-black/10 disabled:opacity-40"
      >
        <Eraser size={14} />
      </button>
    </div>
  );
}
