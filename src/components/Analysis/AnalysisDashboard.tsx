"use client";

import React from "react";
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
    </div>
  );
}
