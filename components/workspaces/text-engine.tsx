"use client";

import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ChevronDown,
  Italic,
  List,
  ListOrdered,
  Strikethrough,
  Trash2,
  Underline,
  X
} from "lucide-react";

export type TextEngineTextAlign = "left" | "center" | "right";
export type TextEngineTextDecorationStyle = "none" | "underline" | "italic" | "line-through";
export type TextEngineBulletListStyle = "none" | "disc" | "circle" | "square";
export type TextEngineNumberedListStyle =
  | "none"
  | "decimal"
  | "lower-alpha"
  | "upper-alpha"
  | "lower-roman"
  | "upper-roman";

export type TextEngineFontWeightOption = {
  label: string;
  value: string;
};

export type TextEngineFontEntry = {
  family: string;
  weights: TextEngineFontWeightOption[];
};

type CharacterFloatingPanelProps = {
  panelTitle?: string;
  titleOnly?: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onPositionChange: (next: { x: number; y: number }) => void;
  boundsRef: { current: HTMLDivElement | null };
  fontOptions: readonly TextEngineFontEntry[];
  selectedFont: string;
  onFontChange: (fontFamily: string) => void;
  selectedWeight: string;
  weightOptions: readonly TextEngineFontWeightOption[];
  onWeightChange: (weight: string) => void;
  selectedSize: string;
  sizeOptions: readonly string[];
  onSizeChange: (size: string) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  onColorReset: () => void;
  selectedTextDecorationStyle: TextEngineTextDecorationStyle;
  onTextDecorationStyleChange: (style: TextEngineTextDecorationStyle) => void;
  selectedAlignment: TextEngineTextAlign;
  onAlignmentChange: (alignment: TextEngineTextAlign) => void;
  selectedLineHeight: string;
  lineHeightOptions: readonly string[];
  onLineHeightChange: (lineHeight: string) => void;
  selectedWordSpacing: string;
  wordSpacingOptions: readonly string[];
  onWordSpacingChange: (wordSpacing: string) => void;
  selectedCharacterSpacing: string;
  characterSpacingOptions: readonly string[];
  onCharacterSpacingChange: (characterSpacing: string) => void;
  selectedBulletListStyle: TextEngineBulletListStyle;
  bulletListStyleOptions: ReadonlyArray<{ label: string; value: TextEngineBulletListStyle }>;
  onBulletListStyleChange: (listStyle: TextEngineBulletListStyle) => void;
  selectedNumberedListStyle: TextEngineNumberedListStyle;
  numberedListStyleOptions: ReadonlyArray<{ label: string; value: TextEngineNumberedListStyle }>;
  onNumberedListStyleChange: (listStyle: TextEngineNumberedListStyle) => void;
  onBulletListClear: () => void;
  fontDisabled?: boolean;
};

export type TextEngineProps = CharacterFloatingPanelProps & {
  visible: boolean;
};

