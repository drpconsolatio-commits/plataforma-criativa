"use client";

import styles from "./ChannelDetailView.module.css";
import { useState } from "react";
import type { Creative, CreativeWithCampaign, Channel } from "../Kanban/KanbanBoard";
import CreativeDetailPanel from "./CreativeDetailPanel";
import { getBadgeStyle } from "../../utils/colors";
import { ArrowLeft, Check, Megaphone, Leaf, FolderOpen, Trash2, Filter, Copy, ArrowRightLeft } from "lucide-react";
import ColumnFilter from "../Common/ColumnFilter";
import ContextMenu from "../Common/ContextMenu";
import MoveCopyModal from "../Modal/MoveCopyModal";

interface Props {
  channelType: Channel;
  creatives: CreativeWithCampaign[];
  onBack: () => void;
  onUpdateCreative: (creativeId: string, updates: Partial<Creative>) => void;
  hookTypes: string[];
  formats: string[];
  ctaTypes: string[];
  onAddCustomOption: (type: "hook" | "format" | "cta" | "objective", value: string) => void;
  onRemoveCustomOption: (type: "hook" | "format" | "cta" | "objective", value: string) => void;
  objectives: string[];
  trafegoSubs: string[];
  organicoSubs: string[];
  onAddSubChannel: (value: string) => void;
  onRemoveSubChannel: (value: string) => void;
  onDeleteCreative: (creativeId: string) => void;
  onMoveCreative: (creativeId: string, targetCampaignId: string) => void;
  onCopyCreative: (creativeId: string, targetCampaignId: string) => void;
  allCampaigns: { id: string; title: string; date: string }[];
}

const CHANNEL_META: Record<Channel, { icon: React.ReactNode; description: string }> = {
  "Tráfego Pago": {
    icon: <Megaphone size={28} />,
    description: "Facebook ADS • Google ADS • TikTok ADS",
  },
  "Orgânicos": {
    icon: <Leaf size={28} />,
    description: "Instagram • TikTok • YouTube",
  },
};

