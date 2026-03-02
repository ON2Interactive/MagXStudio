"use client";

import { useRef } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent
} from "react";
import { Download, Image, Pencil, X } from "lucide-react";

type ImageFilterPreset = "none" | "vivid" | "warm" | "cool" | "mono" | "sepia";

type ImageEngineProps = {
  visible: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onPositionChange: (next: { x: number; y: number }) => void;
  boundsRef: { current: HTMLDivElement | null };
  selectedImageSrc: string | null;
  brightness: number;
  saturation: number;
  imageOffsetX: number;
  imageOffsetY: number;
  filterPreset: ImageFilterPreset;
  onBrightnessChange: (value: number) => void;
  onBrightnessCommit: (value: number) => void;
  onSaturationChange: (value: number) => void;
  onSaturationCommit: (value: number) => void;
  onImageOffsetXChange: (value: number) => void;
  onImageOffsetXCommit: (value: number) => void;
  onImageOffsetYChange: (value: number) => void;
  onImageOffsetYCommit: (value: number) => void;
  onFilterPresetChange: (value: ImageFilterPreset) => void;
  onReplaceClick?: () => void;
  onImageEditClick?: () => void;
  onDownloadClick?: () => void;
  canDownload?: boolean;
  controlsDisabled?: boolean;
};