function CharacterFloatingPanel({
  panelTitle = "Character",
  titleOnly = false,
  onClose,
  position,
  onPositionChange,
  boundsRef,
  fontOptions,
  selectedFont,
  onFontChange,
  selectedWeight,
  weightOptions,
  onWeightChange,
  selectedSize,
  sizeOptions,
  onSizeChange,
  selectedColor,
  onColorChange,
  onColorReset,
  selectedTextDecorationStyle,
  onTextDecorationStyleChange,
  selectedAlignment,
  onAlignmentChange,
  selectedLineHeight,
  lineHeightOptions,
  onLineHeightChange,
  selectedWordSpacing,
  wordSpacingOptions,
  onWordSpacingChange,
  selectedCharacterSpacing,
  characterSpacingOptions,
  onCharacterSpacingChange,
  selectedBulletListStyle,
  bulletListStyleOptions,
  onBulletListStyleChange,
  selectedNumberedListStyle,
  numberedListStyleOptions,
  onNumberedListStyleChange,
  onBulletListClear,
  fontDisabled
}: CharacterFloatingPanelProps) {
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
    if (target?.closest("button")) return;
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

  const iconToggleClass =
    "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-black/30 text-white/85 transition hover:bg-black/50";
  const alignmentButtonClass = (alignment: TextEngineTextAlign) =>
    [
      iconToggleClass,
      fontDisabled ? "disabled:cursor-not-allowed disabled:text-white/45" : "",
      selectedAlignment === alignment ? "border-indigo-300/70 bg-indigo-500/30 text-white" : ""
    ].join(" ");
  const decorationButtonClass = (style: TextEngineTextDecorationStyle) =>
    [
      iconToggleClass,
      fontDisabled ? "disabled:cursor-not-allowed disabled:text-white/45" : "",
      selectedTextDecorationStyle === style ? "border-indigo-300/70 bg-indigo-500/30 text-white" : ""
    ].join(" ");

  const inputBoxClass = "flex h-9 items-center justify-between rounded-md bg-white/14 px-3 text-[13px] text-white/92";
  const closeLabel = `Close ${panelTitle.toLowerCase()} panel`;

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
            aria-label={closeLabel}
            title={closeLabel}
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

      {titleOnly ? null : (
        <>
          <div className="space-y-2 p-3">
            <div className="grid grid-cols-[1fr_1.45fr] gap-2">
              <div className={inputBoxClass}>
                <span>Fonts</span>
              </div>
              <div className="relative h-9 rounded-md bg-white/14">
                <select
                  aria-label="Character font family"
                  title="Character font family"
                  value={selectedFont}
                  onChange={(event) => onFontChange(event.target.value)}
                  disabled={fontDisabled}
                  className="h-full w-full appearance-none rounded-md bg-transparent px-3 pr-8 text-[13px] text-white/92 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-white/45"
                >
                  {fontOptions.map((font) => (
                    <option key={font.family} value={font.family} className="bg-[#23262c] text-white">
                      {font.family}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2">
              <div className="relative h-9 rounded-md bg-white/14">
                <select
                  aria-label="Character font size"
                  title="Character font size"
                  value={selectedSize}
                  onChange={(event) => onSizeChange(event.target.value)}
                  disabled={fontDisabled}
                  className="h-full w-full appearance-none rounded-md bg-transparent px-3 pr-8 text-[13px] text-white/92 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-white/45"
                >
                  {sizeOptions.map((size) => (
                    <option key={size} value={size} className="bg-[#23262c] text-white">
                      {size} pt
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
              </div>
              <div className="relative h-9 rounded-md bg-white/14">
                <select
                  aria-label="Character font weight"
                  title="Character font weight"
                  value={selectedWeight}
                  onChange={(event) => onWeightChange(event.target.value)}
                  disabled={fontDisabled}
                  className="h-full w-full appearance-none rounded-md bg-transparent px-3 pr-8 text-[13px] text-white/92 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-white/45"
                >
                  {weightOptions.map((weight) => (
                    <option
                      key={`${weight.value}-${weight.label}`}
                      value={weight.value}
                      className="bg-[#23262c] text-white"
                    >
                      {weight.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
              </div>
              <button
                type="button"
                aria-label="Text color"
                title="Text color"
                disabled={fontDisabled}
                className={`${iconToggleClass} relative h-9 w-9 disabled:cursor-not-allowed disabled:text-white/45`}
              >
                <div className="h-5 w-5 rounded-sm border border-white/35" style={{ backgroundColor: selectedColor }} />
                <input
                  type="color"
                  aria-label="Text color picker"
                  title="Text color picker"
                  value={selectedColor}
                  onChange={(event) => onColorChange(event.target.value)}
                  disabled={fontDisabled}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                />
              </button>
              <button
                type="button"
                aria-label="No color"
                title="No color"
                onClick={onColorReset}
                disabled={fontDisabled}
                className={`${iconToggleClass} relative h-9 w-9 disabled:cursor-not-allowed disabled:text-white/45`}
              >
                <div className="absolute inset-2 rounded-sm border border-white/30" />
                <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_47%,#ef4444_48%,#ef4444_52%,transparent_53%)]" />
              </button>
            </div>
          </div>

          <div className="border-y border-white/10 bg-black/20 px-3 py-2">
            <div className="flex items-center gap-2 text-[13px] font-semibold">
              <ChevronDown className="h-4 w-4 text-white/80" />
              <span>Decorations</span>
            </div>
          </div>

          <div className="space-y-3 p-3">
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                aria-label="Underline"
                title="Underline"
                onClick={() => onTextDecorationStyleChange("underline")}
                disabled={fontDisabled}
                className={decorationButtonClass("underline")}
              >
                <Underline className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Italic"
                title="Italic"
                onClick={() => onTextDecorationStyleChange("italic")}
                disabled={fontDisabled}
                className={decorationButtonClass("italic")}
              >
                <Italic className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Strikethrough"
                title="Strikethrough"
                onClick={() => onTextDecorationStyleChange("line-through")}
                disabled={fontDisabled}
                className={decorationButtonClass("line-through")}
              >
                <Strikethrough className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="No decoration"
                title="No decoration"
                onClick={() => onTextDecorationStyleChange("none")}
                disabled={fontDisabled}
                className={`${decorationButtonClass("none")} relative`}
              >
                <div className="absolute inset-2 rounded-sm border border-white/30" />
                <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_47%,#ef4444_48%,#ef4444_52%,transparent_53%)]" />
              </button>
            </div>
          </div>

          <div className="border-y border-white/10 bg-black/20 px-3 py-2">
            <div className="flex items-center gap-2 text-[13px] font-semibold">
              <ChevronDown className="h-4 w-4 text-white/80" />
              <span>Position & Transform</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 pt-3">
            <button
              type="button"
              aria-label="Align left"
              title="Align left"
              onClick={() => onAlignmentChange("left")}
              disabled={fontDisabled}
              className={alignmentButtonClass("left")}
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Align center"
              title="Align center"
              onClick={() => onAlignmentChange("center")}
              disabled={fontDisabled}
              className={alignmentButtonClass("center")}
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Align right"
              title="Align right"
              onClick={() => onAlignmentChange("right")}
              disabled={fontDisabled}
              className={alignmentButtonClass("right")}
            >
              <AlignRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 px-3 pb-3 pt-2">
            <div className="relative h-9 rounded-md bg-white/10">
              <select
                aria-label="Line height"
                title="Line height"
                value={selectedLineHeight}
                onChange={(event) => onLineHeightChange(event.target.value)}
                disabled={fontDisabled}
                className="h-full w-full appearance-none rounded-md bg-transparent px-3 pr-8 text-[13px] text-white/92 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-white/45"
              >
                {lineHeightOptions.map((value) => (
                  <option key={value} value={value} className="bg-[#23262c] text-white">
                    {value}%
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
            </div>
            <div className="relative h-9 rounded-md bg-white/10">
              <select
                aria-label="Word spacing"
                title="Word spacing"
                value={selectedWordSpacing}
                onChange={(event) => onWordSpacingChange(event.target.value)}
                disabled={fontDisabled}
                className="h-full w-full appearance-none rounded-md bg-transparent px-3 pr-8 text-[13px] text-white/92 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-white/45"
              >
                {wordSpacingOptions.map((value) => (
                  <option key={value} value={value} className="bg-[#23262c] text-white">
                    {value}px
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
            </div>
            <div className="relative h-9 rounded-md bg-white/10">
              <select
                aria-label="Tracking"
                title="Tracking"
                value={selectedCharacterSpacing}
                onChange={(event) => onCharacterSpacingChange(event.target.value)}
                disabled={fontDisabled}
                className="h-full w-full appearance-none rounded-md bg-transparent px-3 pr-8 text-[13px] text-white/92 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-white/45"
              >
                {characterSpacingOptions.map((value) => (
                  <option key={value} value={value} className="bg-[#23262c] text-white">
                    {value}px
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
            </div>
            <div className="relative h-9 rounded-md bg-white/10">
              <List className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
              <select
                aria-label="Bullets"
                title="Bullets"
                value={selectedBulletListStyle}
                onChange={(event) => onBulletListStyleChange(event.target.value as TextEngineBulletListStyle)}
                disabled={fontDisabled}
                className="h-full w-full appearance-none rounded-md bg-transparent pl-8 pr-8 text-[13px] text-white/92 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-white/45"
              >
                {bulletListStyleOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#23262c] text-white">
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
            </div>
            <div className="relative h-9 rounded-md bg-white/10">
              <ListOrdered className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
              <select
                aria-label="Numbering"
                title="Numbering"
                value={selectedNumberedListStyle}
                onChange={(event) => onNumberedListStyleChange(event.target.value as TextEngineNumberedListStyle)}
                disabled={fontDisabled}
                className="h-full w-full appearance-none rounded-md bg-transparent pl-8 pr-8 text-[13px] text-white/92 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-white/45"
              >
                {numberedListStyleOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#23262c] text-white">
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
            </div>
            <button
              type="button"
              aria-label="Remove bullets and numbering"
              title="Remove bullets and numbering"
              onClick={onBulletListClear}
              disabled={fontDisabled || (selectedBulletListStyle === "none" && selectedNumberedListStyle === "none")}
              className={`${iconToggleClass} h-9 w-9 justify-self-end disabled:cursor-not-allowed disabled:text-white/45`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function TextEngine({ visible, ...props }: TextEngineProps) {
  if (!visible) return null;
  return <CharacterFloatingPanel {...props} />;
}
