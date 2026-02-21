// src/components/grid/SettingsPanel.tsx

// ============================================================================
// ░░ SETTINGS PANEL ░░
// Physics, Shadows, Sound, Visuals, Background, Theme, Overlay, Wallpaper
// ============================================================================

import React, { useRef } from "react";
import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { RotateCcw, X, Download, Upload } from "lucide-react";

import type {
  PhysicsConfig,
  MovementMode,
  OverlayType,
  BackgroundType,
  DotShape,
} from "@/types/grid";
import {
  MOVEMENT_PRESETS,
  AVAILABLE_THEMES,
  OVERLAY_OPTIONS,
} from "@/constants/grid";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

// ░░ Props ░░

interface SettingsPanelProps {
  config: PhysicsConfig;
  onConfigChange: (config: PhysicsConfig) => void;
  onReset: () => void;
  onClose: () => void;
  onSaveToFile?: () => void;
  onLoadFromFile?: () => void;

  // Wallpaper controls
  wallpaper: string;
  wallpaperMode: "cover" | "tile";
  onWallpaperChange: (value: string) => void;
  onWallpaperModeChange: (mode: "cover" | "tile") => void;
}

// ░░ Small UI helpers ░░

const SettingRow: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
    <span className="text-[11px] text-neutral-400">{label}</span>
    <div className="flex-1 flex justify-end">{children}</div>
  </div>
);

const SliderRow: React.FC<SliderRowProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}) => {
  // Coerce anything weird (string, array, null) into a sane number
  const numericValue =
    typeof value === "number"
      ? value
      : Array.isArray(value)
        ? Number(value[0]) || 0
        : Number(value) || 0;

  const displayValue = Number.isInteger(numericValue)
    ? numericValue
    : numericValue.toFixed(step < 0.01 ? 3 : step < 0.1 ? 2 : 1);

  return (
    <div className="space-y-1 mb-2">
      <div className="flex items-center justify-between text-[11px] text-neutral-400">
        <span>{label}</span>
        <span className="text-neutral-300">{displayValue}</span>
      </div>
      <Slider
        value={[numericValue]}
        min={min}
        max={max}
        step={step}
        onValueChange={(vals) => onChange(vals[0] ?? numericValue)}
        className="w-full"
      />
    </div>
  );
};


interface ColorInputProps {
  label: string;
  color: string;
  opacity?: number;
  onColorChange: (color: string) => void;
  onOpacityChange?: (opacity: number) => void;
}

const ColorInput: React.FC<ColorInputProps> = ({
  label,
  color,
  opacity,
  onColorChange,
  onOpacityChange,
}) => (
  <div className="mb-2">
    <div className="flex items-center justify-between mb-1">
      <span className="text-[11px] text-neutral-400">{label}</span>
      {onOpacityChange !== undefined && opacity !== undefined && (
        <span className="text-[11px] text-neutral-300">
          Opacity:{" "}
          {opacity >= 1 ? "1.00" : opacity.toFixed(2).replace(/0+$/, "")}
        </span>
      )}
    </div>
    <div className="flex items-center gap-2 mb-1.5">
      <input
        type="color"
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        className="w-7 h-7 rounded border border-white/20 bg-transparent p-0 cursor-pointer"
      />
      <input
        type="text"
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        className="flex-1 bg-black/40 border border-white/15 rounded px-2 py-1 text-xs text-neutral-100 font-mono outline-none"
        placeholder="#171717"
      />
    </div>
    {onOpacityChange !== undefined && opacity !== undefined && (
      <Slider
        value={[opacity]}
        min={0}
        max={1}
        step={0.05}
        onValueChange={(vals) => onOpacityChange(vals[0] ?? opacity)}
        className="w-full"
      />
    )}
  </div>
);

const sectionLabelClass =
  "text-[11px] uppercase tracking-[0.16em] text-neutral-500 mb-1";

