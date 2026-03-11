"use client";

import styles from "./CreativeDetailPanel.module.css";
import { useState, useRef, useEffect } from "react";
import { X, Bot, Sparkles, Mic, Square, Loader2, Play, Check, Copy, History, Plus, Settings } from "lucide-react";
import type { Creative, Channel } from "../Kanban/KanbanBoard";
import { CHANNELS } from "../Kanban/KanbanBoard";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";
import { useAgent } from "@/context/AgentContext";

interface Props {
  creative: Creative;
  onClose: () => void;
  onUpdate: (updates: Partial<Creative>) => void;
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
}

/* ---- Audio Hook Extracted Globally ---- */
/* ---- Reusable Custom Select with Add/Remove ---- */
function CustomSelect({
  label,
  value,
  options,
  onChange,
  onAdd,
  onRemove,
  optionType,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  onAdd: (type: "hook" | "format" | "cta" | "objective", value: string) => void;
  onRemove: (type: "hook" | "format" | "cta" | "objective", value: string) => void;
  optionType: "hook" | "format" | "cta" | "objective";
}) {
  const [adding, setAdding] = useState(false);
  const [managing, setManaging] = useState(false);
  const [newValue, setNewValue] = useState("");

  const handleAdd = () => {
    if (newValue.trim()) {
      onAdd(optionType, newValue.trim());
      onChange(newValue.trim());
      setNewValue("");
      setAdding(false);
    }
  };

  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {adding ? (
        <div className={styles.addNewRow}>
          <input
            type="text"
            className={styles.input}
            placeholder={`Novo ${label.toLowerCase()}...`}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            autoFocus
          />
          <button className={styles.addNewBtn} onClick={handleAdd}><Check size={14} /></button>
          <button className={styles.addNewBtn} onClick={() => setAdding(false)}><X size={14} /></button>
        </div>
      ) : (
        <div className={styles.selectRow}>
          <select
            className={styles.select}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            {options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <button
            className={styles.addOptionBtn}
            onClick={() => setAdding(true)}
            title={`Adicionar novo ${label.toLowerCase()}`}
          >
            <Plus size={16} />
          </button>
          <button
            className={styles.manageBtn}
            onClick={() => setManaging(!managing)}
            title="Gerenciar opções"
          >
            <Settings size={14} />
          </button>
        </div>
      )}
      {managing && (
        <div className={styles.manageList}>
          {options.map((o) => (
            <div key={o} className={styles.manageItem}>
              <span>{o}</span>
              <button
                className={styles.removeItemBtn}
                onClick={() => onRemove(optionType, o)}
                title="Remover"
              ><X size={10} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- Sub-Channel Multi-Select ---- */
function SubChannelSelect({
  label,
  allSubs,
  selected,
  onToggle,
  onAddSub,
  onRemoveSub,
}: {
  label: string;
  allSubs: string[];
  selected: string[];
  onToggle: (sub: string) => void;
  onAddSub: (value: string) => void;
  onRemoveSub: (value: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newSub, setNewSub] = useState("");
  const [managing, setManaging] = useState(false);

  const handleAdd = () => {
    if (newSub.trim()) {
      onAddSub(newSub.trim());
      setNewSub("");
      setAdding(false);
    }
  };

  return (
    <div className={styles.subChannelSection}>
      <div className={styles.subChannelHeader}>
        <span className={styles.subChannelLabel}>{label}</span>
        <button className={styles.subAddBtn} onClick={() => setAdding(!adding)}><Plus size={12} /></button>
        <button className={styles.subManageBtn} onClick={() => setManaging(!managing)}><Settings size={12} /></button>
      </div>
      <div className={styles.subChannelGrid}>
        {allSubs.map((sub) => (
          <button
            key={sub}
            type="button"
            className={`${styles.subChannelBtn} ${
              selected.includes(sub) ? styles.subChannelActive : ""
            }`}
            onClick={() => onToggle(sub)}
          >
            {sub}
          </button>
        ))}
      </div>
      {adding && (
        <div className={styles.addNewRow} style={{ marginTop: 6 }}>
          <input
            type="text"
            className={styles.input}
            placeholder="Novo sub-canal..."
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            autoFocus
          />
          <button className={styles.addNewBtn} onClick={handleAdd}><Check size={14} /></button>
          <button className={styles.addNewBtn} onClick={() => setAdding(false)}><X size={14} /></button>
        </div>
      )}
      {managing && (
        <div className={styles.manageList}>
          {allSubs.map((o) => (
            <div key={o} className={styles.manageItem}>
              <span>{o}</span>
              <button className={styles.removeItemBtn} onClick={() => onRemoveSub(o)}><X size={10}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- Simple Objective Select ---- */
function ObjectiveSelect({
  value,
  onChange,
  objectives,
  onAddCustomOption,
  onRemoveCustomOption,
}: {
  value: string;
  onChange: (v: string) => void;
  objectives: string[];
  onAddCustomOption: (type: "hook" | "format" | "cta" | "objective", value: string) => void;
  onRemoveCustomOption: (type: "hook" | "format" | "cta" | "objective", value: string) => void;
}) {
  return (
      <CustomSelect
          label="Objetivo"
          value={value}
          options={objectives}
          onChange={onChange}
          onAdd={onAddCustomOption}
          onRemove={onRemoveCustomOption}
          optionType="objective"
      />
  );
}

/* ---- Main Panel ---- */
export default function CreativeDetailPanel({
  creative,
  onClose,
  onUpdate,
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
}: Props) {
  const { openChat } = useAgent();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState("");
  // Estado para saber qual campo está recebendo o áudio agora
  const [activeVoiceField, setActiveVoiceField] = useState<"notes" | "recordingDirection" | "editingDirection" | null>(null);

  const handleTranscription = (text: string) => {
    if (!activeVoiceField) return;
    const currentVal = creative[activeVoiceField] || "";
    // Adicionar espaço antes se já houver texto
    const newVal = currentVal ? `${currentVal} ${text}` : text;
    onUpdate({ [activeVoiceField]: newVal });
    setActiveVoiceField(null);
  };

  const { isRecording, isTranscribing, toggleRecording } = useAudioRecorder(handleTranscription);

  const handleMicClick = (field: "notes" | "recordingDirection" | "editingDirection") => {
    if (isRecording && activeVoiceField !== field) {
      // Se tiver gravando em outro campo, ignore até terminar
      return;
    }
    setActiveVoiceField(field);
    toggleRecording();
  };

  const handleGenerateScript = async () => {
    setIsGenerating(true);
    setGeneratedScript("");
    try {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creative)
      });
      const data = await response.json();
      if (data.script) {
        setGeneratedScript(data.script);
        // Salvar local no histórico de banco
        const newHistory = [
          { script: data.script, createdAt: Date.now() },
          ...(creative.generatedScripts || [])
        ];
        onUpdate({ generatedScripts: newHistory });
      } else {
        alert("Erro: " + (data.error || "Erro desconhecido"));
      }
    } catch (err) {
      alert("Falha de conexão com a IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyScript = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    alert("Roteiro copiado para a área de transferência!");
  };

  const toggleChannel = (channel: Channel) => {
    const current = creative.channels;
    const updated = current.includes(channel)
      ? current.filter((c) => c !== channel)
      : [...current, channel];
    // If removing channel, remove its sub-channels too
    if (!updated.includes(channel)) {
      const subsToRemove = channel === "Tráfego Pago" ? trafegoSubs : organicoSubs;
      const updatedSubs = creative.subChannels.filter((s) => !subsToRemove.includes(s));
      onUpdate({ channels: updated, subChannels: updatedSubs });
    } else {
      onUpdate({ channels: updated });
    }
  };

  const toggleSubChannel = (sub: string) => {
    const current = creative.subChannels;
    const updated = current.includes(sub)
      ? current.filter((s) => s !== sub)
      : [...current, sub];
    onUpdate({ subChannels: updated });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Detalhe do Criativo</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.panelBody}>
          {/* Name */}
          <div className={styles.field}>
            <label className={styles.label}>Nome</label>
            <input
              type="text"
              className={styles.input}
              value={creative.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
            />
          </div>

          {/* Row: Hook + Format */}
          <div className={styles.fieldRow}>
            <CustomSelect
              label="Tipo de Hook"
              value={creative.hookType}
              options={hookTypes}
              onChange={(v) => onUpdate({ hookType: v })}
              onAdd={onAddCustomOption}
              onRemove={onRemoveCustomOption}
              optionType="hook"
            />
            <CustomSelect
              label="Formato"
              value={creative.format}
              options={formats}
              onChange={(v) => onUpdate({ format: v })}
              onAdd={onAddCustomOption}
              onRemove={onRemoveCustomOption}
              optionType="format"
            />
          </div>

          {/* Row: Angle + CTA */}
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>Ângulo de Marketing</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Descreva o ângulo de marketing"
                value={creative.marketingAngle}
                onChange={(e) => onUpdate({ marketingAngle: e.target.value })}
              />
            </div>
            <CustomSelect
              label="Tipo de CTA"
              value={creative.ctaType}
              options={ctaTypes}
              onChange={(v) => onUpdate({ ctaType: v })}
              onAdd={onAddCustomOption}
              onRemove={onRemoveCustomOption}
              optionType="cta"
            />
          </div>

          {/* Objective Row */}
          <div className={styles.fieldRow}>
             <ObjectiveSelect 
               value={creative.objective || ""} 
               onChange={(v) => onUpdate({ objective: v })} 
               objectives={objectives}
               onAddCustomOption={onAddCustomOption}
               onRemoveCustomOption={onRemoveCustomOption}
             />
             <div className={styles.field}>
                {/* Empty space for balance or add something else later */}
             </div>
          </div>

          <div className={styles.divider} />

          {/* Reference */}
          <div className={styles.field}>
            <label className={styles.label}>Referência</label>
            <input
              type="url"
              className={styles.input}
              placeholder="Cole o link de referência"
              value={creative.reference}
              onChange={(e) => onUpdate({ reference: e.target.value })}
            />
          </div>

          {/* Notes */}
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label}>Anotações Gerais</label>
              <button 
                type="button" 
                className={`${styles.micBtn} ${isRecording && activeVoiceField === 'notes' ? styles.micRecording : ''}`}
                onClick={() => handleMicClick('notes')}
                title="Gravar por voz"
                disabled={isTranscribing && activeVoiceField === 'notes'}
              >
                {isRecording && activeVoiceField === 'notes' ? <Square size={14} /> : isTranscribing && activeVoiceField === 'notes' ? <Loader2 size={14} className={styles.spinIcon} /> : <Mic size={14} />}
              </button>
            </div>
            <textarea
              className={styles.textarea}
              placeholder="Anotações sobre o criativo…"
              rows={3}
              value={creative.notes}
              onChange={(e) => onUpdate({ notes: e.target.value })}
            />
          </div>

          <div className={styles.divider} />

          {/* Context Base (Long text) */}
          <div className={styles.field}>
            <label className={styles.label}>
              Material Base / Contexto Fonte (Cole informações do PDF, site, excel aqui)
            </label>
            <textarea
              className={styles.textarea}
              placeholder="Cole textos brutos, detalhes técnicos, bulas, ou roteiros antigos para a IA usar como base..."
              rows={5}
              value={creative.materialBase || ""}
              onChange={(e) => onUpdate({ materialBase: e.target.value })}
            />
          </div>
          
          <div className={styles.divider} />

          {/* AI Script Generator */}
          <div className={styles.field}>
            <div className={styles.aiHeaderRow}>
              <label className={styles.label}>
                Roteiro Inteligente <Sparkles size={14} className={styles.labelAiBase} />
              </label>
               <button 
                 className={styles.generateBtn} 
                 onClick={handleGenerateScript}
                 disabled={isGenerating}
               >
                 {isGenerating ? <><Loader2 size={16} className={styles.spinIcon}/> Pensando...</> : <><Sparkles size={16}/> Gerar Novo Roteiro</>}
               </button>
               
               <button 
                 className={styles.consultBtn}
                 onClick={() => openChat({ 
                   id: "cpy-1", 
                   name: "Roteirista Consolatio", 
                   role: "Copywriter Sênior" 
                 }, creative.id)}
                 title="Abrir chat com o roteirista especialista"
               >
                 <Bot size={16} /> Consultar Especialista
               </button>
            </div>
            
            {/* Show just generated script if applies */}
            {generatedScript && (
              <div className={styles.scriptContainer}>
                <div className={styles.scriptActions}>
                  <button onClick={() => copyScript(generatedScript)} className={styles.copyBtn}><Copy size={12}/> Copiar Novo Roteiro</button>
                </div>
                <pre className={styles.scriptOutput}>{generatedScript}</pre>
                <div className={styles.divider} style={{ margin: '16px 0' }} />
              </div>
            )}

            {/* History of AI Scripts */}
            {creative.generatedScripts && creative.generatedScripts.length > 0 && (
               <div className={styles.historySection}>
                 <span className={styles.historyTitle}><History size={14} style={{marginRight: 4, display: 'inline-block', verticalAlign: 'middle'}}/> Histórico do Agente ({creative.generatedScripts.length})</span>
                 <div className={styles.historyList}>
                    {creative.generatedScripts.map((item, idx) => (
                      <details key={idx} className={styles.historyDetails}>
                        <summary className={styles.historySummary}>
                          Roteiro #{creative.generatedScripts!.length - idx} • {new Date(item.createdAt).toLocaleString()}
                        </summary>
                        <div className={styles.historyBody}>
                           <div className={styles.scriptActions}>
                             <button onClick={() => copyScript(item.script)} className={styles.copyBtn}><Copy size={12}/> Copiar</button>
                           </div>
                           <pre className={styles.scriptOutput}>{item.script}</pre>
                        </div>
                      </details>
                    ))}
                 </div>
               </div>
            )}
          </div>

          <div className={styles.divider} />

          {/* Recording Direction */}
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label}>
                Direcional de Gravação
              </label>
              <button 
                type="button" 
                className={`${styles.micBtn} ${isRecording && activeVoiceField === 'recordingDirection' ? styles.micRecording : ''}`}
                onClick={() => handleMicClick('recordingDirection')}
                title="Gravar por voz"
                disabled={isTranscribing && activeVoiceField === 'recordingDirection'}
              >
                {isRecording && activeVoiceField === 'recordingDirection' ? <Square size={14} /> : isTranscribing && activeVoiceField === 'recordingDirection' ? <Loader2 size={14} className={styles.spinIcon} /> : <Mic size={14} />}
              </button>
            </div>
            <textarea
              className={styles.textarea}
              placeholder="Direcionamentos para gravação…"
              rows={3}
              value={creative.recordingDirection}
              onChange={(e) => onUpdate({ recordingDirection: e.target.value })}
            />
          </div>

          {/* Editing Direction */}
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label}>
                Direcional de Edição
              </label>
              <button 
                type="button" 
                className={`${styles.micBtn} ${isRecording && activeVoiceField === 'editingDirection' ? styles.micRecording : ''}`}
                onClick={() => handleMicClick('editingDirection')}
                title="Gravar por voz"
                disabled={isTranscribing && activeVoiceField === 'editingDirection'}
              >
                 {isRecording && activeVoiceField === 'editingDirection' ? <Square size={14} /> : isTranscribing && activeVoiceField === 'editingDirection' ? <Loader2 size={14} className={styles.spinIcon} /> : <Mic size={14} />}
              </button>
            </div>
            <textarea
              className={styles.textarea}
              placeholder="Direcionamentos para edição…"
              rows={3}
              value={creative.editingDirection}
              onChange={(e) => onUpdate({ editingDirection: e.target.value })}
            />
          </div>

          <div className={styles.divider} />

          {/* Channels (top level) */}
          <div className={styles.field}>
            <label className={styles.label}>Canais</label>
            <div className={styles.channelGrid}>
              {CHANNELS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  className={`${styles.channelBtn} ${
                    creative.channels.includes(ch) ? styles.channelActive : ""
                  }`}
                  onClick={() => toggleChannel(ch)}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-Channels per selected channel */}
          {creative.channels.includes("Tráfego Pago") && (
            <SubChannelSelect
              label="Sub-canais — Tráfego Pago"
              allSubs={trafegoSubs}
              selected={creative.subChannels}
              onToggle={toggleSubChannel}
              onAddSub={(v) => onAddSubChannel("Tráfego Pago", v)}
              onRemoveSub={(v) => onRemoveSubChannel("Tráfego Pago", v)}
            />
          )}

          {creative.channels.includes("Orgânicos") && (
            <SubChannelSelect
              label="Sub-canais — Orgânicos"
              allSubs={organicoSubs}
              selected={creative.subChannels}
              onToggle={toggleSubChannel}
              onAddSub={(v) => onAddSubChannel("Orgânicos", v)}
              onRemoveSub={(v) => onRemoveSubChannel("Orgânicos", v)}
            />
          )}

          {/* Drive Link */}
          <div className={styles.field}>
            <label className={styles.label}>Link da Pasta (Drive)</label>
            <input
              type="url"
              className={styles.input}
              placeholder="https://drive.google.com/..."
              value={creative.driveLink}
              onChange={(e) => onUpdate({ driveLink: e.target.value })}
            />
          </div>

          {/* Status toggle */}
          <div className={styles.field}>
            <label className={styles.label}>Status do Criativo</label>
              <button
              type="button"
              className={`${styles.statusToggle} ${
                creative.status === "done" ? styles.statusDone : ""
              }`}
              onClick={() =>
                onUpdate({ status: creative.status === "done" ? "pending" : "done" })
              }
            >
              {creative.status === "done" ? <><Check size={14} style={{marginRight: 4}}/> Concluído</> : <><Play size={14} style={{marginRight: 4}}/> Pendente</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