export default function ChannelDetailView({
  channelType,
  creatives,
  onBack,
  onUpdateCreative,
  hookTypes,
  formats,
  ctaTypes,
  onAddCustomOption,
  onRemoveCustomOption,
  trafegoSubs,
  organicoSubs,
  onAddSubChannel,
  onRemoveSubChannel,
  objectives,
  onDeleteCreative,
  onMoveCreative,
  onCopyCreative,
  allCampaigns,
}: Props) {
  const [selectedCreative, setSelectedCreative] = useState<CreativeWithCampaign | null>(null);
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "date-desc" | "date-asc">("date-desc");

  // Menu de Contexto
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, creative: CreativeWithCampaign } | null>(null);
  const [moveCopyModal, setMoveCopyModal] = useState<{ type: "move" | "copy", creative: CreativeWithCampaign } | null>(null);
  const meta = CHANNEL_META[channelType];

  // Edição Nome Criativo
  const [editingCreativeId, setEditingCreativeId] = useState<string | null>(null);
  const [creativeNameVal, setCreativeNameVal] = useState("");

  // Filtros de Coluna
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});

  const toggleColumnFilter = (column: string, selected: string[]) => {
    setColumnFilters(prev => ({ ...prev, [column]: selected }));
  };

  const getUniqueValues = (key: keyof CreativeWithCampaign | 'campaignTitle') => {
    const vals = creatives.map(cr => {
        const val = cr[key as keyof CreativeWithCampaign];
        return val ? String(val) : '';
    });
    return Array.from(new Set(vals)).sort();
  };
  
  const getSubChannelValues = () => {
    const all = creatives.flatMap(cr => cr.subChannels);
    return Array.from(new Set(all)).sort();
  };

  const startEditingCreative = (cr: CreativeWithCampaign) => {
    setEditingCreativeId(cr.id);
    setCreativeNameVal(cr.name);
  };

  const handleSaveCreativeName = (cr: CreativeWithCampaign) => {
    const trimmed = creativeNameVal.trim();
    if (trimmed && trimmed !== cr.name) {
      onUpdateCreative(cr.id, { name: trimmed });
    }
    setEditingCreativeId(null);
  };

  const handleCopyName = (name: string) => {
    navigator.clipboard.writeText(name);
  };

  const sorted = [...creatives].sort((a, b) => {
    if (sortBy === "name-asc") return a.name.localeCompare(b.name);
    if (sortBy === "name-desc") return b.name.localeCompare(a.name);
    if (sortBy === "date-desc") return b.createdAt - a.createdAt;
    if (sortBy === "date-asc") return a.createdAt - b.createdAt;
    return 0;
  });

  const filtered = sorted.filter((cr) => {
    // Busca global
    const q = filter.toLowerCase();
    const matchesSearch = !filter || (
      (cr.name?.toLowerCase().includes(q) || false) ||
      (cr.campaignTitle?.toLowerCase().includes(q) || false) ||
      (cr.hookType?.toLowerCase().includes(q) || false) ||
      (cr.format?.toLowerCase().includes(q) || false) ||
      (cr.ctaType?.toLowerCase().includes(q) || false) ||
      (cr.subChannels?.some((s) => s.toLowerCase().includes(q)) || false)
    );

    if (!matchesSearch) return false;

    // Filtros de coluna
    for (const [col, selected] of Object.entries(columnFilters)) {
      if (selected.length === 0) continue;
      
      if (col === 'subChannels') {
        if (!cr.subChannels.some(s => selected.includes(s))) return false;
      } else if (col === 'uploadedToChannels') {
        const val = cr.uploadedToChannels ? 'Subido' : 'Não subido';
        if (!selected.includes(val)) return false;
      } else {
        const val = String(cr[col as keyof CreativeWithCampaign] || '');
        if (!selected.includes(val)) return false;
      }
    }

    return true;
  });

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={14} /> Voltar ao Kanban
        </button>
        <div className={styles.headerInfo}>
          <div className={styles.titleRow}>
            <span className={styles.icon}>{meta.icon}</span>
            <h1 className={styles.title}>{channelType}</h1>
          </div>
          <div className={styles.meta}>
            <span className={styles.metaDesc}>{meta.description}</span>
            <span className={styles.metaDivider}>•</span>
            <span className={styles.metaItem}>{creatives.length} criativos</span>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className={styles.filterBar}>
        <input
          type="text"
          className={styles.filterInput}
          placeholder="Filtrar por nome, campanha, sub-canal..."
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
            {filtered.length} de {creatives.length}
          </span>
        )}
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thUpload}>
                Upload
                <ColumnFilter 
                  label="Upload"
                  options={['Subido', 'Não subido']}
                  selectedOptions={columnFilters['uploadedToChannels'] || []}
                  onFilterChange={(s) => toggleColumnFilter('uploadedToChannels', s)}
                  onClear={() => toggleColumnFilter('uploadedToChannels', [])}
                />
              </th>
              <th className={styles.thCampaign}>
                Campanha
                <ColumnFilter 
                  label="Campanha"
                  options={getUniqueValues('campaignTitle')}
                  selectedOptions={columnFilters['campaignTitle'] || []}
                  onFilterChange={(s) => toggleColumnFilter('campaignTitle', s)}
                  onClear={() => toggleColumnFilter('campaignTitle', [])}
                />
              </th>
              <th className={styles.thContent}>
                Conteúdo
                <ColumnFilter 
                  label="Conteúdo"
                  options={getUniqueValues('contentType')}
                  selectedOptions={columnFilters['contentType'] || []}
                  onFilterChange={(s) => toggleColumnFilter('contentType', s)}
                  onClear={() => toggleColumnFilter('contentType', [])}
                />
              </th>
              <th className={styles.thName}>Nome do Criativo</th>
              {channelType === "Tráfego Pago" ? (
                <th>
                    Objetivo
                    <ColumnFilter 
                      label="Objetivo"
                      options={getUniqueValues('objective')}
                      selectedOptions={columnFilters['objective'] || []}
                      onFilterChange={(s) => toggleColumnFilter('objective', s)}
                      onClear={() => toggleColumnFilter('objective', [])}
                    />
                </th>
              ) : (
                <>
                  <th>
                    Hook
                    <ColumnFilter 
                      label="Hook"
                      options={getUniqueValues('hookType')}
                      selectedOptions={columnFilters['hookType'] || []}
                      onFilterChange={(s) => toggleColumnFilter('hookType', s)}
                      onClear={() => toggleColumnFilter('hookType', [])}
                    />
                  </th>
                  <th>
                    Formato
                    <ColumnFilter 
                      label="Formato"
                      options={getUniqueValues('format')}
                      selectedOptions={columnFilters['format'] || []}
                      onFilterChange={(s) => toggleColumnFilter('format', s)}
                      onClear={() => toggleColumnFilter('format', [])}
                    />
                  </th>
                  <th>
                    CTA
                    <ColumnFilter 
                      label="CTA"
                      options={getUniqueValues('ctaType')}
                      selectedOptions={columnFilters['ctaType'] || []}
                      onFilterChange={(s) => toggleColumnFilter('ctaType', s)}
                      onClear={() => toggleColumnFilter('ctaType', [])}
                    />
                  </th>
                </>
              )}
              <th>
                Sub-canais
                <ColumnFilter 
                  label="Sub-canais"
                  options={getSubChannelValues()}
                  selectedOptions={columnFilters['subChannels'] || []}
                  onFilterChange={(s) => toggleColumnFilter('subChannels', s)}
                  onClear={() => toggleColumnFilter('subChannels', [])}
                />
              </th>
              <th>Drive</th>
              <th className={styles.thActions}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((creative) => (
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
                <td className={styles.tdUpload}>
                  <button
                    className={`${styles.uploadTag} ${
                      creative.uploadedToChannels ? styles.tagYes : styles.tagNo
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateCreative(creative.id, {
                        uploadedToChannels: !creative.uploadedToChannels,
                      });
                    }}
                  >
                    {creative.uploadedToChannels ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                        Subido <Check size={14} />
                      </span>
                    ) : "Não subido"}
                  </button>
                </td>
                <td className={styles.tdCampaign}>
                  <span className={styles.campaignPill}>{creative.campaignTitle}</span>
                </td>
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
                {channelType === "Tráfego Pago" ? (
                  <td>
                    {creative.objective ? (
                      <span className={styles.pillObjective} style={getBadgeStyle(creative.objective)}>
                        {creative.objective}
                      </span>
                    ) : (
                      <span className={styles.empty}>—</span>
                    )}
                  </td>
                ) : (
                  <>
                    <td>
                      <span className={styles.pill} style={getBadgeStyle(creative.hookType)}>{creative.hookType}</span>
                    </td>
                    <td>
                      <span className={styles.pill} style={getBadgeStyle(creative.format)}>{creative.format}</span>
                    </td>
                    <td>
                      <span className={styles.pill} style={getBadgeStyle(creative.ctaType)}>{creative.ctaType}</span>
                    </td>
                  </>
                )}
                <td className={styles.tdSubs}>
                  {creative.subChannels.length > 0 ? (
                    <div className={styles.subTags}>
                      {creative.subChannels.map((s) => (
                        <span key={s} className={styles.subTag} style={getBadgeStyle(s)}>{s}</span>
                      ))}
                    </div>
                  ) : (
                    <span className={styles.empty}>—</span>
                  )}
                </td>
                <td className={styles.tdDrive}>
                  {creative.driveLink ? (
                    <a
                      href={creative.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.driveLink}
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FolderOpen size={14} /> Abrir
                    </a>
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


        {creatives.length === 0 && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>{meta.icon}</span>
            <p>Nenhum criativo vinculado a {channelType}</p>
            <p className={styles.emptyHint}>
              Selecione &quot;{channelType}&quot; nos canais de um criativo para aparecer aqui
            </p>
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
          onAddSubChannel={(ch: Channel, v: string) => onAddSubChannel(v)}
          onRemoveSubChannel={(ch: Channel, v: string) => onRemoveSubChannel(v)}
          onDelete={() => {
            onDeleteCreative(selectedCreative.id);
            setSelectedCreative(null);
          }}
        />
      )}
    </div>
  );
}
