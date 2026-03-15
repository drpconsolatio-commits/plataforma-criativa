"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LabelList,
  Legend
} from "recharts";
import styles from "./AnalysisDashboard.module.css";

interface MetricProps {
  label: string;
  value: number;
  unit: string;
  status: "Elite" | "Bom" | "Médio" | "Ruim";
}

const MetricCard = ({ label, value, unit, status }: MetricProps) => {
  const getStatusColor = () => {
    if (status === "Elite") return "var(--accent-success)";
    if (status === "Bom") return "var(--accent-primary)";
    if (status === "Médio") return "var(--accent-warning)";
    return "var(--accent-danger)";
  };

  const getStatusEmoji = () => {
    if (status === "Elite") return "🟢";
    if (status === "Bom") return "🟡";
    return "🔴";
  };

  const getIdealRate = () => {
    if (label.includes("Thumb Stop")) return "> 25%";
    if (label.includes("Retenção")) return "> 35%";
    return "> 1.5%";
  };

  return (
    <div className={styles.metricCard}>
      <div className={styles.metricHeader}>
        <span className={styles.metricLabel}>{label}</span>
        <span className={styles.idealRate}>Ideal: {getIdealRate()}</span>
      </div>
      <div className={styles.metricValueWrapper}>
        <span className={styles.metricValue}>
          {value.toFixed(2)}{unit}
        </span>
        <span className={styles.statusLabel} style={{ color: getStatusColor() }}>
          {status}
        </span>
      </div>
      <div className={styles.statusIndicator}>
        <div 
          className={styles.statusDot} 
          style={{ background: getStatusColor() }} 
        />
        <div className={styles.statusLine} />
      </div>
    </div>
  );
};

interface DashboardProps {
  metrics: {
    tsr_avg: number;
    retencao_avg: number;
    impacto_avg: number;
  };
  top_criativos: {
    nome: string;
    classificacao: string;
    originalName?: string;
    tsr?: number;
    retencao?: number;
    impacto?: number;
  }[];
  allPlatformCreatives?: any[];
}

export default function AnalysisDashboard({ metrics, top_criativos, allPlatformCreatives }: DashboardProps) {

  const getStatus = (val: number, type: "tsr" | "retencao" | "impacto"): "Elite" | "Bom" | "Médio" | "Ruim" => {
    if (type === "tsr") {
      if (val > 35) return "Elite";
      if (val >= 25) return "Bom";
      if (val >= 15) return "Médio";
      return "Ruim";
    }
    if (type === "retencao") {
      if (val > 50) return "Elite";
      if (val >= 35) return "Bom";
      if (val >= 20) return "Médio";
      return "Ruim";
    }
    // Impacto (CTR)
    if (val > 2.0) return "Elite";
    if (val >= 1.5) return "Bom";
    if (val >= 0.8) return "Médio";
    return "Ruim";
  };

  const getChartData = () => {
    // Helper to fix impact scale if needed
    const fixImp = (v: number) => v > 50 ? v / 10 : v;

    return [
      { 
        name: "Hook Rate", 
        shortName: "TSR",
        value: metrics.tsr_avg, 
        color: "#3b82f6",
        gradId: "gradTsr"
      },
      { 
        name: "Hold Rate", 
        shortName: "RET",
        value: metrics.retencao_avg, 
        color: "#8b5cf6",
        gradId: "gradRet"
      },
      { 
        name: "CTA Rate", 
        shortName: "IMP",
        value: fixImp(metrics.impacto_avg), 
        color: "#d946ef",
        gradId: "gradImp"
      }
    ];
  };

  const chartData = getChartData();

  return (
    <div className={styles.dashboard}>
      <div className={styles.metricsGrid}>
        <MetricCard 
          label="Thumb Stop Rate (Médio)" 
          value={metrics.tsr_avg} 
          unit="%" 
          status={getStatus(metrics.tsr_avg, "tsr")} 
        />
        <MetricCard 
          label="Retenção (Média)" 
          value={metrics.retencao_avg} 
          unit="%" 
          status={getStatus(metrics.retencao_avg, "retencao")} 
        />
        <MetricCard 
          label="Impacto (CTR Médio)" 
          value={metrics.impacto_avg} 
          unit="%" 
          status={getStatus(metrics.impacto_avg, "impacto")} 
        />
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartContainer} style={{ gridColumn: '1 / -1' }}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart 
              data={chartData} 
              margin={{ top: 40, right: 40, left: 40, bottom: 40 }}
            >
              <defs>
                <linearGradient id="gradTsr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={1}/>
                </linearGradient>
                <linearGradient id="gradRet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={1}/>
                </linearGradient>
                <linearGradient id="gradImp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e879f9" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#c026d3" stopOpacity={1}/>
                </linearGradient>
                <filter id="shadow" height="130%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                  <feOffset dx="0" dy="4" result="offsetblur" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.3" />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.1} />
              <XAxis 
                dataKey="name" 
                stroke="var(--text-secondary)" 
                fontSize={13} 
                fontWeight={600}
                tickLine={false} 
                axisLine={false}
                dy={15}
              />
              <YAxis hide domain={[0, 'dataMax + 15']} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ 
                  background: "var(--bg-surface)", 
                  border: "1px solid var(--border-subtle)", 
                  borderRadius: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  padding: "12px",
                  backdropFilter: "blur(8px)"
                }}
              />
              <Bar 
                dataKey="value" 
                radius={[12, 12, 12, 12]} 
                barSize={80}
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#${entry.gradId})`}
                    filter="url(#shadow)"
                  />
                ))}
                <LabelList 
                  dataKey="value" 
                  position="top" 
                  offset={15}
                  formatter={(v: any) => `${Number(v).toFixed(1)}%`}
                  style={{ 
                    fill: 'var(--text-primary)', 
                    fontSize: '15px', 
                    fontWeight: '800',
                    fontFamily: 'Inter, sans-serif'
                  }} 
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