// ░░ Main Settings Panel ░░

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  config,
  onConfigChange,
  onReset,
  onClose,
  onSaveToFile,
  onLoadFromFile,
  wallpaper,
  wallpaperMode,
  onWallpaperChange,
  onWallpaperModeChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleWallpaperFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === "string") {
        onWallpaperChange(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const update = (key: keyof PhysicsConfig, value: unknown) => {
    onConfigChange({ ...config, [key]: value });
  };

  const handleMovementMode = (mode: MovementMode) => {
    const preset = MOVEMENT_PRESETS[mode];
    onConfigChange({ ...config, ...preset, movementMode: mode });
  };

  const modeButtonStyle = (isActive: boolean): CSSProperties => ({
    flex: 1,
    padding: "6px 0",
    fontSize: 12,
    fontWeight: isActive ? 600 : 400,
    color: isActive ? "var(--gp-btn-text-active)" : "var(--gp-text-dim)",
    background: isActive ? "var(--gp-accent-muted)" : "var(--gp-surface)",
    border: isActive
      ? "1px solid var(--gp-accent-border)"
      : "1px solid var(--gp-border)",
    borderRadius: "var(--gp-radius-md)",
    cursor: "pointer",
    transition: "all 0.2s",
  });

  const headerBtnStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    color: "var(--gp-text-dim)",
    background: "var(--gp-surface)",
    border: "1px solid var(--gp-border)",
    borderRadius: "var(--gp-radius-md)",
    padding: "4px 6px",
    cursor: "pointer",
  };

  const backgroundType = config.backgroundType as BackgroundType;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.16 }}
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        top: 70,
        right: 20,
        width: 340,
        maxHeight: "calc(100vh - 100px)",
        overflowY: "auto",
        background: "var(--gp-settings-bg)",
        border: "1px solid var(--gp-settings-border)",
        borderRadius: "var(--gp-radius-lg)",
        padding: 16,
        zIndex: 2147483647,
        backdropFilter: "blur(20px)",
      }}
      className="scrollbar-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
          Settings
        </span>
        <div className="flex items-center gap-1">
          {onSaveToFile && (
            <button
              type="button"
              style={headerBtnStyle}
              onClick={onSaveToFile}
            >
              <Download size={12} />
              <span>Save</span>
            </button>
          )}
          {onLoadFromFile && (
            <button
              type="button"
              style={headerBtnStyle}
              onClick={onLoadFromFile}
            >
              <Upload size={12} />
              <span>Load</span>
            </button>
          )}
          <button
            type="button"
            style={headerBtnStyle}
            onClick={onReset}
            title="Reset to defaults"
          >
            <RotateCcw size={12} />
          </button>
          <button
            type="button"
            style={headerBtnStyle}
            onClick={onClose}
            title="Close"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      <Accordion
        type="multiple"
        defaultValue={[
          "physics",
          "shadows",
          "visual",
          "background",
          "sound",
          "wallpaper",
        ]}
      >
        {/* PHYSICS */}
        <AccordionItem value="physics">
          <AccordionTrigger>Physics</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-1">
              <div className={sectionLabelClass}>Movement</div>
              <div className="flex gap-2 mb-2">
                {(["sticky", "default", "bouncy"] as MovementMode[]).map(
                  (mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handleMovementMode(mode)}
                      style={modeButtonStyle(config.movementMode === mode)}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ),
                )}
              </div>

              <div className={sectionLabelClass}>Toggles</div>
              <SettingRow label="Particles">
                <Switch
                  checked={config.particlesEnabled}
                  onCheckedChange={(v) => update("particlesEnabled", v)}
                />
              </SettingRow>

              <SettingRow label="Ripples">
                <Switch
                  checked={config.rippleEnabled}
                  onCheckedChange={(v) => update("rippleEnabled", v)}
                />
              </SettingRow>

              <SettingRow label="Grid Enabled">
                <Switch
                  checked={config.gridEnabled}
                  onCheckedChange={(v) => update("gridEnabled", v)}
                />
              </SettingRow>

              {config.gridEnabled && (
                <SliderRow
                  label="Grid Scale"
                  value={config.gridScale ?? 40}
                  min={20}
                  max={160}
                  step={5}
                  onChange={(v) => update("gridScale", v)}
                />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SHADOWS */}
        <AccordionItem value="shadows">
          <AccordionTrigger>Shadows</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-1">
              <div className={sectionLabelClass}>Idle</div>
              <SliderRow
                label="Offset Y"
                value={config.idleShadowY ?? 18}
                min={0}
                max={40}
                step={1}
                onChange={(v) => update("idleShadowY", v)}
              />
              <SliderRow
                label="Offset X"
                value={config.idleShadowX ?? 0}
                min={-30}
                max={30}
                step={1}
                onChange={(v) => update("idleShadowX", v)}
              />
              <SliderRow
                label="Blur"
                value={config.idleShadowBlur ?? 40}
                min={0}
                max={80}
                step={1}
                onChange={(v) => update("idleShadowBlur", v)}
              />
              <SliderRow
                label="Opacity"
                value={config.idleShadowOpacity ?? 0.5}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => update("idleShadowOpacity", v)}
              />
              <SliderRow
                label="Panel Scale"
                value={config.idlePanelScale ?? 1}
                min={0.9}
                max={1.1}
                step={0.01}
                onChange={(v) => update("idlePanelScale", v)}
              />

              <div className={sectionLabelClass}>Drag</div>
              <SliderRow
                label="Offset Y"
                value={config.dragShadowY ?? 26}
                min={0}
                max={60}
                step={1}
                onChange={(v) => update("dragShadowY", v)}
              />
              <SliderRow
                label="Offset X"
                value={config.dragShadowX ?? 0}
                min={-40}
                max={40}
                step={1}
                onChange={(v) => update("dragShadowX", v)}
              />
              <SliderRow
                label="Blur"
                value={config.dragShadowBlur ?? 60}
                min={0}
                max={100}
                step={1}
                onChange={(v) => update("dragShadowBlur", v)}
              />
              <SliderRow
                label="Opacity"
                value={config.dragShadowOpacity ?? 0.7}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => update("dragShadowOpacity", v)}
              />
              <SliderRow
                label="Panel Scale"
                value={config.dragPanelScale ?? 1.02}
                min={0.9}
                max={1.15}
                step={0.01}
                onChange={(v) => update("dragPanelScale", v)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* VISUAL */}
        <AccordionItem value="visual">
          <AccordionTrigger>Visual</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-1">
              <div className={sectionLabelClass}>Colors</div>
              <ColorInput
                label="Background Color"
                color={config.backgroundColor}
                onColorChange={(v) => update("backgroundColor", v)}
              />
              <ColorInput
                label="Grid Line Color"
                color={config.gridLineColor}
                opacity={config.gridLineOpacity}
                onColorChange={(v) => update("gridLineColor", v)}
                onOpacityChange={(v) => update("gridLineOpacity", v)}
              />
              <ColorInput
                label="Dot Color"
                color={config.dotColor}
                opacity={config.dotOpacity}
                onColorChange={(v) => update("dotColor", v)}
                onOpacityChange={(v) => update("dotOpacity", v)}
              />
              <ColorInput
                label="Particle Color"
                color={config.particleColor}
                opacity={config.particleOpacity}
                onColorChange={(v) => update("particleColor", v)}
                onOpacityChange={(v) => update("particleOpacity", v)}
              />
              <ColorInput
                label="Connection Color"
                color={config.connectionColor}
                onColorChange={(v) => update("connectionColor", v)}
              />
              <ColorInput
                label="Slice Trail Color"
                color={config.sliceTrailColor}
                onColorChange={(v) => update("sliceTrailColor", v)}
              />

              <div className={sectionLabelClass}>Blur</div>
              <SliderRow
                label="Panel Blur"
                value={config.panelBlur ?? 0}
                min={0}
                max={40}
                step={1}
                onChange={(v) => update("panelBlur", v)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* BACKGROUND / DOTPATTERN / THEME / OVERLAY */}
        <AccordionItem value="background">
          <AccordionTrigger>Background / Theme</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-1">
              {/* Background mode */}
              <div>
                <div className={sectionLabelClass}>Background</div>
                <div className="flex gap-2 mb-2">
