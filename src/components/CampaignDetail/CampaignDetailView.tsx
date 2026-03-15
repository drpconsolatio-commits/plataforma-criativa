"use client";

import styles from "./CampaignDetailView.module.css";
import { useState, useEffect } from "react";
import type { Creative, Channel } from "../Kanban/KanbanBoard";
import CreativeDetailPanel from "./CreativeDetailPanel";
import { getBadgeStyle } from "../../utils/colors";
import { ArrowLeft, Check, Sparkles, Pencil, Trash2, Filter, Copy, ArrowRightLeft } from "lucide-react";
import ColumnFilter from "../Common/ColumnFilter";
import ContextMenu, { ContextMenuAction } from "../Common/ContextMenu";
import MoveCopyModal from "../Modal/MoveCopyModal";
import AnalysisUpload from "../Kanban/AnalysisUpload";

interface Props {
  card: { id: string; title: string; date: string; creatives: Creative[] };
  columnId: string;
  onBack: () => void;
  onUpdateCreative: (creativeId: string, updates: Partial<Creative>) => void;
  onAddCreative: (creative: Creative) => void;
  hookTypes: string[];
  formats: string[];
  ctaTypes: string[];
  onAddCustomOption: (type: "hook" | "format" | "cta" | "objective", value: string) => void;
  onRemoveCustomOption: (type: "hook" | "format" | "cta" | "objective", value: string) => void;
  objectives: string[];
  trafegoSubs: string[];
  organicoSubs: string[];
  onAddSubChannel: (channel: Channel, value: string) => void;
  onRemoveSubChannel: (channel: Channel, value: string) => void;
  onRenameCampaign: (cardId: string, newTitle: string) => void;
  onDeleteCreative: (creativeId: string) => void;
  onMoveCreative: (creativeId: string, targetCampaignId: string) => void;
  onCopyCreative: (creativeId: string, targetCampaignId: string) => void;
  onAnalysisComplete?: (result: any) => void;
  allCampaigns: { id: string; title: string; date: string }[];
}

