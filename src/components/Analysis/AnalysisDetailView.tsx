"use client";

import React, { useState, useMemo } from "react";
import styles from "./AnalysisDetailView.module.css";
import { ArrowLeft, Search, Zap, Target, MessageSquare, Sparkles, ArrowUp, ArrowDown } from "lucide-react";
import AnalysisDashboard from "./AnalysisDashboard";
import type { CampaignCard } from "../Kanban/KanbanBoard";

interface AnalysisDetailViewProps {
  card: CampaignCard & { metadata: any };
  onBack: () => void;
  allCreatives?: any[];
}

export default function AnalysisDetailView({ card, onBack, allCreatives }: AnalysisDetailViewProps) {
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

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = useMemo(() => {
    if (!enrichedData) return [];
    const filtered = enrichedData.filter((row: any) => {
      if (!filter) return true;
      const q = filter.toLowerCase();
      const criativo = String(row?.['Criativo'] || "").toLowerCase();
      const campanha = String(row?.['Campanha'] || row?.['Nome da campanha'] || "").toLowerCase();
      return criativo.includes(q) || campanha.includes(q);
    });

    if (sortConfig !== null) {
      filtered.sort((a: any, b: any) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Lidar com hífen e nulos na ordenação (vão pro final)
        if (valA === "-" || valA === undefined || valA === null) valA = -99999999;
        if (valB === "-" || valB === undefined || valB === null) valB = -99999999;

        // Se forem strings puras (ex: nomes de criativos)
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [enrichedData, filter, sortConfig]);

  const structured = analysis?.insights_estruturados;

  const formatNum = (val: any, decimals: number = 2) => {
    const num = Number(val);
    return isNaN(num) ? (0).toFixed(decimals) : num.toFixed(decimals);
  };

  const getMatchedTag = (originalName: string, type: 'hook' | 'format' | 'cta') => {
    const platformCr = allCreatives?.find((pc: any) =>
      pc.name.toLowerCase().includes(originalName.toLowerCase()) ||
      originalName.toLowerCase().includes(pc.name.toLowerCase())
    );
    if (!platformCr) return null;
    if (type === 'hook') return platformCr.hookType;
    if (type === 'format') return platformCr.format;
    return platformCr.ctaType;
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
                  {[...enrichedData].sort((a: any, b: any) => (Number(b['TSR']) || 0) - (Number(a['TSR']) || 0)).slice(0, 3).map((cr: any, idx: number) => {
                    const tag = getMatchedTag(cr['Criativo'], 'hook');
                    return (
                      <div key={idx} className={styles.rankingItem} title={cr['Criativo']}>
                        <div className={styles.rankMainRow}>
                          <span className={styles.rankNum}>{idx + 1}º</span>
                          <span className={styles.rankName}>{cr['Criativo']}</span>
                          <span className={styles.rankVal}>{formatNum(cr['TSR'])}%</span>
                        </div>
                        {tag && (
                          <div className={styles.rankTagRow}>
                            <span className={styles.realTagBadge}>{tag}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                  {[...enrichedData].sort((a: any, b: any) => (Number(b['Retenção']) || 0) - (Number(a['Retenção']) || 0)).slice(0, 3).map((cr: any, idx: number) => {
                    const tag = getMatchedTag(cr['Criativo'], 'format');
                    return (
                      <div key={idx} className={styles.rankingItem} title={cr['Criativo']}>
                        <div className={styles.rankMainRow}>
                          <span className={styles.rankNum}>{idx + 1}º</span>
                          <span className={styles.rankName}>{cr['Criativo']}</span>
                          <span className={styles.rankVal}>{formatNum(cr['Retenção'])}%</span>
                        </div>
                        {tag && (
                          <div className={styles.rankTagRow}>
                            <span className={styles.realTagBadge}>{tag}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                  <span className={styles.benchmarkNote}>Ideal: &gt; 15% CTR de Impacto</span>
                </div>
              </div>
              <p className={styles.insightText}>
                {structured?.cta?.analise || "Análise de fechamento e CTAs não disponível."}
              </p>

              <div className={styles.rankingSection}>
                <h4 className={styles.rankingTitle}>TOP 3 IMPACTO (CTR)</h4>
                <div className={styles.rankingList}>
                  {[...enrichedData].sort((a: any, b: any) => (Number(b['Impacto']) || 0) - (Number(a['Impacto']) || 0)).slice(0, 3).map((cr: any, idx: number) => {
                    const tag = getMatchedTag(cr['Criativo'], 'cta');
                    return (
                      <div key={idx} className={styles.rankingItem} title={cr['Criativo']}>
                        <div className={styles.rankMainRow}>
                          <span className={styles.rankNum}>{idx + 1}º</span>
                          <span className={styles.rankName}>{cr['Criativo']}</span>
                          <span className={styles.rankVal}>{formatNum(cr['Impacto'])}%</span>
                        </div>
                        {tag && (
                          <div className={styles.rankTagRow}>
                            <span className={styles.realTagBadge}>{tag}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bloco: Laboratório de Criativos */}
        <div className={styles.labSection}>
          <div className={styles.labHeader}>
            <h2 className={styles.sectionTitle}>Laboratório de Criativos</h2>
            <span className={styles.labBadge}>
              <Sparkles size={12} /> Sugestões de Combinação
            </span>
          </div>

          <div className={styles.labGrid}>
            <div className={`${styles.labCard} ${styles.labCardHover}`}>
              <div className={styles.labCardAccent} />
              <div className={styles.labCardHeader}>
                <span className={`${styles.labRecipeBadge} ${styles.labBadgeHook}`}>Hook: VID002</span>
                <span className={styles.labCardPlus}>+</span>
                <span className={`${styles.labRecipeBadge} ${styles.labBadgeHold}`}>Meio: VID005</span>
                <span className={styles.labCardPlus}>+</span>
                <span className={`${styles.labRecipeBadge} ${styles.labBadgeCta}`}>CTA: VID001</span>
              </div>
              <p className={styles.labCardBody}>
                O <strong>VID002</strong> tem um TSR excelente (45%), mas perde retenção. O <strong>VID005</strong> segura a atenção (Hold de 35%). Juntar o início de um com o meio do outro pode gerar um criativo vencedor.
              </p>
            </div>

            <div className={`${styles.labCard} ${styles.labCardHover}`}>
              <div className={styles.labCardAccent} />
              <div className={styles.labCardHeader}>
                <span className={`${styles.labRecipeBadge} ${styles.labBadgeHook}`}>Hook: VID008</span>
                <span className={styles.labCardPlus}>+</span>
                <span className={`${styles.labRecipeBadge} ${styles.labBadgeHold}`}>Meio: VID003</span>
              </div>
              <p className={styles.labCardBody}>
                O gancho do <strong>VID008</strong> gerou curiosidade acima da média, combinando perfeitamente com a estruturação narrativa forte que segurou o público no <strong>VID003</strong>.
              </p>
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
              impacto_avg: (analysis?.performance_metrics?.impacto_avg > 50) ? analysis?.performance_metrics?.impacto_avg / 10 : (analysis?.performance_metrics?.impacto_avg || 0)
            }}
            top_criativos={(analysis?.top_criativos || []).map((c: any) => {
              const row = enrichedData.find((r: any) => r['Criativo'] === c.nome);
              const impMatch = Number(row?.['Impacto']) || 0;
              return {
                ...c,
                tsr: Number(row?.['TSR']) || 0,
                retencao: Number(row?.['Retenção']) || 0,
                impacto: impMatch > 50 ? impMatch / 10 : impMatch
              };
            })}
            allPlatformCreatives={allCreatives}
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
                  <th className={styles.stickyCol} onClick={() => requestSort('Criativo')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Criativo {sortConfig?.key === 'Criativo' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                  </th>
                  <th onClick={() => requestSort('Impressões')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Impressões {sortConfig?.key === 'Impressões' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                  </th>
                  <th onClick={() => requestSort('Alcance')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Alcance {sortConfig?.key === 'Alcance' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                  </th>
                  <th onClick={() => requestSort('Valor gasto')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Valor {sortConfig?.key === 'Valor gasto' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                  </th>
                  <th onClick={() => requestSort('ROAS')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>ROAS {sortConfig?.key === 'ROAS' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                  </th>
                  <th onClick={() => requestSort('CPR')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>CPR {sortConfig?.key === 'CPR' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                  </th>
                  <th onClick={() => requestSort('CPS')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>CPS {sortConfig?.key === 'CPS' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                  </th>
                  <th onClick={() => requestSort('TSR')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>TSR {sortConfig?.key === 'TSR' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                  </th>
                  <th onClick={() => requestSort('Retenção')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Retenção {sortConfig?.key === 'Retenção' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                  </th>
                  <th onClick={() => requestSort('Impacto')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Impacto {sortConfig?.key === 'Impacto' && (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row: any, i: number) => {
                  return (
                    <tr key={i}>
                      <td className={`${styles.stickyCol} ${styles.tdName}`}>
                        {row?.['Criativo'] || "Anúncio sem nome"}
                      </td>
                      <td>{(Number(row?.['Impressões']) || 0).toLocaleString('pt-BR')}</td>
                      <td>{(Number(row?.['Alcance'] || row?.['alcance']) || 0).toLocaleString('pt-BR')}</td>
                      <td className={`${styles.metricVal} ${styles.noWrap}`}>R$ {formatNum(row?.['Valor gasto'] || row?.['Valor'], 2).replace('.', ',')}</td>
                      <td className={styles.metricVal}>{Number(row?.['ROAS']) > 0 ? formatNum(row?.['ROAS'], 2).replace('.', ',') + 'x' : '--'}</td>
                      <td className={`${styles.metricVal} ${styles.noWrap}`}>
                        {(() => {
                          const cprVal = Number(row?.['CPR']);
                          const cplVal = Number(row?.['CPL']);
                          const finalCpr = cprVal > 0 ? cprVal : (cplVal > 0 ? cplVal : 0);
                          return finalCpr > 0 ? 'R$ ' + formatNum(finalCpr, 2).replace('.', ',') : '--';
                        })()}
                      </td>
                      <td className={`${styles.metricVal} ${styles.noWrap}`}>{Number(row?.['CPS']) > 0 ? 'R$ ' + formatNum(row?.['CPS'], 2).replace('.', ',') : '--'}</td>
                      <td className={styles.metricVal} style={{ textAlign: row?.['TSR'] === "-" ? "center" : undefined }}>
                        {row?.['TSR'] === "-" ? "-" : `${formatNum(row?.['TSR'], 2)}%`}
                      </td>
                      <td className={styles.metricVal} style={{ textAlign: row?.['Retenção'] === "-" ? "center" : undefined }}>
                        {row?.['Retenção'] === "-" ? "-" : `${formatNum(row?.['Retenção'], 2)}%`}
                      </td>
                      <td className={styles.metricVal} style={{ textAlign: row?.['Impacto'] === "-" ? "center" : undefined }}>
                        {row?.['Impacto'] === "-" ? "-" : (() => {
                          const imp = Number(row?.['Impacto']) || 0;
                          return `${formatNum(imp > 50 ? imp / 10 : imp, 2)}%`;
                        })()}
                      </td>
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