/* 						<button
						type="button"
						onClick={() => update("backgroundType", "grid" as BackgroundType)}
						style={{
						width: 80,
						height: 40,
						borderRadius: "var(--gp-radius-md)",
						border:
						backgroundType === "grid"
						? "2px solid var(--gp-accent-border)"
						: "1px solid var(--gp-border-hover)",
						background:
						"linear-gradient(135deg, #171717, #1a1a2e)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						fontSize: 10,
						color: "var(--gp-text-dim)",
						cursor: "pointer",
						}}
						>
						Grid
						</button> */
						<button
                    type="button"
                    onClick={() =>
                      update("backgroundType", "dotpattern" as BackgroundType)
                    }
                    style={{
                      width: 80,
                      height: 40,
                      borderRadius: "var(--gp-radius-md)",
                      border:
                        backgroundType === "dotpattern"
                          ? "2px solid var(--gp-accent-border)"
                          : "1px solid var(--gp-border-hover)",
                      background: "#171717",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      color: "var(--gp-text-dim)",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    Dots
                  </button>
                </div>

                {/* Dot Pattern Settings */}
                {backgroundType === "dotpattern" && (
                  <div className="mt-1 space-y-2">
                    <SliderRow
                      label="Dot Size"
                      value={config.dotPatternSize ?? 3}
                      min={1}
                      max={10}
                      step={0.5}
                      onChange={(v) => update("dotPatternSize", v)}
                    />
                    <SliderRow
                      label="Spacing"
                      value={config.dotPatternSpacing ?? 18}
                      min={6}
                      max={40}
                      step={1}
                      onChange={(v) => update("dotPatternSpacing", v)}
                    />
                    <ColorInput
                      label="Dot Color"
                      color={config.dotPatternColor}
                      onColorChange={(v) => update("dotPatternColor", v)}
                    />
                    <SliderRow
                      label="Glow"
                      value={config.dotPatternGlow ?? 0.4}
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={(v) => update("dotPatternGlow", v)}
                    />

                    <div className={sectionLabelClass}>Dot Shape</div>
                    <div className="flex gap-2">
                      {(
                        [
                          { id: "circle", label: "●" },
                          { id: "square", label: "■" },
                          { id: "text", label: "Aa" },
                        ] as { id: DotShape; label: string }[]
                      ).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => update("dotPatternShape", s.id)}
                          style={modeButtonStyle(
                            config.dotPatternShape === s.id,
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>

                    {config.dotPatternShape === "text" && (
                      <div className="mt-2">
                        <div className="text-[11px] text-neutral-400 mb-1">
                          Character / Unicode
                        </div>
                        <input
                          type="text"
                          value={config.dotPatternText ?? "·"}
                          onChange={(e) =>
                            update("dotPatternText", e.target.value)
                          }
                          maxLength={4}
                          className="w-full bg-black/40 border border-white/15 rounded px-2 py-1 text-sm text-neutral-100 font-mono text-center outline-none"
                          placeholder="· • ✦ ★ ☰ ⬡ λ ░"
                        />
                        <div className="mt-1 text-[10px] text-neutral-500">
                          Try: · • ✦ ★ ☰ ⬡ λ ░
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Overlay */}
              <div>
                <div className={sectionLabelClass}>Overlay Effect</div>
                <select
                  value={config.overlayType as OverlayType}
                  onChange={(e) =>
                    update("overlayType", e.target.value as OverlayType)
                  }
                  className="w-full bg-[var(--gp-input-bg)] border border-[var(--gp-input-border)] rounded px-2 py-1 text-[12px] text-[var(--gp-input-text)] outline-none cursor-pointer"
                >
                  {OVERLAY_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
                {config.overlayType !== "none" && (
                  <SliderRow
                    label="Overlay Opacity"
                    value={config.overlayOpacity ?? 0.4}
                    min={0}
                    max={1}
                    step={0.05}
                    onChange={(v) => update("overlayOpacity", v)}
                  />
                )}
              </div>

              {/* Theme */}
              <div>
                <div className={sectionLabelClass}>Theme</div>
                <select
                  value={config.theme}
                  onChange={(e) => update("theme", e.target.value)}
                  className="w-full bg-[var(--gp-input-bg)] border border-[var(--gp-input-border)] rounded px-2 py-1 text-[12px] text-[var(--gp-input-text)] outline-none cursor-pointer"
                >
                  {AVAILABLE_THEMES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SOUND */}
        <AccordionItem value="sound">
          <AccordionTrigger>Sound</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-1">
              <SettingRow label="Enabled">
                <Switch
                  checked={config.soundEnabled}
                  onCheckedChange={(v) => update("soundEnabled", v)}
                />
              </SettingRow>
              <SliderRow
                label="Volume"
                value={config.soundVolume ?? 0.6}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => update("soundVolume", v)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* WALLPAPER */}
        <AccordionItem value="wallpaper">
          <AccordionTrigger>Wallpaper</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-1">
              <SettingRow label="Image / path">
                <div className="flex gap-2 w-full">
                  <input
                    type="text"
                    value={wallpaper}
                    onChange={(e) => onWallpaperChange(e.target.value)}
                    className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-neutral-100 outline-none placeholder:text-neutral-500"
                    placeholder="/wallpapers/bg.jpg or https://..."
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2 py-1 rounded border border-white/15 bg-black/40 text-[11px] text-neutral-100 hover:bg-white/10 transition-colors"
                  >
                    Browse
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleWallpaperFileChange}
                  />
                </div>
              </SettingRow>

              <SettingRow label="Mode">
                <div className="inline-flex rounded border border-white/15 bg-black/40 text-[11px]">
                  <button
                    type="button"
                    onClick={() => onWallpaperModeChange("cover")}
                    className={
                      "px-2 py-1 rounded-l transition-colors " +
                      (wallpaperMode === "cover"
                        ? "bg-white text-black"
                        : "bg-transparent text-neutral-200 hover:bg-white/10")
                    }
                  >
                    Cover
                  </button>
                  <button
                    type="button"
                    onClick={() => onWallpaperModeChange("tile")}
                    className={
                      "px-2 py-1 rounded-r transition-colors " +
                      (wallpaperMode === "tile"
                        ? "bg-white text-black"
                        : "bg-transparent text-neutral-200 hover:bg-white/10")
                    }
                  >
                    Tile
                  </button>
                </div>
              </SettingRow>

              <button
                type="button"
                onClick={() => onWallpaperChange("")}
                className="mt-1 text-[11px] text-neutral-300 underline underline-offset-2 hover:text-white"
              >
                Clear wallpaper (use background color)
              </button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </motion.div>
  );
};

export default SettingsPanel;
