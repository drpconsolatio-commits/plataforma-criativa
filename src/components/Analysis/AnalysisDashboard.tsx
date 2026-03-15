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

    return [{
      name: "Média Geral",
      tsr: metrics.tsr_avg,
      retencao: metrics.retencao_avg,
      impacto: fixImp(metrics.impacto_avg)
    }];
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
          <div className={styles.chartHeader}>
            <h3>Comparativos de Métricas</h3>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              barGap={12}
              barCategoryGap="25%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                stroke="var(--text-secondary)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              <YAxis hide domain={[0, 'dataMax + 10']} />
              <Tooltip 
                cursor={{ fill: 'var(--bg-raised)', opacity: 0.1 }}
                contentStyle={{ 
                  background: "var(--bg-surface)", 
                  border: "1px solid var(--border-subtle)", 
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-lg)",
                  padding: "12px"
                }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Bar name="Hook Rate (TSR)" dataKey="tsr" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={32} />
              <Bar name="Hold Rate (RET)" dataKey="retencao" fill="#8b5cf6" radius={[8, 8, 0, 0]} barSize={32} />
              <Bar name="CTA Rate (IMP)" dataKey="impacto" fill="#d946ef" radius={[8, 8, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
