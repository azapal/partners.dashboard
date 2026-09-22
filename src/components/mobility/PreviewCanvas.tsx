import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A pannable, zoomable surface — the thing that makes showing eight phones at
 * once workable.
 *
 * Zoom is applied as a CSS transform on an inner layer rather than by resizing
 * anything, so the phones stay a single DOM render at any scale and the text
 * inside them stays crisp. Wheel zooms *at the cursor* (the standard design-tool
 * behaviour: the point under the pointer stays put), and plain drag pans, since
 * there is nothing else to drag here.
 *
 * `scale` is clamped: below ~0.2 the frames are unreadable smudges and above 3
 * you are inspecting anti-aliasing, neither of which is a useful place to be.
 */

const MIN = 0.2;
const MAX = 3;
const clamp = (n: number) => Math.min(MAX, Math.max(MIN, n));

export const PreviewCanvas = ({
  children,
  onReset,
}: {
  children: ReactNode;
  onReset?: () => void;
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.75);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const fit = useCallback(() => {
    setScale(0.75);
    setPan({ x: 0, y: 0 });
    onReset?.();
  }, [onReset]);

  // Non-passive so the page doesn't scroll while zooming the canvas. React's
  // synthetic onWheel is passive by default, hence the manual listener.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      setScale((prev) => {
        const next = clamp(prev * (e.deltaY < 0 ? 1.12 : 1 / 1.12));
        // Keep whatever sits under the cursor under the cursor.
        setPan((p) => ({
          x: cx - ((cx - p.x) * next) / prev,
          y: cy - ((cy - p.y) * next) / prev,
        }));
        return next;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const zoomBy = (factor: number) =>
    setScale((prev) => {
      const next = clamp(prev * factor);
      const el = viewportRef.current;
      if (el) {
        const { width, height } = el.getBoundingClientRect();
        setPan((p) => ({
          x: width / 2 - ((width / 2 - p.x) * next) / prev,
          y: height / 2 - ((height / 2 - p.y) * next) / prev,
        }));
      }
      return next;
    });

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-100">
      <div
        ref={viewportRef}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
          setDragging(true);
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setPan({
            x: drag.current.px + (e.clientX - drag.current.x),
            y: drag.current.py + (e.clientY - drag.current.y),
          });
        }}
        onPointerUp={() => { drag.current = null; setDragging(false); }}
        onPointerLeave={() => { drag.current = null; setDragging(false); }}
        className={`h-[min(70vh,640px)] w-full touch-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{
          backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      >
        <div
          className="origin-top-left p-10"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transition: dragging ? "none" : "transform 90ms ease-out",
            width: "max-content",
          }}
        >
          {children}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.25)}
          aria-label="Zoom out"
          className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <i className="ri-subtract-line text-base" />
        </button>
        <span className="pointer-events-auto w-12 text-center text-[11px] font-semibold tabular-nums text-slate-600">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomBy(1.25)}
          aria-label="Zoom in"
          className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <i className="ri-add-line text-base" />
        </button>
        <span className="mx-0.5 h-5 w-px bg-slate-200" />
        <button
          type="button"
          onClick={fit}
          className="pointer-events-auto rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
        >
          Reset
        </button>
      </div>

      <p className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-slate-400">
        Scroll to zoom · drag to pan
      </p>
    </div>
  );
};
