"use client";

import React from "react";
import styles from "./AnalysisCard.module.css";
import type { CampaignCard } from "./KanbanBoard";
import { BarChart3, Zap, Target, MessageSquare, MoreVertical, GripVertical, Rocket } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  card: CampaignCard;
  index: number;
  onOpenFullscreen: () => void;
  isDragOverlay?: boolean;
}

export default function AnalysisCard({
  card,
  index,
  onOpenFullscreen,
  isDragOverlay = false,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    disabled: isDragOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const metrics = card.metadata?.analysis?.performance_metrics || {
    tsr_avg: 0,
    retencao_avg: 0,
    impacto_avg: 0,
  };

  const format = (v: number) => Number(v || 0).toFixed(1);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.card} ${card.pinned ? styles.pinned : ""}`}
    >
      <div className={styles.topRight}>
        <button className={styles.menuBtn} onClick={(e) => e.stopPropagation()}>
          <MoreVertical size={14} />
        </button>
        <div {...attributes} {...listeners} style={{ cursor: 'grab' }}>
          <GripVertical size={14} color="var(--text-muted)" />
        </div>
      </div>

      <div className={styles.cardHeader} onClick={onOpenFullscreen}>
        <span className={styles.date}>{card.date}</span>
        <h3 className={styles.cardTitle}>{card.title}</h3>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>TSR</span>
          <span className={`${styles.metricValue} ${metrics.tsr_avg >= 25 ? styles.elite : styles.ruim}`}>
            {format(metrics.tsr_avg)}%
          </span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>RET</span>
          <span className={`${styles.metricValue} ${metrics.retencao_avg >= 35 ? styles.elite : styles.ruim}`}>
            {format(metrics.retencao_avg)}%
          </span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>IMP</span>
          <span className={`${styles.metricValue} ${metrics.impacto_avg >= 1.5 ? styles.elite : styles.ruim}`}>
            {format(metrics.impacto_avg)}%
          </span>
        </div>
      </div>

      <div className={styles.expandHint}>
        <span className={styles.hintText} onClick={onOpenFullscreen}>
          Ver Insight Detalhado →
        </span>
        <div className={styles.aiBadge}>
          <Rocket size={10} />
          <span>IA READY</span>
        </div>
      </div>
    </div>
  );
}
