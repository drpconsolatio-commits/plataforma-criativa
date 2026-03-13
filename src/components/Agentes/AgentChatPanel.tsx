"use client";

import styles from "./AgentChatPanel.module.css";
import { X, Send, Bot, Mic, Square, Loader2, Plus, Search, ChevronRight, Copy, RefreshCw, XCircle, Pencil, Check, Sparkles, History, PlusCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";
import { useAgentChats } from "../../hooks/useAgentChats";
import { useAgent } from "@/context/AgentContext";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AgentChatPanelProps {
  agentId: string;
  agentName: string;
  agentRole: string;
  onClose: () => void;
}

export default function AgentChatPanel({ agentId, agentName, agentRole, onClose }: AgentChatPanelProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "history">("chat");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { targetCreativeId, setTargetCreative } = useAgent();
  const [availableCreatives, setAvailableCreatives] = useState<{id: string, name: string}[]>([]);
  const [showExportToast, setShowExportToast] = useState(false);

  // Carregar criativos para o seletor de exportação
  useEffect(() => {
    async function loadCreatives() {
      const { data } = await supabase.from('creatives').select('id, name').order('created_at', { ascending: false });
      if (data) setAvailableCreatives(data);
    }
    loadCreatives();
  }, []);

  // Integração com Supabase Histórico
  const { 
    sessions, 
    activeSessionId, 
    messages: dbMessages, 
    createNewSession, 
    saveMessage, 
    loadMessages,
    setActiveSessionId
  } = useAgentChats(agentId);

  // Mensagens locais para UI fluida
  const [localMessages, setLocalMessages] = useState<any[]>([
    {
       id: "greet-1",
       role: "assistant",
       content: `Olá! Sou o ${agentName}, seu especialista em ${agentRole}. Como posso te ajudar hoje?`
    }
  ]);
  
  // Sincroniza as mensagens do banco quando uma sessão é carregada
  useEffect(() => {
     if (activeSessionId && dbMessages.length > 0) {
        setLocalMessages(dbMessages.map(m => ({ id: m.id, role: m.role, content: m.content })));
     } else if (!activeSessionId) {
        setLocalMessages([
          {
             id: "greet-1",
             role: "assistant",
             content: `Olá! Sou o ${agentName}. Como posso ajudar?`
          }
        ]);
     }
  }, [activeSessionId, dbMessages, agentName]);

  const handleSend = async (e?: React.FormEvent, manualHistory?: any[]) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !manualHistory) return;
    if (isLoading && !manualHistory) return;

    let currentSessionId = activeSessionId;
    let userMessageStr = inputText;

    // Criar sessão se não existir
    if (!currentSessionId) {
       currentSessionId = await createNewSession(agentName, manualHistory ? "Regeneração" : userMessageStr);
    }
    
    let newMessages = manualHistory || [
      ...localMessages,
      { id: "user-" + Date.now().toString(), role: 'user', content: userMessageStr }
    ];

    if (!manualHistory) {
      setLocalMessages(newMessages);
      setInputText("");
    }
    
    // Salva msg User no banco
    if (currentSessionId && !manualHistory) saveMessage(currentSessionId, 'user', userMessageStr);

    const controller = new AbortController();
    setAbortController(controller);
    setIsLoading(true);
    setIsThinking(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
           agentId,
           messages: newMessages.map((m: any) => ({ role: m.role, content: m.content })),
           system_prompt: agentId === 'pln-2' 
             ? `Você é o Planejador Estratégico, um Analista de Tráfego e Estrategista de Marca. Diretriz: Leia o brain.md para entender a marca Consolatio. Quando o usuário informar um produto e um objetivo (ex: Lançamento, Evergreen, Retargeting), cruze isso com os arquétipos do brain.md. Sua função é definir QUAIS ângulos usar e qual a melhor linha editorial para o funil solicitado, antes de escrever qualquer roteiro.`
             : agentId === 'cpy-1'
               ? `Você é o Roteirista Consolatio, um Copywriter Sênior de Retenção e Resposta Direta. Diretriz: Leia o brain.md e a estratégia definida. Crie roteiros usando o método DSB e a estrutura de [3 Hooks, 1 Meio, 2 CTAs]. Baseie-se nas características do produto específico da campanha atual e insira sugestões de ganchos visuais (como o Teste do Amasso). Escreva sempre de forma humana e nativa de redes sociais. NUNCA seja professoral.`
               : `Você é o ${agentName}, um especialista atuando como ${agentRole}. Aja profissionalmente, seja sucinto e muito perspicaz.`
        }),
      });

      if (!res.ok) throw new Error('Falha na resposta do servidor');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponseText = "";

      setIsThinking(false);
      const aiMsgId = "ai-" + Date.now().toString();
      setLocalMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          aiResponseText += chunk;
          
          setLocalMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.findIndex(m => m.id === aiMsgId);
            if (lastIdx !== -1) {
              updated[lastIdx].content = aiResponseText;
            }
            return updated;
          });
        }
      }

      if (currentSessionId) {
         saveMessage(currentSessionId, 'assistant', aiResponseText);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("-> Geração cancelada pelo usuário");
      } else {
        console.error("Erro no chat:", error);
        alert("Erro: " + error.message);
      }
    } finally {
      setIsLoading(false);
      setIsThinking(false);
      setAbortController(null);
    }
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  const handleRegenerate = () => {
    if (localMessages.length < 2) return;
    
    // Encontrar última mensagem do usuário
    const messagesCopy = [...localMessages];
    let lastUserMessageIndex = -1;
    for (let i = messagesCopy.length - 1; i >= 0; i--) {
      if (messagesCopy[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }

    if (lastUserMessageIndex !== -1) {
      const truncatedHistory = messagesCopy.slice(0, lastUserMessageIndex + 1);
      setLocalMessages(truncatedHistory);
      handleSend(undefined, truncatedHistory);
    }
  };

  const handleEditMessage = (index: number) => {
    const msg = localMessages[index];
    if (msg.role !== 'user') return;
    
    setInputText(msg.content);
    setLocalMessages(prev => prev.slice(0, index));
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleCopy = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(msgId);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const handleExportToCreative = async (content: string) => {
    if (!targetCreativeId) return;
    const { data: creative } = await supabase.from('creatives').select('generated_scripts').eq('id', targetCreativeId).single();
    const existingScripts = creative?.generated_scripts || [];
    const newScripts = [...existingScripts, { script: content, createdAt: Date.now() }];
    const { error } = await supabase.from('creatives').update({ generated_scripts: newScripts }).eq('id', targetCreativeId);
    if (!error) {
      setShowExportToast(true);
      setTimeout(() => setShowExportToast(false), 3000);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  // Scroll to bottom
  useEffect(() => {
     messagesEndRef.current?.scrollIntoView({ behavior: isLoading ? "auto" : "smooth" });
  }, [localMessages, isLoading]);

  // Audio Recorder
  const { isRecording, isTranscribing, toggleRecording } = useAudioRecorder((text: string) => {
     setInputText(prev => prev ? `${prev} ${text}` : text);
  });

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div className={styles.agentInfo}>
            <div className={styles.avatar}><Bot size={20} className={styles.botIcon} /></div>
            <div>
              <h2 className={styles.title}>{agentName}</h2>
              <span className={styles.role}><Sparkles size={12}/> {agentRole}</span>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.tabActive : ''}`} onClick={() => setActiveTab("chat")} title="Chat Atual"><Bot size={18} /></button>
            <button className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabActive : ''}`} onClick={() => setActiveTab("history")} title="Histórico"><History size={18} /></button>
            <div className={styles.vertDivider}/>
            <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
          </div>
        </header>

        {activeTab === "chat" && (
          <div className={styles.exportTargetArea}>
            <Sparkles size={14} className={styles.exportIcon} />
            <span className={styles.exportLabel}>Exportar para:</span>
            <select className={styles.exportSelect} value={targetCreativeId || ""} onChange={(e) => setTargetCreative(e.target.value)}>
              <option value="">Escolha um criativo...</option>
              {availableCreatives.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {activeTab === "chat" ? (
          <>
            <div className={styles.chatArea}>
              {localMessages.map((msg: any, idx: number) => (
                <div key={msg.id || idx} className={`${styles.messageWrapper} ${msg.role === "user" ? styles.wrapperUser : styles.wrapperAi}`}>
                  {msg.role !== "user" && <div className={styles.msgAvatar}><Bot size={14}/></div>}
                  <div className={`${styles.messageBubble} ${msg.role === "user" ? styles.bubbleUser : styles.bubbleAi}`}>
                    <div className={styles.markdownContent}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>

                    <div className={styles.messageActions}>
                      {msg.role === "assistant" && (
                        <>
                          <button className={styles.actionBtn} onClick={() => handleCopy(msg.content, msg.id)}>
                            {copySuccess === msg.id ? <Check size={12}/> : <Copy size={12}/>}
                            <span>{copySuccess === msg.id ? "Copiado!" : "Copiar"}</span>
                          </button>
                          {idx === localMessages.length - 1 && !isLoading && (
                            <button className={styles.actionBtn} onClick={handleRegenerate}>
                              <RefreshCw size={12}/>
                              <span>Regenerar</span>
                            </button>
                          )}
                          {targetCreativeId && (
                            <button className={styles.actionBtn} onClick={() => handleExportToCreative(msg.content)}>
                              <PlusCircle size={12} />
                              <span>Exportar</span>
                            </button>
                          )}
                        </>
                      )}
                      {msg.role === "user" && idx === localMessages.length - (localMessages[localMessages.length-1].role === 'assistant' ? 2 : 1) && !isLoading && (
                        <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => handleEditMessage(idx)}>
                          <Pencil size={12}/>
                          <span>Editar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isThinking && (
                <div className={styles.thinkingIndicator}>
                  <span></span><span></span><span></span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {isLoading && abortController && (
              <button className={styles.stopBtn} onClick={handleStopGeneration}>
                <XCircle size={16}/> Parar Geração
              </button>
            )}

            <form className={styles.inputArea} onSubmit={(e) => handleSend(e)}>
              <button type="button" className={`${styles.micBtn} ${isRecording ? styles.micRecording : ''}`} onClick={toggleRecording}>
                {isRecording ? <Square size={16} /> : isTranscribing ? <Loader2 size={16} className={styles.spinIcon} /> : <Mic size={16} />}
              </button>
              
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                placeholder="Como posso ajudar com seus roteiros hoje?"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e as any);
                  }
                }}
                rows={1}
              />
              <button className={styles.sendBtn} type="submit" disabled={!inputText.trim() || isLoading}>
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className={styles.historyArea}>
             <div className={styles.searchRow}>
               <Search size={16} className={styles.searchIcon}/><input className={styles.searchInput} placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
             </div>
             <div className={styles.historyList}>
                {sessions.filter((s:any) => s.title.toLowerCase().includes(searchTerm.toLowerCase())).map((session:any) => (
                  <div key={session.id} className={styles.historyItem} onClick={() => { loadMessages(session.id); setActiveTab('chat'); }}>
                     <div className={styles.historyItemInfo}>
                       <h4>{session.title}</h4>
                       <span>{new Date(session.created_at).toLocaleDateString()}</span>
                     </div>
                     <button className={styles.continueBtn}><Bot size={14}/></button>
                  </div>
                ))}
             </div>
             <button className={styles.newChatBtn} style={{margin: '16px'}} onClick={() => { setActiveSessionId(null); setActiveTab("chat"); }}><PlusCircle size={16}/> Novo Chat</button>
          </div>
        )}
      </div>

      {showExportToast && <div className={styles.toast}><Check size={16} /> Roteiro exportado!</div>}
    </div>
  );
}
