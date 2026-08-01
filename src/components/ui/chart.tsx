"use client";

import React, { createContext, useContext } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ChartConfig = {
  [key: string]: {
    label: string;
    color: string;
  };
};

// ─── Context ─────────────────────────────────────────────────────────────────

const ChartContext = createContext<{ config: ChartConfig } | null>(null);

function useChart() {
  const ctx = useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be used within ChartContainer");
  return ctx;
}

// ─── ChartContainer ──────────────────────────────────────────────────────────

interface ChartContainerProps {
  config: ChartConfig;
  children: React.ReactNode;
  className?: string;
}

export function ChartContainer({
  config,
  children,
  className,
}: ChartContainerProps) {
  const cssVars = Object.entries(config).reduce(
    (acc, [key, value]) => {
      acc[`--color-${key}`] = value.color;
      return acc;
    },
    {} as Record<string, string>,
  );

  return (
    <ChartContext.Provider value={{ config }}>
      <div className={className} style={cssVars as React.CSSProperties}>
        {children}
      </div>
    </ChartContext.Provider>
  );
}

// ─── ChartTooltip ────────────────────────────────────────────────────────────

export { Tooltip as ChartTooltip } from "recharts";

// ─── ChartTooltipContent ─────────────────────────────────────────────────────

interface TooltipPayloadItem {
  name: string;
  value: number | string;
  color?: string;
  dataKey?: string;
  payload?: Record<string, unknown>;
}

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  labelFormatter?: (
    value: string,
    payload: TooltipPayloadItem[],
  ) => React.ReactNode;
  formatter?: (value: number | string, name: string) => React.ReactNode;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: "dot" | "line" | "dashed";
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  formatter,
  hideLabel = false,
  hideIndicator = false,
  indicator = "dot",
}: ChartTooltipContentProps) {
  const { config } = useChart();

  if (!active || !payload?.length) return null;

  const formattedLabel = labelFormatter
    ? labelFormatter(label ?? "", payload)
    : label;

  return (
    <div
      className="bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-xl px-3 py-2.5 shadow-lg shadow-black/5 text-right min-w-[8rem]"
      dir="rtl"
    >
      {!hideLabel && formattedLabel && (
        <p className="text-[12px] font-medium text-gray-900 mb-2 pb-1.5 border-b border-gray-100">
          {formattedLabel}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const configItem =
            config[entry.dataKey as string] ?? config[entry.name];
          const color = entry.color ?? configItem?.color;
          const label = configItem?.label ?? entry.name;
          const value = formatter
            ? formatter(entry.value, entry.name)
            : typeof entry.value === "number"
              ? entry.value.toLocaleString("en-US")
              : entry.value;

          return (
            <div key={index} className="flex items-center gap-1.5 text-[12px]">
              {!hideIndicator && (
                <span
                  className={
                    indicator === "dot"
                      ? "w-2 h-2 rounded-full flex-shrink-0"
                      : indicator === "line"
                        ? "w-3 h-[2px] rounded flex-shrink-0"
                        : "w-3 h-[2px] border-dashed border-t-2 flex-shrink-0"
                  }
                  style={{
                    backgroundColor: indicator !== "dashed" ? color : undefined,
                    borderColor: indicator === "dashed" ? color : undefined,
                  }}
                />
              )}
              <span className="text-gray-500 flex-1">{label}</span>
              <span className="font-medium text-gray-900 tabular-nums">
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ChartLegend ─────────────────────────────────────────────────────────────

export { Legend as ChartLegend } from "recharts";

// ─── ChartLegendContent ──────────────────────────────────────────────────────

interface ChartLegendContentProps {
  payload?: Array<{
    value: string;
    color?: string;
    dataKey?: string;
  }>;
}

export function ChartLegendContent({ payload }: ChartLegendContentProps) {
  const { config } = useChart();

  if (!payload?.length) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-3" dir="rtl">
      {payload.map((entry, index) => {
        const configItem =
          config[entry.value] ?? config[entry.dataKey as string];
        const color = entry.color ?? configItem?.color;
        const label = configItem?.label ?? entry.value;

        return (
          <div
            key={index}
            className="flex items-center gap-1.5 text-[12px] text-gray-500"
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