export function ImageEngine({
  visible,
  onClose,
  position,
  onPositionChange,
  boundsRef,
  selectedImageSrc,
  brightness,
  saturation,
  imageOffsetX,
  imageOffsetY,
  filterPreset,
  onBrightnessChange,
  onBrightnessCommit,
  onSaturationChange,
  onSaturationCommit,
  onImageOffsetXChange,
  onImageOffsetXCommit,
  onImageOffsetYChange,
  onImageOffsetYCommit,
  onFilterPresetChange,
  onReplaceClick,
  onImageEditClick,
  onDownloadClick,
  canDownload = false,
  controlsDisabled = false
}: ImageEngineProps) {
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

  const normalizedBrightness = Math.max(0, Math.min(200, Math.round(brightness)));
  const normalizedSaturation = Math.max(0, Math.min(200, Math.round(saturation)));
  const normalizedImageOffsetX = Math.max(-100, Math.min(100, Math.round(imageOffsetX)));
  const normalizedImageOffsetY = Math.max(-100, Math.min(100, Math.round(imageOffsetY)));
  const commitRangeValue = (
    event: ReactPointerEvent<HTMLInputElement> | ReactKeyboardEvent<HTMLInputElement>,
    onCommit: (value: number) => void
  ) => {
    const parsed = Number.parseInt(event.currentTarget.value, 10);
    onCommit(Number.isFinite(parsed) ? parsed : 100);
  };
  const resetRangeValue = (
    value: number,
    onChange: (next: number) => void,
    onCommit: (next: number) => void
  ) => {
    onChange(value);
    onCommit(value);
  };

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
            aria-label="Close image panel"
            title="Close Image panel"
            onClick={onClose}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/25 text-white/70 transition hover:bg-black/40 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="h-6 w-px bg-white/20" />
          <div className="rounded-md bg-white/12 px-3 py-1 text-[15px] font-semibold leading-none tracking-tight">
            Image
          </div>
        </div>
      </div>
      <div className="space-y-2 border-y border-white/10 bg-black/20 px-3 py-3">
        {selectedImageSrc ? (
          <div className="mb-[20px] h-[100px] w-full overflow-hidden">
            <img src={selectedImageSrc} alt="Selected image thumbnail" className="h-full w-full object-cover" />
          </div>
        ) : null}
        <div className="space-y-2">
          <div className="mb-[10px] text-[11px] font-medium tracking-[0.08em] text-white/55">Adjustments</div>
          <div className="flex items-center justify-between text-[12px] text-white/72">
            <span>Brightness</span>
            <span>{normalizedBrightness}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={200}
            step={1}
            value={normalizedBrightness}
            onChange={(event) => onBrightnessChange(Number.parseInt(event.target.value, 10))}
            onPointerUp={(event) => commitRangeValue(event, onBrightnessCommit)}
            onPointerCancel={(event) => commitRangeValue(event, onBrightnessCommit)}
            onKeyUp={(event) => commitRangeValue(event, onBrightnessCommit)}
            onDoubleClick={() => resetRangeValue(100, onBrightnessChange, onBrightnessCommit)}
            disabled={controlsDisabled}
            aria-label="Image brightness"
            title="Image brightness"
            className="h-px w-full cursor-pointer appearance-none bg-neutral-500/70 accent-neutral-300 disabled:cursor-not-allowed disabled:opacity-45"
          />
          <div className="flex items-center justify-between text-[12px] text-white/72">
            <span>Saturation</span>
            <span>{normalizedSaturation}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={200}
            step={1}
            value={normalizedSaturation}
            onChange={(event) => onSaturationChange(Number.parseInt(event.target.value, 10))}
            onPointerUp={(event) => commitRangeValue(event, onSaturationCommit)}
            onPointerCancel={(event) => commitRangeValue(event, onSaturationCommit)}
            onKeyUp={(event) => commitRangeValue(event, onSaturationCommit)}
            onDoubleClick={() => resetRangeValue(100, onSaturationChange, onSaturationCommit)}
            disabled={controlsDisabled}
            aria-label="Image saturation"
            title="Image saturation"
            className="h-px w-full cursor-pointer appearance-none bg-neutral-500/70 accent-neutral-300 disabled:cursor-not-allowed disabled:opacity-45"
          />
          <div className="flex items-center justify-between text-[12px] text-white/72">
            <span>X</span>
            <span>{normalizedImageOffsetX}%</span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            step={1}
            value={normalizedImageOffsetX}
            onChange={(event) => onImageOffsetXChange(Number.parseInt(event.target.value, 10))}
            onPointerUp={(event) => commitRangeValue(event, onImageOffsetXCommit)}
            onPointerCancel={(event) => commitRangeValue(event, onImageOffsetXCommit)}
            onKeyUp={(event) => commitRangeValue(event, onImageOffsetXCommit)}
            onDoubleClick={() => resetRangeValue(0, onImageOffsetXChange, onImageOffsetXCommit)}
            disabled={controlsDisabled}
            aria-label="Image position X"
            title="Image position X"
            className="h-px w-full cursor-pointer appearance-none bg-neutral-500/70 accent-neutral-300 disabled:cursor-not-allowed disabled:opacity-45"
          />
          <div className="flex items-center justify-between text-[12px] text-white/72">
            <span>Y</span>
            <span>{normalizedImageOffsetY}%</span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            step={1}
            value={normalizedImageOffsetY}
            onChange={(event) => onImageOffsetYChange(Number.parseInt(event.target.value, 10))}
            onPointerUp={(event) => commitRangeValue(event, onImageOffsetYCommit)}
            onPointerCancel={(event) => commitRangeValue(event, onImageOffsetYCommit)}
            onKeyUp={(event) => commitRangeValue(event, onImageOffsetYCommit)}
            onDoubleClick={() => resetRangeValue(0, onImageOffsetYChange, onImageOffsetYCommit)}
            disabled={controlsDisabled}
            aria-label="Image position Y"
            title="Image position Y"
            className="h-px w-full cursor-pointer appearance-none bg-neutral-500/70 accent-neutral-300 disabled:cursor-not-allowed disabled:opacity-45"
          />
        </div>
        <div className="space-y-2 pt-1">
          <div className="mb-[10px] text-[11px] font-medium tracking-[0.08em] text-white/55">Effects</div>
          <div className="flex items-center justify-between text-[12px] text-white/72">
            <span>Filter</span>
            <select
              value={filterPreset}
              onChange={(event) => onFilterPresetChange(event.target.value as ImageFilterPreset)}
              disabled={controlsDisabled}
              aria-label="Image filter preset"
              title="Image filter preset"
              className="min-w-[128px] bg-transparent text-[12px] text-white/72 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45"
            >
              <option value="none" className="bg-[#23262c] text-white">None</option>
              <option value="vivid" className="bg-[#23262c] text-white">Vivid</option>
              <option value="warm" className="bg-[#23262c] text-white">Warm</option>
              <option value="cool" className="bg-[#23262c] text-white">Cool</option>
              <option value="mono" className="bg-[#23262c] text-white">Mono</option>
              <option value="sepia" className="bg-[#23262c] text-white">Sepia</option>
            </select>
          </div>
          <div className="!mt-[40px] flex items-center gap-3">
            <button
              type="button"
              onClick={onReplaceClick}
              disabled={controlsDisabled}
              aria-label="Replace image"
              title="Replace image"
              className="inline-flex h-6 w-6 items-center justify-center text-white/72 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Image className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onImageEditClick}
              disabled={controlsDisabled}
              aria-label="Image edit"
              title="Image edit"
              className="inline-flex h-6 w-6 items-center justify-center text-white/72 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDownloadClick}
              disabled={controlsDisabled || !canDownload}
              aria-label="Download image"
              title="Download image"
              className="inline-flex h-6 w-6 items-center justify-center text-white/72 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
