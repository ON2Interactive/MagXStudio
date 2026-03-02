"use client";

import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { X } from "lucide-react";

type InspectorPanelProps = {
  visible: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onPositionChange: (next: { x: number; y: number }) => void;
  boundsRef: { current: HTMLDivElement | null };
  canvasSize: string;
  canvasSizeGroups: ReadonlyArray<{
    label: string;
    options: ReadonlyArray<{ value: string; label: string }>;
  }>;
  onCanvasSizeChange: (size: string) => void;
  customWidth: string;
  customHeight: string;
  onCustomWidthChange: (value: string) => void;
  onCustomHeightChange: (value: string) => void;
  gridPreset: string;
  gridPresetOptions: ReadonlyArray<{ value: string; label: string }>;
  onGridPresetChange: (preset: string) => void;
};

export function InspectorPanel({
  visible,
  onClose,
  position,
  onPositionChange,
  boundsRef,
  canvasSize,
  canvasSizeGroups,
  onCanvasSizeChange,
  customWidth,
  customHeight,
  onCustomWidthChange,
  onCustomHeightChange,
  gridPreset,
  gridPresetOptions,
  onGridPresetChange
}: InspectorPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
  } | null>(null);

  const clampToBounds = (nextX: number, nextY: number) => {
    const boundsEl = boundsRef.current;
    const panelEl = panelRef.current;
    if (!boundsEl || !panelEl) return { x: Math.max(0, nextX), y: Math.max(0, nextY) };
    const maxX = Math.max(0, boundsEl.clientWidth - panelEl.offsetWidth);
    const maxY = Math.max(0, boundsEl.clientHeight - panelEl.offsetHeight);
    return {
      x: Math.min(maxX, Math.max(0, nextX)),
      y: Math.min(maxY, Math.max(0, nextY))
    };
  };

  const onDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("button") || target?.closest("input")) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: position.x,
      startY: position.y
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const onDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startClientX;
    const deltaY = event.clientY - drag.startClientY;
    onPositionChange(clampToBounds(drag.startX + deltaX, drag.startY + deltaY));
  };

  const onDragEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  if (!visible) return null;

  return (
    <div
      ref={panelRef}
      className="absolute z-20 w-[332px] max-w-[calc(100%-2rem)] overflow-hidden rounded-2xl border border-black/70 bg-[radial-gradient(circle_at_top_left,#2f3136_0%,#1d1f23_45%,#17181b_100%)] text-white/92 shadow-[0_28px_70px_rgba(0,0,0,0.58)]"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div
        className="flex cursor-grab items-center justify-start border-b border-white/10 px-3 py-2 active:cursor-grabbing"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Close inspector panel"
            title="Close Inspector panel"
            onClick={onClose}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/25 text-white/70 transition hover:bg-black/40 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="h-6 w-px bg-white/20" />
          <div className="rounded-md bg-white/12 px-3 py-1 text-[15px] font-semibold leading-none tracking-tight">
            Inspector
          </div>
        </div>
      </div>
      <div className="space-y-2 border-y border-white/10 bg-black/20 px-3 py-3">
        <div className="text-[11px] font-medium tracking-[0.08em] text-white/55">Canvas</div>
        <div className="relative h-9 rounded-md bg-white/14">
          <select
            aria-label="Canvas size"
            title="Canvas size"
            value={canvasSize}
            onChange={(event) => onCanvasSizeChange(event.target.value)}
            className="h-full w-full appearance-none rounded-md bg-transparent px-3 text-[13px] text-white/92 focus-visible:outline-none"
          >
            {canvasSizeGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#23262c] text-white">
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="pt-2 text-[11px] font-medium tracking-[0.08em] text-white/55">Custom Size</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative h-9 rounded-md bg-white/14">
            <input
              type="text"
              inputMode="decimal"
              value={customWidth}
              onChange={(event) => onCustomWidthChange(event.target.value)}
              aria-label="Custom width in inches"
              title="Custom width in inches"
              placeholder="W (in)"
              className="h-full w-full rounded-md border-0 bg-transparent px-3 text-[13px] text-white/92 placeholder:text-white/45 focus-visible:outline-none"
            />
          </div>
          <div className="relative h-9 rounded-md bg-white/14">
            <input
              type="text"
              inputMode="decimal"
              value={customHeight}
              onChange={(event) => onCustomHeightChange(event.target.value)}
              aria-label="Custom height in inches"
              title="Custom height in inches"
              placeholder="H (in)"
              className="h-full w-full rounded-md border-0 bg-transparent px-3 text-[13px] text-white/92 placeholder:text-white/45 focus-visible:outline-none"
            />
          </div>
        </div>
        <div className="pt-2 text-[11px] font-medium tracking-[0.08em] text-white/55">Grid Preset</div>
        <div className="relative h-9 rounded-md bg-white/14">
          <select
            aria-label="Grid preset"
            title="Grid preset"
            value={gridPreset}
            onChange={(event) => onGridPresetChange(event.target.value)}
            className="h-full w-full appearance-none rounded-md bg-transparent px-3 text-[13px] text-white/92 focus-visible:outline-none"
          >
            {gridPresetOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#23262c] text-white">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
