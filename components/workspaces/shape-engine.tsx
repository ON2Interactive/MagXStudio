"use client";

import { useRef } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent
} from "react";
import { ImagePlus, Pipette, X } from "lucide-react";

type ShapeFillMode = "color" | "gradient" | "image";

type ShapeEngineProps = {
  visible: boolean;
  onClose: () => void;
  panelTitle?: string;
  position: { x: number; y: number };
  onPositionChange: (next: { x: number; y: number }) => void;
  boundsRef: { current: HTMLDivElement | null };
  fillMode: ShapeFillMode;
  fillColor: string;
  gradientStartColor: string;
  gradientEndColor: string;
  gradientAngle: number;
  fillImageSrc: string;
  fillImageOffsetX: number;
  fillImageOffsetY: number;
  strokeColor: string;
  strokeWidth: number;
  shapeSides: number;
  fillOpacity: number;
  fillRadius: number;
  rotation: number;
  strokeOpacity: number;
  onFillModeChange: (mode: ShapeFillMode) => void;
  onFillColorChange: (color: string) => void;
  onGradientStartColorChange: (color: string) => void;
  onGradientEndColorChange: (color: string) => void;
  onGradientAngleChange: (angle: number) => void;
  onGradientAngleCommit: (angle: number) => void;
  onFillImageUpload: (file: File | null) => void;
  onFillImageClear: () => void;
  onFillImageOffsetXChange: (offsetX: number) => void;
  onFillImageOffsetXCommit: (offsetX: number) => void;
  onFillImageOffsetYChange: (offsetY: number) => void;
  onFillImageOffsetYCommit: (offsetY: number) => void;
  onStrokeColorChange: (color: string) => void;
  onStrokeWidthChange: (strokeWidth: number) => void;
  onShapeSidesChange: (sides: number) => void;
  onShapeSidesCommit: (sides: number) => void;
  onFillOpacityChange: (opacity: number) => void;
  onFillOpacityCommit: (opacity: number) => void;
  onFillRadiusChange: (radius: number) => void;
  onFillRadiusCommit: (radius: number) => void;
  onRotationChange: (rotation: number) => void;
  onRotationCommit: (rotation: number) => void;
  onStrokeWidthCommit: (strokeWidth: number) => void;
  onStrokeOpacityChange: (opacity: number) => void;
  onStrokeOpacityCommit: (opacity: number) => void;
  controlsDisabled?: boolean;
  radiusDisabled?: boolean;
  sidesDisabled?: boolean;
  sidesVisible?: boolean;
  defaultFillRadius?: number;
  defaultShapeSides?: number;
};

