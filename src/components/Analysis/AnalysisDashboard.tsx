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
  LabelList
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
  const [searchTerm, setSearchTerm] = React.useState("");

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
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return [
        { name: "TSR", value: metrics.tsr_avg, status: getStatus(metrics.tsr_avg, "tsr") },
        { name: "Retenção", value: metrics.retencao_avg, status: getStatus(metrics.retencao_avg, "retencao") },
        { name: "Impacto", value: metrics.impacto_avg, status: getStatus(metrics.impacto_avg, "impacto") },
      ];
    }

    const cr = top_criativos.find(c => c.nome.toLowerCase().includes(term));
    if (!cr) {
      return [
        { name: "TSR", value: 0, status: "Ruim" },
        { name: "Retenção", value: 0, status: "Ruim" },
        { name: "Impacto", value: 0, status: "Ruim" },
      ];
    }

    return [
      { name: "TSR", value: cr.tsr || 0, status: getStatus(cr.tsr || 0, "tsr") },
      { name: "Retenção", value: cr.retencao || 0, status: getStatus(cr.retencao || 0, "retencao") },
      { name: "Impacto", value: cr.impacto || 0, status: getStatus(cr.impacto || 0, "impacto") },
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
          <div className={styles.chartHeader}>
            <h3>Performance por Criativo</h3>
            <div className={styles.searchBox}>
              <input 
                type="text" 
                className={styles.chartSearch}
                placeholder="Buscar criativo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <defs>
                <linearGradient id="colorElite" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d946ef" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#d946ef" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="colorBom" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="colorMedio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="colorRuim" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                stroke="var(--text-secondary)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                formatter={(value: any) => [`${Number(value || 0).toFixed(2)}%`, "Valor"]}
                cursor={{ fill: 'var(--bg-raised)', opacity: 0.4 }}
                contentStyle={{ 
                  background: "var(--bg-surface)", 
                  border: "1px solid var(--border-subtle)", 
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-lg)",
                  padding: "12px"
                }}
                itemStyle={{ color: "var(--text-primary)", fontWeight: 600 }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      entry.status === "Elite" ? "url(#colorElite)" : 
                      entry.status === "Bom" ? "url(#colorBom)" : 
                      entry.status === "Médio" ? "url(#colorMedio)" : "url(#colorRuim)"
                    } 
                  />
                ))}
                <LabelList 
                  dataKey="value" 
                  position="top" 
                  formatter={(v: any) => `${Number(v).toFixed(2)}%`}
                  style={{ fill: 'var(--text-primary)', fontSize: '12px', fontWeight: 'bold' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
