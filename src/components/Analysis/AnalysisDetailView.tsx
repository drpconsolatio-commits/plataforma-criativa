"use client";

import React, { useState, useMemo } from "react";
import styles from "./AnalysisDetailView.module.css";
import { ArrowLeft, Search, Zap, Target, MessageSquare } from "lucide-react";
import AnalysisDashboard from "./AnalysisDashboard";
import type { CampaignCard } from "../Kanban/KanbanBoard";

interface AnalysisDetailViewProps {
  card: CampaignCard & { metadata: any };
  onBack: () => void;
}

export default function AnalysisDetailView({ card, onBack }: AnalysisDetailViewProps) {
  const [filter, setFilter] = useState("");

  // Memoize metadata access to prevent crashes if metadata is missing
  const { analysis, enrichedData } = useMemo(() => {
    return {
      analysis: card?.metadata?.analysis || {},
      enrichedData: card?.metadata?.enrichedData || []
    };
  }, [card]);

  // Função robusta de extração de tags baseada em colchetes e padrão VID
  const extractTags = (name: string) => {
    if (!name) return [];
    
    // Busca tudo que estiver entre colchetes [TAG]
    const bracketMatches = name.match(/\[(.*?)\]/g);
    const tags = bracketMatches ? bracketMatches.map(m => m.slice(1, -1)) : [];
    
    // Adiciona o padrão VID\d+ se não estiver nos colchetes
    const vidMatch = name.match(/VID\d+/i);
    if (vidMatch && !tags.some(t => t.toUpperCase() === vidMatch[0].toUpperCase())) {
      tags.push(vidMatch[0].toUpperCase());
    }
    
    // Fallback: Se não encontrou nada, retorna o nome simplificado (primeiras 2 palavras)
    if (tags.length === 0) {
      return [name.split(' ').slice(0, 2).join(' ')];
    }
    
    return tags;
  };

  const filteredData = useMemo(() => {
    if (!enrichedData) return [];
    return enrichedData.filter((row: any) => {
      if (!filter) return true;
      const q = filter.toLowerCase();
      const criativo = String(row?.['Criativo'] || "").toLowerCase();
      const campanha = String(row?.['Campanha'] || row?.['Nome da campanha'] || "").toLowerCase();
      return criativo.includes(q) || campanha.includes(q);
    });
  }, [enrichedData, filter]);

  const structured = analysis?.insights_estruturados;

  // Helper para formatar números com segurança
  const formatNum = (val: any, decimals: number = 2) => {
    const num = Number(val);
    return isNaN(num) ? (0).toFixed(decimals) : num.toFixed(decimals);
  };

  return (
    <div className={styles.container} style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={16} /> Voltar ao Kanban
        </button>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>{card?.title || "Análise"}</h1>
          <span className={styles.subtitle}>Relatório de Performance Criativa — Blindagem v3.0</span>
        </div>
      </div>

      <div className={styles.content}>
        {/* Bloco 1: 3 Cards de Insights com Rankings */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Insights Estratégicos por Fase</h2>
          <div className={styles.insightsGrid}>
            {/* Card 1: HOOK */}
            <div className={styles.insightCard}>
              <div className={styles.insightHeader}>
                <div className={`${styles.iconWrapper} ${styles.hookIcon}`}>
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className={styles.insightTitle}>HOOK / GANCHO</h3>
                  <span className={styles.benchmarkNote}>Ideal: &gt; 25% TSR para escala</span>
                </div>
              </div>
              <p className={styles.insightText}>
                {structured?.hook?.analise || "Análise de retenção inicial não disponível."}
              </p>
              
              <div className={styles.rankingSection}>
                <h4 className={styles.rankingTitle}>TOP 3 GANCHO (TSR)</h4>
                <div className={styles.rankingList}>
                  {enrichedData.sort((a: any, b: any) => (Number(b['TSR']) || 0) - (Number(a['TSR']) || 0)).slice(0, 3).map((cr: any, idx: number) => (
                    <div key={idx} className={styles.rankingItem} title={`${cr['Criativo']} - ${formatNum(cr['TSR'])}%`}>
                      <span className={styles.rankNum}>{idx + 1}º</span>
                      <span className={styles.rankName}>{String(cr['Criativo']).length > 20 ? String(cr['Criativo']).slice(0, 17) + '...' : cr['Criativo']}</span>
                      <span className={styles.rankVal}>{formatNum(cr['TSR'])}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 2: MEIO */}
            <div className={styles.insightCard}>
              <div className={styles.insightHeader}>
                <div className={`${styles.iconWrapper} ${styles.midIcon}`}>
                  <Target size={20} />
                </div>
                <div>
                  <h3 className={styles.insightTitle}>MEIO / RETENÇÃO</h3>
                  <span className={styles.benchmarkNote}>Ideal: &lt; 20% queda de retenção</span>
                </div>
              </div>
              <p className={styles.insightText}>
                {structured?.retencao?.analise || "Análise de estruturação do vídeo não disponível."}
              </p>

              <div className={styles.rankingSection}>
                <h4 className={styles.rankingTitle}>TOP 3 MEIO (HOLD)</h4>
                <div className={styles.rankingList}>
                  {enrichedData.sort((a: any, b: any) => (Number(b['Retenção']) || 0) - (Number(a['Retenção']) || 0)).slice(0, 3).map((cr: any, idx: number) => (
                    <div key={idx} className={styles.rankingItem} title={`${cr['Criativo']} - ${formatNum(cr['Retenção'])}%`}>
                      <span className={styles.rankNum}>{idx + 1}º</span>
                      <span className={styles.rankName}>{String(cr['Criativo']).length > 20 ? String(cr['Criativo']).slice(0, 17) + '...' : cr['Criativo']}</span>
                      <span className={styles.rankVal}>{formatNum(cr['Retenção'])}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 3: CTA */}
            <div className={styles.insightCard}>
              <div className={styles.insightHeader}>
                <div className={`${styles.iconWrapper} ${styles.ctaIcon}`}>
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className={styles.insightTitle}>CTA / IMPACTO</h3>
                  <span className={styles.benchmarkNote}>Ideal: &gt; 1.5% CTR de Impacto</span>
                </div>
              </div>
              <p className={styles.insightText}>
                {structured?.cta?.analise || "Análise de fechamento e CTAs não disponível."}
              </p>

              <div className={styles.rankingSection}>
                <h4 className={styles.rankingTitle}>TOP 3 IMPACTO (CTR)</h4>
                <div className={styles.rankingList}>
                  {enrichedData.sort((a: any, b: any) => (Number(b['Impacto']) || 0) - (Number(a['Impacto']) || 0)).slice(0, 3).map((cr: any, idx: number) => (
                    <div key={idx} className={styles.rankingItem} title={`${cr['Criativo']} - ${formatNum(cr['Impacto'])}%`}>
                      <span className={styles.rankNum}>{idx + 1}º</span>
                      <span className={styles.rankName}>{String(cr['Criativo']).length > 20 ? String(cr['Criativo']).slice(0, 17) + '...' : cr['Criativo']}</span>
                      <span className={styles.rankVal}>{formatNum(cr['Impacto'])}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 2: Dashboards Defensivos */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Dashboards de Performance</h2>
          <AnalysisDashboard 
            metrics={{
              tsr_avg: analysis?.performance_metrics?.tsr_avg || 0,
              retencao_avg: analysis?.performance_metrics?.retencao_avg || 0,
              impacto_avg: analysis?.performance_metrics?.impacto_avg || 0
            }} 
            top_criativos={analysis?.top_criativos || []} 
          />
        </div>

        {/* Bloco 3: Tabela de Dados com Sanitização de Tags */}
        <div className={styles.section}>
          <div className={styles.tableHeader}>
            <h2 className={styles.sectionTitle}>Dados Detalhados</h2>
            <div className={styles.searchWrapper}>
              <Search size={14} className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Filtrar criativo..." 
                className={styles.searchInput}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>
          
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.stickyCol}>Criativo</th>
                  <th>Impressões</th>
                  <th>Valor</th>
                  <th>ROAS</th>
                  <th>CPR</th>
                  <th>CPS</th>
                  <th>TSR</th>
                  <th>Retenção</th>
                  <th>Impacto</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row: any, i: number) => {
                  return (
                    <tr key={i}>
                      <td className={`${styles.stickyCol} ${styles.tdName}`}>
                        {row?.['Criativo'] || "Anúncio sem nome"}
                        <span className={styles.campaignLabel}>{row?.['Campanha'] || row?.['Nome da campanha'] || ""}</span>
                      </td>
                      <td>{(Number(row?.['Impressões']) || 0).toLocaleString('pt-BR')}</td>
                      <td className={`${styles.metricVal} ${styles.noWrap}`}>R$ {formatNum(row?.['Valor gasto'] || row?.['Valor'], 2).replace('.', ',')}</td>
                      <td className={styles.metricVal}>{Number(row?.['ROAS']) > 0 ? formatNum(row?.['ROAS'], 2).replace('.', ',') + 'x' : '--'}</td>
                      <td className={styles.metricVal}>
                        {(() => {
                          const cprVal = Number(row?.['CPR']);
                          const cplVal = Number(row?.['CPL']);
                          const finalCpr = cprVal > 0 ? cprVal : (cplVal > 0 ? cplVal : 0);
                          return finalCpr > 0 ? 'R$ ' + formatNum(finalCpr, 2).replace('.', ',') : '--';
                        })()}
                      </td>
                      <td className={styles.metricVal}>{Number(row?.['CPS']) > 0 ? 'R$ ' + formatNum(row?.['CPS'], 2).replace('.', ',') : '--'}</td>
                      <td className={styles.metricVal}>{formatNum(row?.['TSR'], 2)}%</td>
                      <td className={styles.metricVal}>{formatNum(row?.['Retenção'], 2)}%</td>
                      <td className={styles.metricVal}>{formatNum(row?.['Impacto'], 2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
