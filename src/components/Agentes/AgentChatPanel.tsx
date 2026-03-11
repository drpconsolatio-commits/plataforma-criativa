"use client";

import styles from "./AgentChatPanel.module.css";
import { X, Send, Bot, Sparkles, Mic, Square, Loader2, History, Search, PlusCircle, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
// No useChat wrapper used, utilizing bare fetch instead for absolute control
import { useAudioRecorder } from "../../hooks/useAudioRecorder";
import { useAgentChats } from "../../hooks/useAgentChats";

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

  // Convert DB messages to local format
  const [localMessages, setLocalMessages] = useState<any[]>([
    {
       id: "greet-1",
       role: "assistant",
       content: `Olá! Sou o ${agentName}, seu especialista em ${agentRole}. Como posso te ajudar hoje?`
    }
  ]);
  
  // Sincroniza as mensagens do banco de dados quando uma sessão é carregada
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    
    // Auto-create chat session if first message
    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
       currentSessionId = await createNewSession(agentName, inputText);
    }
    
    const userMessageStr = inputText;
    setInputText("");
    
    // Salva msg User async no banco
    if (currentSessionId) saveMessage(currentSessionId, 'user', userMessageStr);

    const newMessages = [
      ...localMessages, 
      { id: "user-" + Date.now().toString(), role: 'user', content: userMessageStr }
    ];
    setLocalMessages(newMessages);
    setIsLoading(true);

    try {
      console.log("-> Realizando Chamada de Fetch Manual via POST /api/chat");
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           messages: newMessages.map((m: any) => ({ role: m.role, content: m.content })),
           system_prompt: `Você é o ${agentName}, um especialista atuando como ${agentRole}. Aja profissionalmente, seja sucinto e muito perspicaz.`
        })
      });

      if (!res.ok) {
         try {
           const errData = await res.json();
           throw new Error(errData.error || `HTTP ${res.status}`);
         } catch {
           throw new Error(`Erro de Comunicação - HTTP ${res.status}`);
         }
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      let aiMessage = "";
      const aiMessageId = "ai-" + Date.now().toString();
      
      
      // Add empty AI message row to be filled by stream
      setLocalMessages(prev => [...prev, { id: aiMessageId, role: "assistant", content: "" }]);

      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunkStr = decoder.decode(value, { stream: true });
        aiMessage += chunkStr;
        
        setLocalMessages(prev => {
          const newM = [...prev];
          const lastMsgIndex = newM.findIndex((m: any) => m.id === aiMessageId);
          if (lastMsgIndex > -1) {
             newM[lastMsgIndex].content = aiMessage;
          }
          return newM;
        });
      }

      // Após concluir stream, salvar resposta total da IA
      if (currentSessionId) {
         saveMessage(currentSessionId, 'assistant', aiMessage);
      }
    } catch(err: any) {
      console.error("Failed to fetch from /api/chat:", err);
      alert("Houve uma falha ao contatar a IA: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  // Audio Hook integration
  const { isRecording, isTranscribing, toggleRecording } = useAudioRecorder((text: string) => {
     setInputText(prev => prev ? `${prev} ${text}` : text);
  });

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={styles.panel} 
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.agentInfo}>
            <div className={styles.avatar}>
               <Bot size={20} className={styles.botIcon} />
            </div>
            <div>
              <h2 className={styles.title}>{agentName}</h2>
              <span className={styles.role}><Sparkles size={12}/> {agentRole}</span>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.tabActive : ''}`} 
              onClick={() => setActiveTab("chat")}
              title="Chat Atual"
            >
              <Bot size={18} />
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabActive : ''}`} 
              onClick={() => setActiveTab("history")}
              title="Histórico de Conversas"
            >
              <History size={18} />
            </button>
            <div className={styles.vertDivider}/>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar chat">
              <X size={20} />
            </button>
          </div>
        </header>

        {activeTab === "chat" ? (
          <>
            <div className={styles.chatArea}>
              {localMessages.map((msg: any) => (
                <div key={msg.id} className={`${styles.messageWrapper} ${msg.role === "user" ? styles.wrapperUser : styles.wrapperAi}`}>
                   {msg.role !== "user" && <div className={styles.msgAvatar}><Bot size={14}/></div>}
                   <div className={`${styles.messageBubble} ${msg.role === "user" ? styles.bubbleUser : styles.bubbleAi}`}>
                     {/* @ts-ignore */}
                     {msg.content}
                   </div>
                </div>
              ))}
              {isLoading && (
                <div className={`${styles.messageWrapper} ${styles.wrapperAi}`}>
                   <div className={styles.msgAvatar}><Loader2 size={14} className={styles.spinIcon}/></div>
                   <div className={`${styles.messageBubble} ${styles.bubbleAi}`}>...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className={styles.inputArea} onSubmit={handleSend}>
              <button 
                  type="button" 
                  className={`${styles.micBtn} ${isRecording ? styles.micRecording : ''}`}
                  onClick={toggleRecording}
                  title="Falar com o agente"
                  disabled={isTranscribing}
                >
                  {isRecording ? <Square size={16} /> : isTranscribing ? <Loader2 size={16} className={styles.spinIcon} /> : <Mic size={16} />}
              </button>
              
              <input
                className={styles.input}
                placeholder="Diga ao agente qual o perfil do criativo..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button className={styles.sendBtn} type="submit" disabled={!inputText.trim() || isLoading}>
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className={styles.historyArea}>
             <div className={styles.searchRow}>
               <Search size={16} className={styles.searchIcon}/>
               <input 
                 className={styles.searchInput} 
                 placeholder="Pesquisar em conversas passadas..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
             
             <div className={styles.historyList}>
                {sessions.filter((s:any) => s.title.toLowerCase().includes(searchTerm.toLowerCase())).map((session:any) => (
                  <div key={session.id} className={styles.historyItem} onClick={() => { loadMessages(session.id); setActiveTab('chat'); }}>
                     <div className={styles.historyItemInfo}>
                       <h4>{session.title}</h4>
                       <span>{new Date(session.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                     </div>
                     <button className={styles.continueBtn}><Bot size={14}/></button>
                  </div>
                ))}
                
                {sessions.length === 0 && (
                  <div className={styles.historyEmpty}>
                     <p>Você não possui chats salvos com o agente {agentName} ainda.</p>
                  </div>
                )}
             </div>
             
             <div className={styles.historyFooter}>
               <button className={styles.newChatBtn} onClick={() => { setActiveSessionId(null); setActiveTab("chat"); }}>
                 <PlusCircle size={16}/> Começar Novo Chat
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
