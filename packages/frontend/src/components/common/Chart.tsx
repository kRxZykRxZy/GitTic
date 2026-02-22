import React, { useMemo } from "react";

/** Data point for chart */
export interface ChartDataPoint {
  label: string;
  value: number;
}

/** Chart type */
export type ChartType = "line" | "bar";

/** Props for Chart component */
interface ChartProps {
  data: ChartDataPoint[];
  type?: ChartType;
  width?: number;
  height?: number;
  color?: string;
  title?: string;
  showLabels?: boolean;
  showGrid?: boolean;
}

/**
 * Simple SVG chart component supporting line and bar charts.
 * No external chart library - uses basic SVG paths and rects.
 */
export const Chart: React.FC<ChartProps> = ({
  data,
  type = "line",
  width = 400,
  height = 200,
  color = "var(--accent-blue)",
  title,
  showLabels = true,
  showGrid = true,
}) => {
  const padding = { top: 20, right: 20, bottom: showLabels ? 40 : 20, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { maxValue, minValue, yTicks, points } = useMemo(() => {
    if (data.length === 0) {
      return { maxValue: 100, minValue: 0, yTicks: [] as number[], points: [] as { x: number; y: number }[] };
    }

    const values = data.map((d) => d.value);
    const rawMax = Math.max(...values);
    const rawMin = Math.min(...values, 0);
    const range = rawMax - rawMin || 1;
    const adjustedMax = rawMax + range * 0.1;
    const adjustedMin = Math.min(0, rawMin);

    const tickCount = 4;
    const ticks: number[] = [];
    for (let i = 0; i <= tickCount; i++) {
      ticks.push(adjustedMin + ((adjustedMax - adjustedMin) * i) / tickCount);
    }

    const pts = data.map((d, i) => ({
      x: padding.left + (chartWidth * i) / Math.max(data.length - 1, 1),
      y:
        padding.top +
        chartHeight -
        ((d.value - adjustedMin) / (adjustedMax - adjustedMin)) * chartHeight,
    }));

    return { maxValue: adjustedMax, minValue: adjustedMin, yTicks: ticks, points: pts };
  }, [data, chartWidth, chartHeight, padding.left, padding.top]);

  const linePath = useMemo(() => {
    if (points.length === 0) return "";
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const baseline = padding.top + chartHeight;
    return `${linePath} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;
  }, [linePath, points, padding.top, chartHeight]);

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--text-primary)",
  };

  const barWidth = data.length > 0 ? Math.max(4, (chartWidth / data.length) * 0.6) : 0;

  return (
    <div style={containerStyle}>
      {title && <span style={titleStyle}>{title}</span>}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: "visible" }}
      >
        {/* Grid lines */}
        {showGrid &&
          yTicks.map((tick, i) => {
            const y =
              padding.top +
              chartHeight -
              ((tick - minValue) / (maxValue - minValue || 1)) * chartHeight;
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke="var(--border-color)"
                  strokeDasharray="4 4"
                  strokeWidth={0.5}
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill="var(--text-muted)"
                >
                  {Math.round(tick)}
                </text>
              </g>
            );
          })}

        {/* Bar chart */}
        {type === "bar" &&
          data.map((d, i) => {
            const x =
              padding.left +
              (chartWidth * i) / Math.max(data.length - 1, 1) -
              barWidth / 2;
            const barHeight =
              ((d.value - Math.min(0, minValue)) /
                (maxValue - minValue || 1)) *
              chartHeight;
            const y = padding.top + chartHeight - barHeight;
            return (
              <rect
                key={`bar-${i}`}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                opacity={0.8}
                rx={2}
              >
                <title>
                  {d.label}: {d.value}
                </title>
              </rect>
            );
          })}

        {/* Line chart */}
        {type === "line" && points.length > 1 && (
          <>
            <path d={areaPath} fill={color} opacity={0.1} />
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {points.map((p, i) => (
              <circle key={`dot-${i}`} cx={p.x} cy={p.y} r={3} fill={color}>
                <title>
                  {data[i].label}: {data[i].value}
                </title>
              </circle>
            ))}
          </>
        )}

        {/* X-axis labels */}
        {showLabels &&
          data.map((d, i) => {
            const x =
              padding.left +
              (chartWidth * i) / Math.max(data.length - 1, 1);
            const show =
              data.length <= 10 || i % Math.ceil(data.length / 8) === 0;
            if (!show) return null;
            return (
              <text
                key={`label-${i}`}
                x={x}
                y={height - 8}
                textAnchor="middle"
                fontSize={10}
                fill="var(--text-muted)"
              >
                {d.label}
              </text>
            );
          })}
      </svg>
    </div>
  );
};