export function ShapeEngine({
  visible,
  onClose,
  panelTitle = "Shapes",
  position,
  onPositionChange,
  boundsRef,
  fillMode,
  fillColor,
  gradientStartColor,
  gradientEndColor,
  gradientAngle,
  fillImageSrc,
  fillImageOffsetX,
  fillImageOffsetY,
  strokeColor,
  strokeWidth,
  shapeSides,
  fillOpacity,
  fillRadius,
  rotation,
  strokeOpacity,
  onFillModeChange,
  onFillColorChange,
  onGradientStartColorChange,
  onGradientEndColorChange,
  onGradientAngleChange,
  onGradientAngleCommit,
  onFillImageUpload,
  onFillImageClear,
  onFillImageOffsetXChange,
  onFillImageOffsetXCommit,
  onFillImageOffsetYChange,
  onFillImageOffsetYCommit,
  onStrokeColorChange,
  onStrokeWidthChange,
  onShapeSidesChange,
  onShapeSidesCommit,
  onFillOpacityChange,
  onFillOpacityCommit,
  onFillRadiusChange,
  onFillRadiusCommit,
  onRotationChange,
  onRotationCommit,
  onStrokeWidthCommit,
  onStrokeOpacityChange,
  onStrokeOpacityCommit,
  controlsDisabled = false,
  radiusDisabled = false,
  sidesDisabled = false,
  sidesVisible = false,
  defaultFillRadius = 0,
  defaultShapeSides = 5
}: ShapeEngineProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const fillImageInputRef = useRef<HTMLInputElement | null>(null);
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

  const safeFillMode: ShapeFillMode =
    fillMode === "gradient" || fillMode === "image" ? fillMode : "color";
  const safeFillColor = fillColor === "none" ? "#9ca3af" : fillColor;
  const safeGradientStartColor = gradientStartColor === "none" ? "#9ca3af" : gradientStartColor;
  const safeGradientEndColor = gradientEndColor === "none" ? "#6b7280" : gradientEndColor;
  const safeGradientAngle = Math.max(0, Math.min(360, Math.round(gradientAngle)));
  const safeFillImageOffsetX = Math.max(-100, Math.min(100, Math.round(fillImageOffsetX)));
  const safeFillImageOffsetY = Math.max(-100, Math.min(100, Math.round(fillImageOffsetY)));
  const safeStrokeColor = strokeColor === "none" ? "#6b7280" : strokeColor;
  const normalizedStrokeWidth = Math.max(0, Math.min(64, Math.round(strokeWidth)));
  const normalizedShapeSides = Math.max(3, Math.min(12, Math.round(shapeSides)));
  const normalizedFillOpacity = Math.max(0, Math.min(100, Math.round(fillOpacity)));
  const normalizedFillRadius = Math.max(0, Math.min(999, Math.round(fillRadius)));
  const normalizedRotation = Math.max(-180, Math.min(180, Math.round(rotation)));
  const normalizedStrokeOpacity = Math.max(0, Math.min(100, Math.round(strokeOpacity)));
  const disableRadiusControls = controlsDisabled || radiusDisabled;
  const disableSidesControls = controlsDisabled || sidesDisabled;
  const colorChipClass =
    "relative inline-flex h-10 w-40 overflow-hidden rounded-xl border border-white/20 bg-black/35 transition hover:bg-black/50 disabled:cursor-not-allowed disabled:opacity-45";
  const commitRangeValue = (
    event: ReactPointerEvent<HTMLInputElement> | ReactKeyboardEvent<HTMLInputElement>,
    onCommit: (value: number) => void
  ) => {
    const parsed = Number.parseInt(event.currentTarget.value, 10);
    onCommit(Number.isFinite(parsed) ? parsed : 0);
  };
  const resetRangeValue = (
    value: number,
    onChange: (next: number) => void,
    onCommit: (next: number) => void
  ) => {
    onChange(value);
    onCommit(value);
  };
  const panelTitleLower = panelTitle.toLowerCase();

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
            aria-label={`Close ${panelTitleLower} panel`}
            title={`Close ${panelTitle} panel`}
            onClick={onClose}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/25 text-white/70 transition hover:bg-black/40 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="h-6 w-px bg-white/20" />
          <div className="rounded-md bg-white/12 px-3 py-1 text-[15px] font-semibold leading-none tracking-tight">
            {panelTitle}
          </div>
        </div>
      </div>

      <div className="space-y-3 border-y border-white/10 bg-black/20 px-3 py-3">
        <div className="space-y-2 rounded-md bg-white/6 p-2.5">
          <div className="text-[11px] font-semibold text-white/60">Fill</div>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-black/30 p-1">
            {(["color", "gradient", "image"] as const).map((mode) => {
              const selected = safeFillMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  disabled={controlsDisabled}
                  onClick={() => onFillModeChange(mode)}
                  className={`h-7 rounded-md text-[12px] capitalize transition ${
                    selected ? "bg-white/18 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                  } disabled:cursor-not-allowed disabled:opacity-45`}
                >
                  {mode}
                </button>
              );
            })}
          </div>
          {safeFillMode === "color" ? (
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-white/72">Color</span>
              <button
                type="button"
                aria-label="Shape fill color"
                title="Shape fill color"
                disabled={controlsDisabled}
                className={colorChipClass}
              >
                <span
                  className="absolute inset-y-0 left-0 right-10 border-r border-white/15"
                  style={{ backgroundColor: safeFillColor }}
                />
                <span className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center bg-white/16 text-white/90">
                  <Pipette className="h-4 w-4" />
                </span>
                <input
                  type="color"
                  aria-label="Shape fill color picker"
                  title="Shape fill color picker"
                  value={safeFillColor}
                  onChange={(event) => onFillColorChange(event.target.value)}
                  disabled={controlsDisabled}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                />
              </button>
            </div>
          ) : null}
          {safeFillMode === "gradient" ? (
            <>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-white/72">Start</span>
                <button
                  type="button"
                  aria-label="Shape gradient start color"
                  title="Shape gradient start color"
                  disabled={controlsDisabled}
                  className={colorChipClass}
                >
                  <span
                    className="absolute inset-y-0 left-0 right-10 border-r border-white/15"
                    style={{ backgroundColor: safeGradientStartColor }}
                  />
                  <span className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center bg-white/16 text-white/90">
                    <Pipette className="h-4 w-4" />
                  </span>
                  <input
                    type="color"
                    aria-label="Shape gradient start color picker"
                    title="Shape gradient start color picker"
                    value={safeGradientStartColor}
                    onChange={(event) => onGradientStartColorChange(event.target.value)}
                    disabled={controlsDisabled}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                  />
                </button>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-white/72">End</span>
                <button
                  type="button"
                  aria-label="Shape gradient end color"
                  title="Shape gradient end color"
                  disabled={controlsDisabled}
                  className={colorChipClass}
                >
                  <span
                    className="absolute inset-y-0 left-0 right-10 border-r border-white/15"
                    style={{ backgroundColor: safeGradientEndColor }}
                  />
                  <span className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center bg-white/16 text-white/90">
                    <Pipette className="h-4 w-4" />
                  </span>
                  <input
                    type="color"
                    aria-label="Shape gradient end color picker"
                    title="Shape gradient end color picker"
                    value={safeGradientEndColor}
                    onChange={(event) => onGradientEndColorChange(event.target.value)}
                    disabled={controlsDisabled}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                  />
                </button>
              </div>
              <div className="flex items-center justify-between text-[12px] text-white/72">
                <span>Rotation</span>
                <span>{safeGradientAngle}deg</span>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                step={1}
                value={safeGradientAngle}
                onChange={(event) => onGradientAngleChange(Number.parseInt(event.target.value, 10))}
                onPointerUp={(event) => commitRangeValue(event, onGradientAngleCommit)}
                onPointerCancel={(event) => commitRangeValue(event, onGradientAngleCommit)}
                onKeyUp={(event) => commitRangeValue(event, onGradientAngleCommit)}
                onDoubleClick={() => resetRangeValue(135, onGradientAngleChange, onGradientAngleCommit)}
                disabled={controlsDisabled}
                aria-label="Shape gradient rotation"
                title="Shape gradient rotation"
                className="h-px w-full cursor-pointer appearance-none bg-neutral-500/70 accent-neutral-300 disabled:cursor-not-allowed disabled:opacity-45"
              />
            </>
          ) : null}
          {safeFillMode === "image" ? (
            <>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-white/72">Upload</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Upload shape fill image"
                    title="Upload shape fill image"
                    disabled={controlsDisabled}
                    onClick={() => fillImageInputRef.current?.click()}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-black/35 text-white/85 transition hover:bg-black/55 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <ImagePlus className="h-4 w-4" />
                  </button>
                  {fillImageSrc ? (
                    <button
                      type="button"
                      aria-label="Clear shape fill image"
                      title="Clear shape fill image"
                      disabled={controlsDisabled}
                      onClick={onFillImageClear}
                      className="inline-flex h-9 px-2 items-center justify-center rounded-lg border border-white/20 bg-black/35 text-[12px] text-white/85 transition hover:bg-black/55 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                <input
                  ref={fillImageInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  style={{ display: "none" }}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    onFillImageUpload(file);
                    if (fillImageInputRef.current) {
                      fillImageInputRef.current.value = "";
                    }
                  }}
                />
              </div>
              <div className="h-16 w-full overflow-hidden rounded-lg border border-white/20 bg-black/40">
                {fillImageSrc ? (
                  <img src={fillImageSrc} alt="Shape fill preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-[12px] text-white/55">
                    No image selected
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-[12px] text-white/72">
                <span>X</span>
                <span>{safeFillImageOffsetX}%</span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                step={1}
                value={safeFillImageOffsetX}
                onChange={(event) =>
                  onFillImageOffsetXChange(Number.parseInt(event.target.value, 10))
                }
                onPointerUp={(event) => commitRangeValue(event, onFillImageOffsetXCommit)}
                onPointerCancel={(event) => commitRangeValue(event, onFillImageOffsetXCommit)}
                onKeyUp={(event) => commitRangeValue(event, onFillImageOffsetXCommit)}
                onDoubleClick={() => resetRangeValue(0, onFillImageOffsetXChange, onFillImageOffsetXCommit)}
                disabled={controlsDisabled || !fillImageSrc}
                aria-label="Shape fill image position X"
                title="Shape fill image position X"
                className="h-px w-full cursor-pointer appearance-none bg-neutral-500/70 accent-neutral-300 disabled:cursor-not-allowed disabled:opacity-45"
              />
              <div className="flex items-center justify-between text-[12px] text-white/72">
                <span>Y</span>
                <span>{safeFillImageOffsetY}%</span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                step={1}
                value={safeFillImageOffsetY}
                onChange={(event) =>
                  onFillImageOffsetYChange(Number.parseInt(event.target.value, 10))
                }
                onPointerUp={(event) => commitRangeValue(event, onFillImageOffsetYCommit)}
                onPointerCancel={(event) => commitRangeValue(event, onFillImageOffsetYCommit)}
                onKeyUp={(event) => commitRangeValue(event, onFillImageOffsetYCommit)}
                onDoubleClick={() => resetRangeValue(0, onFillImageOffsetYChange, onFillImageOffsetYCommit)}
                disabled={controlsDisabled || !fillImageSrc}
                aria-label="Shape fill image position Y"
                title="Shape fill image position Y"
                className="h-px w-full cursor-pointer appearance-none bg-neutral-500/70 accent-neutral-300 disabled:cursor-not-allowed disabled:opacity-45"
              />
            </>
          ) : null}
          <div className="flex items-center justify-between text-[12px] text-white/72">
            <span>Opacity</span>
            <span>{normalizedFillOpacity}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={normalizedFillOpacity}
            onChange={(event) => onFillOpacityChange(Number.parseInt(event.target.value, 10))}
            onPointerUp={(event) => commitRangeValue(event, onFillOpacityCommit)}
            onPointerCancel={(event) => commitRangeValue(event, onFillOpacityCommit)}
            onKeyUp={(event) => commitRangeValue(event, onFillOpacityCommit)}
            onDoubleClick={() => resetRangeValue(100, onFillOpacityChange, onFillOpacityCommit)}
            disabled={controlsDisabled}
            aria-label="Shape fill opacity"
            title="Shape fill opacity"
            className="h-px w-full cursor-pointer appearance-none bg-neutral-500/70 accent-neutral-300 disabled:cursor-not-allowed disabled:opacity-45"
          />
          <div className="flex items-center justify-between text-[12px] text-white/72">
            <span>Corner radius</span>
            <span>{normalizedFillRadius}</span>
          </div>
          <input
            type="range"
            min={0}
            max={999}
            step={1}
            value={normalizedFillRadius}
            onChange={(event) => onFillRadiusChange(Number.parseInt(event.target.value, 10))}
            onPointerUp={(event) => commitRangeValue(event, onFillRadiusCommit)}
            onPointerCancel={(event) => commitRangeValue(event, onFillRadiusCommit)}
            onKeyUp={(event) => commitRangeValue(event, onFillRadiusCommit)}
            onDoubleClick={() =>
              resetRangeValue(defaultFillRadius, onFillRadiusChange, onFillRadiusCommit)
            }
            disabled={disableRadiusControls}
            aria-label="Shape corner radius"
            title="Shape corner radius"
            className="h-px w-full cursor-pointer appearance-none bg-neutral-500/70 accent-neutral-300 disabled:cursor-not-allowed disabled:opacity-45"
          />
          <div className="flex items-center justify-between text-[12px] text-white/72">
            <span>Rotation</span>
            <span>{normalizedRotation}deg</span>
          </div>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={normalizedRotation}
            onChange={(event) => onRotationChange(Number.parseInt(event.target.value, 10))}
            onPointerUp={(event) => commitRangeValue(event, onRotationCommit)}
            onPointerCancel={(event) => commitRangeValue(event, onRotationCommit)}
            onKeyUp={(event) => commitRangeValue(event, onRotationCommit)}
            onDoubleClick={() => resetRangeValue(0, onRotationChange, onRotationCommit)}
            disabled={controlsDisabled}
            aria-label="Shape rotation"
            title="Shape rotation"
            className="h-px w-full cursor-pointer appearance-none bg-neutral-500/70 accent-neutral-300 disabled:cursor-not-allowed disabled:opacity-45"
          />
          {sidesVisible ? (
            <>
              <div className="flex items-center justify-between text-[12px] text-white/72">
                <span>Sides</span>
                <span>{normalizedShapeSides}</span>
              </div>
              <input
                type="range"
                min={3}
                max={12}
                step={1}
                value={normalizedShapeSides}
                onChange={(event) => onShapeSidesChange(Number.parseInt(event.target.value, 10))}
                onPointerUp={(event) => commitRangeValue(event, onShapeSidesCommit)}
                onPointerCancel={(event) => commitRangeValue(event, onShapeSidesCommit)}
                onKeyUp={(event) => commitRangeValue(event, onShapeSidesCommit)}
                onDoubleClick={() =>
                  resetRangeValue(defaultShapeSides, onShapeSidesChange, onShapeSidesCommit)
                }
                disabled={disableSidesControls}
                aria-label="Shape sides"
                title="Shape sides"
                className="h-px w-full cursor-pointer appearance-none bg-neutral-500/70 accent-neutral-300 disabled:cursor-not-allowed disabled:opacity-45"
              />
            </>
          ) : null}
        </div>

        <div className="space-y-2 rounded-md bg-white/6 p-2.5">
          <div className="text-[11px] font-semibold text-white/60">Stroke</div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-white/72">Color</span>
            <button
              type="button"
              aria-label="Shape stroke color"
              title="Shape stroke color"
              disabled={controlsDisabled}
              className={colorChipClass}
            >
              <span className="absolute inset-y-0 left-0 right-10 border-r border-white/15 bg-black/55" />
              <span
                className="absolute inset-y-0 left-1.5 right-11 rounded-md border-2"
                style={{ borderColor: safeStrokeColor }}
              />
              <span className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center bg-white/16 text-white/90">
                <Pipette className="h-4 w-4" />
              </span>
              <input
                type="color"
                aria-label="Shape stroke color picker"
                title="Shape stroke color picker"
                value={safeStrokeColor}
                onChange={(event) => onStrokeColorChange(event.target.value)}
                disabled={controlsDisabled}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />
            </button>
          </div>
          <div className="flex items-center justify-between text-[12px] text-white/72">
            <span>Width</span>
            <span>{normalizedStrokeWidth} px</span>
          </div>
          <input
            type="range"
            min={0}
            max={64}
            step={1}
            value={normalizedStrokeWidth}
            onChange={(event) => onStrokeWidthChange(Number.parseInt(event.target.value, 10))}
            onPointerUp={(event) => commitRangeValue(event, onStrokeWidthCommit)}
            onPointerCancel={(event) => commitRangeValue(event, onStrokeWidthCommit)}
            onKeyUp={(event) => commitRangeValue(event, onStrokeWidthCommit)}
            onDoubleClick={() => resetRangeValue(2, onStrokeWidthChange, onStrokeWidthCommit)}
            disabled={controlsDisabled}
            aria-label="Shape stroke width"
            title="Shape stroke width"
            className="h-px w-full cursor-pointer appearance-none bg-neutral-500/70 accent-neutral-300 disabled:cursor-not-allowed disabled:opacity-45"
          />
          <div className="flex items-center justify-between text-[12px] text-white/72">
            <span>Opacity</span>
            <span>{normalizedStrokeOpacity}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={normalizedStrokeOpacity}
            onChange={(event) => onStrokeOpacityChange(Number.parseInt(event.target.value, 10))}
            onPointerUp={(event) => commitRangeValue(event, onStrokeOpacityCommit)}
            onPointerCancel={(event) => commitRangeValue(event, onStrokeOpacityCommit)}
            onKeyUp={(event) => commitRangeValue(event, onStrokeOpacityCommit)}
            onDoubleClick={() => resetRangeValue(100, onStrokeOpacityChange, onStrokeOpacityCommit)}
            disabled={controlsDisabled}
            aria-label="Shape stroke opacity"
            title="Shape stroke opacity"
            className="h-px w-full cursor-pointer appearance-none bg-neutral-500/70 accent-neutral-300 disabled:cursor-not-allowed disabled:opacity-45"
          />
        </div>
      </div>
    </div>
  );
}