export default function CampaignDetailView({
  card,
  columnId,
  onBack,
  onUpdateCreative,
  onAddCreative,
  hookTypes,
  formats,
  ctaTypes,
  onAddCustomOption,
  onRemoveCustomOption,
  trafegoSubs,
  organicoSubs,
  onAddSubChannel,
  onRemoveSubChannel,
  onRenameCampaign,
  objectives,
  onDeleteCreative,
  onMoveCreative,
  onCopyCreative,
  onAnalysisComplete,
  allCampaigns,
}: Props) {
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "date-desc" | "date-asc">("date-desc");

  // Menu de Contexto
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, creative: Creative } | null>(null);
  const [moveCopyModal, setMoveCopyModal] = useState<{ type: "move" | "copy", creative: Creative } | null>(null);
  
  // Edição Titulo Campanha
  const [editingCampaignTitle, setEditingCampaignTitle] = useState(false);
  const [campaignTitleVal, setCampaignTitleVal] = useState(card.title);
  
  const [prevCardTitle, setPrevCardTitle] = useState(card.title);
  if (card.title !== prevCardTitle) {
    setPrevCardTitle(card.title);
    setCampaignTitleVal(card.title);
  }

  const handleSaveCampaignTitle = () => {
    const trimmed = campaignTitleVal.trim();
    if (trimmed && trimmed !== card.title) {
      onRenameCampaign(card.id, trimmed);
    } else {
      setCampaignTitleVal(card.title);
    }
    setEditingCampaignTitle(false);
  };

  // Edição Nome Criativo
  const [editingCreativeId, setEditingCreativeId] = useState<string | null>(null);
  const [creativeNameVal, setCreativeNameVal] = useState("");

  const startEditingCreative = (cr: Creative) => {
    setEditingCreativeId(cr.id);
    setCreativeNameVal(cr.name);
  };

  const handleSaveCreativeName = (cr: Creative) => {
    const trimmed = creativeNameVal.trim();
    if (trimmed && trimmed !== cr.name) {
      onUpdateCreative(cr.id, { name: trimmed });
    }
    setEditingCreativeId(null);
  };

  const handleCopyName = (name: string) => {
    navigator.clipboard.writeText(name);
    // Opcional: feedback visual ou toast
  };

  const doneCount = card.creatives.filter((c) => c.status === "done").length;

  const sortedCreatives = [...card.creatives].sort((a, b) => {
    if (sortBy === "name-asc") return a.name.localeCompare(b.name);
    if (sortBy === "name-desc") return b.name.localeCompare(a.name);
    if (sortBy === "date-desc") return b.createdAt - a.createdAt;
    if (sortBy === "date-asc") return a.createdAt - b.createdAt;
    return 0;
  });

  const filteredCreatives = sortedCreatives.filter((c) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      (c.name?.toLowerCase().includes(q) || false) ||
      (card.title?.toLowerCase().includes(q) || false) || // Assuming card.title is the campaignTitle
      (c.hookType?.toLowerCase().includes(q) || false) ||
      (c.format?.toLowerCase().includes(q) || false) ||
      (c.ctaType?.toLowerCase().includes(q) || false) ||
      (c.marketingAngle?.toLowerCase().includes(q) || false) ||
      (c.subChannels?.some((s) => s.toLowerCase().includes(q)) || false)
    );
  });

  // Filtros de Coluna
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});

  const toggleColumnFilter = (column: string, selected: string[]) => {
    setColumnFilters(prev => ({ ...prev, [column]: selected }));
  };

  const getUniqueValues = (key: keyof Creative) => {
    const vals = card.creatives.map(cr => {
        const val = cr[key];
        return val ? String(val) : '';
    });
    return Array.from(new Set(vals)).sort();
  };

  const finalFilteredCreatives = filteredCreatives.filter(cr => {
    // Só aplica filtros de coluna se estiver em 'resultados'
    if (columnId !== 'resultados') return true;

    for (const [col, selected] of Object.entries(columnFilters)) {
      if (selected.length === 0) continue;
      
      const val = String(cr[col as keyof Creative] || '');
      if (!selected.includes(val)) return false;
    }
    return true;
  });

  const handleAddCreative = () => {
    const newCreative: Creative = {
      id: crypto.randomUUID(),
      name: "",
      hookType: "",
      marketingAngle: "",
      format: "",
      ctaType: "",
      reference: "",
      notes: "",
      recordingDirection: "",
      editingDirection: "",
      channels: [],
      subChannels: [],
      driveLink: "",
      uploadedToChannels: false,
      status: "pending",
      createdAt: Date.now(),
      objective: "",
      contentType: undefined,
    };
    onAddCreative(newCreative);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={14} /> Voltar ao Kanban
        </button>
        <div className={styles.headerInfo}>
          <div className={styles.titleRow}>
            {editingCampaignTitle ? (
              <input
                type="text"
                className={styles.titleInput}
                value={campaignTitleVal}
                onChange={(e) => setCampaignTitleVal(e.target.value)}
                onBlur={handleSaveCampaignTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveCampaignTitle();
                  if (e.key === "Escape") {
                    setCampaignTitleVal(card.title);
                    setEditingCampaignTitle(false);
                  }
                }}
                autoFocus
              />
            ) : (
              <>
                <h1
                  className={styles.title}
                  onDoubleClick={() => setEditingCampaignTitle(true)}
                  title="Duplo clique para renomear"
                >
                  {card.title}
                </h1>

                <div className={styles.headerActions}>
                  {onAnalysisComplete && (
                    <div className={styles.analysisAction} title="Analisar performance deste card">
                      <span className={styles.actionLabel}>Analisar Resultados</span>
                      <AnalysisUpload 
                        onAnalysisComplete={onAnalysisComplete} 
                        parentTitle={card.title} 
                      />
                    </div>
                  )}
                </div>
                <button
                  className={styles.editTitleBtn}
                  onClick={() => setEditingCampaignTitle(true)}
                  title="Renomear campanha"
                >
                  <Pencil size={14} />
                </button>
              </>
            )}
          </div>
          <div className={styles.meta}>
            <span className={styles.metaItem}>{card.date}</span>
            <span className={styles.metaDivider}>•</span>
            <span className={styles.metaItem}>
              {doneCount}/{card.creatives.length} criativos concluídos
            </span>
          </div>
        </div>
        <button className={styles.addBtn} onClick={handleAddCreative}>
          <span>+</span> Novo Criativo
        </button>
      </div>

      {/* Filter */}
      <div className={styles.filterBar}>
        <input
          type="text"
          className={styles.filterInput}
          placeholder="Filtrar criativos por nome, hook, formato..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        
        <div className={styles.sortBar}>
          <span className={styles.sortLabel}>Ordenar por:</span>
          <select 
            className={styles.sortSelect} 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="name-asc">A-Z</option>
            <option value="name-desc">Z-A</option>
            <option value="date-desc">Mais recente</option>
            <option value="date-asc">Mais antigo</option>
          </select>
        </div>

        {filter && (
          <span className={styles.filterCount}>
            {finalFilteredCreatives.length} de {card.creatives.length}
          </span>
        )}
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thContent}>
                Conteúdo
                {columnId === 'resultados' && (
                  <ColumnFilter 
                    label="Conteúdo"
                    options={getUniqueValues('contentType')}
                    selectedOptions={columnFilters['contentType'] || []}
                    onFilterChange={(s) => toggleColumnFilter('contentType', s)}
                    onClear={() => toggleColumnFilter('contentType', [])}
                    align="left"
                  />
                )}
              </th>
              <th className={styles.thName}>Nome do Criativo</th>
              <th>
                Hook
                {columnId === 'resultados' && (
                  <ColumnFilter 
                    label="Hook"
                    options={getUniqueValues('hookType')}
                    selectedOptions={columnFilters['hookType'] || []}
                    onFilterChange={(s) => toggleColumnFilter('hookType', s)}
                    onClear={() => toggleColumnFilter('hookType', [])}
                  />
                )}
              </th>
              <th>
                Formato
                {columnId === 'resultados' && (
                  <ColumnFilter 
                    label="Formato"
                    options={getUniqueValues('format')}
                    selectedOptions={columnFilters['format'] || []}
                    onFilterChange={(s) => toggleColumnFilter('format', s)}
                    onClear={() => toggleColumnFilter('format', [])}
                  />
                )}
              </th>
              <th>
                CTA
                {columnId === 'resultados' && (
                  <ColumnFilter 
                    label="CTA"
                    options={getUniqueValues('ctaType')}
                    selectedOptions={columnFilters['ctaType'] || []}
                    onFilterChange={(s) => toggleColumnFilter('ctaType', s)}
                    onClear={() => toggleColumnFilter('ctaType', [])}
                  />
                )}
              </th>
              <th>
                Ângulo
                {columnId === 'resultados' && (
                  <ColumnFilter 
                    label="Ângulo"
                    options={getUniqueValues('marketingAngle')}
                    selectedOptions={columnFilters['marketingAngle'] || []}
                    onFilterChange={(s) => toggleColumnFilter('marketingAngle', s)}
                    onClear={() => toggleColumnFilter('marketingAngle', [])}
                  />
                )}
              </th>
              <th>Canais</th>
            </tr>
          </thead>
          <tbody>
            {finalFilteredCreatives.map((creative) => (
              <tr
                key={creative.id}
                className={`${styles.row} ${
                  selectedCreative?.id === creative.id ? styles.rowActive : ""
                } ${creative.status === "done" ? styles.rowDone : ""}`}
                onClick={() => setSelectedCreative(creative)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, creative });
                }}
              >
                <td className={styles.tdContent}>
                  <span className={`${styles.contentPill} ${creative.contentType === 'Estático' ? styles.pillStatic : styles.pillVideo}`}>
                    {creative.contentType || 'Vídeo'}
                  </span>
                </td>
                <td className={styles.tdName}>
                  {editingCreativeId === creative.id ? (
                    <input
                      type="text"
                      className={styles.nameInput}
                      value={creativeNameVal}
                      onChange={(e) => setCreativeNameVal(e.target.value)}
                      onBlur={() => handleSaveCreativeName(creative)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveCreativeName(creative);
                        if (e.key === "Escape") setEditingCreativeId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <div className={styles.nameWrapper}>
                      <span
                        className={styles.nameText}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyName(creative.name);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          startEditingCreative(creative);
                        }}
                        title="Clique p/ copiar • Duplo clique p/ editar"
                      >
                        {creative.name}
                      </span>
                    </div>
                  )}
                </td>
                <td>
                  <span className={styles.pill} style={getBadgeStyle(creative.hookType)}>
                    {creative.hookType}
                  </span>
                </td>
                <td>
                  <span className={styles.pill} style={getBadgeStyle(creative.format)}>
                    {creative.format}
                  </span>
                </td>
                <td>
                  <span className={styles.pill} style={getBadgeStyle(creative.ctaType)}>
                    {creative.ctaType}
                  </span>
                </td>
                <td className={styles.tdAngle}>
                  {creative.marketingAngle ? (
                    <span className={styles.pill} style={getBadgeStyle(creative.marketingAngle, 'neutral')}>
                      {creative.marketingAngle}
                    </span>
                  ) : (
                    <span className={styles.empty}>—</span>
                  )}
                </td>
                <td className={styles.tdChannels}>
                  {creative.channels.length > 0 ? (
                    <div className={styles.channelTags}>
                      {creative.channels.map((ch) => (
                        <span key={ch} className={styles.channelTag}>{ch}</span>
                      ))}
                      {creative.subChannels.length > 0 && (
                        <span className={styles.subChannelCount}>
                          +{creative.subChannels.length} sub
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className={styles.empty}>—</span>
                  )}
                </td>
                <td className={styles.tdActions}>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {contextMenu && (
          <ContextMenu 
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            actions={[
              { 
                label: "Mover para...", 
                icon: <ArrowRightLeft size={14} />, 
                onClick: () => setMoveCopyModal({ type: "move", creative: contextMenu.creative }) 
              },
              { 
                label: "Copiar como modelo para...", 
                icon: <Copy size={14} />, 
                onClick: () => setMoveCopyModal({ type: "copy", creative: contextMenu.creative }) 
              },
              { 
                label: "Excluir Criativo", 
                icon: <Trash2 size={14} />, 
                danger: true,
                divider: true,
                onClick: () => onDeleteCreative(contextMenu.creative.id)
              }
            ]}
          />
        )}

        {moveCopyModal && (
          <MoveCopyModal 
            type={moveCopyModal.type}
            creativeName={moveCopyModal.creative.name}
            campaigns={allCampaigns}
            onClose={() => setMoveCopyModal(null)}
            onConfirm={(targetId) => {
              if (moveCopyModal.type === "move") {
                onMoveCreative(moveCopyModal.creative.id, targetId);
              } else {
                onCopyCreative(moveCopyModal.creative.id, targetId);
              }
              setMoveCopyModal(null);
            }}
          />
        )}

        {card.creatives.length === 0 && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}><Sparkles size={48} strokeWidth={1} /></span>
            <p>Nenhum criativo nesta campanha</p>
            <button className={styles.addBtnSmall} onClick={handleAddCreative}>
              + Adicionar criativo
            </button>
          </div>
        )}
      </div>

      {/* Creative Detail Panel (slide-in) */}
      {selectedCreative && (
        <CreativeDetailPanel
          creative={selectedCreative}
          onClose={() => setSelectedCreative(null)}
          onUpdate={(updates: Partial<Creative>) => {
            onUpdateCreative(selectedCreative.id, updates);
            setSelectedCreative((prev) => (prev ? { ...prev, ...updates } : null));
          }}
          hookTypes={hookTypes}
          formats={formats}
          ctaTypes={ctaTypes}
          onAddCustomOption={onAddCustomOption}
          onRemoveCustomOption={onRemoveCustomOption}
          objectives={objectives}
          trafegoSubs={trafegoSubs}
          organicoSubs={organicoSubs}
          onAddSubChannel={onAddSubChannel}
          onRemoveSubChannel={onRemoveSubChannel}
          onDelete={() => {
            onDeleteCreative(selectedCreative.id);
            setSelectedCreative(null);
          }}
        />
      )}
    </div>
  );
}
