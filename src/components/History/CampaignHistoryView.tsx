"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Search, Archive, Calendar, Layers, ArrowRight, ArrowLeft } from "lucide-react";
import styles from "./CampaignHistoryView.module.css";
import type { CampaignCard, Creative, Channel } from "../Kanban/KanbanBoard";
import CampaignDetailView from "../CampaignDetail/CampaignDetailView";

type SortOption = "recent" | "oldest" | "az" | "za";

export default function CampaignHistoryView() {
  const [campaigns, setCampaigns] = useState<CampaignCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignCard | null>(null);

  // Estados necessários para o CampaignDetailView (caso queira editar do histórico)
  const [customHookTypes, setCustomHookTypes] = useState<string[]>([]);
  const [customFormats, setCustomFormats] = useState<string[]>([]);
  const [customCtaTypes, setCustomCtaTypes] = useState<string[]>([]);
  const [customObjectives, setCustomObjectives] = useState<string[]>([]);
  const [trafegoSubs, setTrafegoSubs] = useState<string[]>([]);
  const [organicoSubs, setOrganicoSubs] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: camps } = await supabase.from('campaigns').select('*').order('date', { ascending: false });
      const { data: creats } = await supabase.from('creatives').select('*');

      if (camps) {
        const creativesMap: Record<string, Creative[]> = {};
        creats?.forEach(cr => {
          if (!creativesMap[cr.campaign_id]) creativesMap[cr.campaign_id] = [];
          creativesMap[cr.campaign_id].push({
            id: cr.id,
            name: cr.name,
            hookType: cr.hook_type || '',
            marketingAngle: cr.marketing_angle || '',
            format: cr.format || '',
            ctaType: cr.cta_type || '',
            reference: cr.reference || '',
            notes: cr.notes || '',
            recordingDirection: cr.recording_direction || '',
            editingDirection: cr.editing_direction || '',
            channels: cr.channels || [],
            subChannels: cr.sub_channels || [],
            driveLink: cr.drive_link || '',
            uploadedToChannels: cr.uploaded_to_channels || false,
            status: cr.status || 'pending',
            createdAt: new Date(cr.created_at).getTime(),
            materialBase: cr.material_base || '',
            generatedScripts: cr.generated_scripts || [],
            objective: cr.objective || '',
            contentType: cr.content_type || undefined,
            designDirection: cr.design_direction || ''
          });
        });

        const groupedCamps: (CampaignCard & { createdAt: number })[] = camps.map(c => ({
          id: c.id,
          title: c.title,
          date: c.date,
          pinned: c.pinned || false,
          labels: c.labels || [],
          checklist: { roteirizacao: c.checklist_roteirizacao || false, edicao: c.checklist_edicao || false },
          creatives: creativesMap[c.id] || [],
          createdAt: new Date(c.created_at || 0).getTime()
        }));

        setCampaigns(groupedCamps);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // Carregar opções customizadas (simplificado para o histórico)
    const loadOptions = () => {
      const getJSON = (key: string) => {
        try {
          return JSON.parse(localStorage.getItem(key) || "[]");
        } catch { return []; }
      };
      setCustomHookTypes(getJSON("kb_hooks"));
      setCustomFormats(getJSON("kb_formats"));
      setCustomCtaTypes(getJSON("kb_ctas"));
      setCustomObjectives(getJSON("kb_objectives"));
      setTrafegoSubs(getJSON("kb_trafego_subs"));
      setOrganicoSubs(getJSON("kb_organico_subs"));
    };
    loadOptions();
  }, [fetchData]);

  const filteredCampaigns = campaigns
    .filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "recent") return (b as any).createdAt - (a as any).createdAt;
      if (sortBy === "oldest") return (a as any).createdAt - (b as any).createdAt;
      if (sortBy === "az") return a.title.localeCompare(b.title);
      if (sortBy === "za") return b.title.localeCompare(a.title);
      return 0;
    });

  // Handlers para o CampaignDetailView
  const handleUpdateCreative = async (creativeId: string, updates: Partial<Creative>) => {
    await supabase.from('creatives').update(updates).eq('id', creativeId);
    fetchData();
  };

  const handleAddCreative = async (creative: Creative) => {
    if (!selectedCampaign) return;
    await supabase.from('creatives').insert({ ...creative, campaign_id: selectedCampaign.id });
    fetchData();
  };

  const handleDeleteCreative = async (creativeId: string) => {
    if (!window.confirm("Excluir criativo permanentemente?")) return;
    await supabase.from('creatives').delete().eq('id', creativeId);
    fetchData();
  };

  const handleRenameCampaign = async (id: string, newTitle: string) => {
    await supabase.from('campaigns').update({ title: newTitle }).eq('id', id);
    fetchData();
  };

  const handleMoveCreative = async (creativeId: string, targetCampaignId: string) => {
    await supabase.from('creatives').update({ campaign_id: targetCampaignId }).eq('id', creativeId);
    if (selectedCampaign) {
      // Se moveu para fora da campanha atual, recarregar
      fetchData();
    }
  };

  const handleCopyCreative = async (creativeId: string, targetCampaignId: string) => {
    // Achar o original para duplicar
    const original = campaigns.flatMap(c => c.creatives).find(cr => cr.id === creativeId);
    if (!original) return;

    await supabase.from('creatives').insert({
      id: crypto.randomUUID(),
      campaign_id: targetCampaignId,
      name: `${original.name} (cópia)`,
      hook_type: original.hookType,
      marketing_angle: original.marketingAngle,
      format: original.format,
      cta_type: original.ctaType,
      reference: original.reference,
      notes: original.notes,
      recording_direction: original.recordingDirection,
      editing_direction: original.editingDirection,
      channels: original.channels,
      sub_channels: original.subChannels,
      drive_link: original.driveLink,
      uploaded_to_channels: original.uploadedToChannels,
      status: original.status,
      created_at: new Date().toISOString(),
      material_base: original.materialBase,
      objective: original.objective,
      content_type: original.contentType,
      design_direction: original.designDirection
    });
    fetchData();
  };

  if (selectedCampaign) {
    return (
      <div className={styles.container}>
        <CampaignDetailView 
          card={selectedCampaign}
          columnId="history"
          onBack={() => setSelectedCampaign(null)}
          onUpdateCreative={handleUpdateCreative}
          onAddCreative={handleAddCreative}
          onDeleteCreative={handleDeleteCreative}
          onRenameCampaign={handleRenameCampaign}
          onMoveCreative={handleMoveCreative}
          onCopyCreative={handleCopyCreative}
          allCampaigns={campaigns.map(c => ({ id: c.id, title: c.title, date: c.date }))}
          hookTypes={customHookTypes}
          formats={customFormats}
          ctaTypes={customCtaTypes}
          objectives={customObjectives}
          trafegoSubs={trafegoSubs}
          organicoSubs={organicoSubs}
          onAddCustomOption={() => {}} // Desativado no histórico para simplicidade
          onRemoveCustomOption={() => {}}
          onAddSubChannel={() => {}}
          onRemoveSubChannel={() => {}}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Histórico de Campanhas</h1>
          <p className={styles.subtitle}>Consulte todas as rodadas e seus respectivos criativos.</p>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Buscar campanha pelo nome..." 
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className={styles.sortSelect}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
        >
          <option value="recent">Mais recentes primeiro</option>
          <option value="oldest">Mais antigas primeiro</option>
          <option value="az">A-Z</option>
          <option value="za">Z-A</option>
        </select>
      </div>

      {loading ? (
        <div className={styles.emptyState}>Carregando histórico...</div>
      ) : filteredCampaigns.length === 0 ? (
        <div className={styles.emptyState}>
          <Archive size={48} strokeWidth={1} />
          <p>Nenhuma campanha encontrada.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {filteredCampaigns.map((camp) => (
            <div 
              key={camp.id} 
              className={styles.campaignCard}
              onClick={() => setSelectedCampaign(camp)}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardDate}>{camp.date}</span>
                <Archive size={16} color="var(--text-muted)" />
              </div>
              <h3 className={styles.cardTitle}>{camp.title}</h3>
              
              <div className={styles.cardMeta}>
                <div className={styles.metaBadge}>
                  <Layers size={14} />
                  {camp.creatives.length} {camp.creatives.length === 1 ? 'Criativo' : 'Criativos'}
                </div>
                <div className={styles.metaBadge} style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399' }}>
                   {camp.creatives.filter(cr => cr.status === 'done').length} concluídos
                </div>
              </div>

              <div className={styles.footer}>
                <span className={styles.openLabel}>Ver detalhes</span>
                <ArrowRight size={16} color="var(--accent-primary)" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
