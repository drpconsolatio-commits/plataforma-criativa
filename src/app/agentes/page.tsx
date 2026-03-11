"use client";

import styles from "./page.module.css";
import { Bot, Plus, ArrowRight } from "lucide-react";
import { useAgent } from "@/context/AgentContext";

const AGENTS_MOCK = [
  {
    id: "cpy-1",
    name: "Roteirista Consolatio",
    role: "Copywriter Sênior de Ganchos e Retenção",
    description: "Especialista em criar scripts virais curtos (Hooks, Retenção e CTA) focados em e-commerce e conversão profunda."
  },
  {
    id: "pln-2",
    name: "Planejador Estratégico",
    role: "Analista de Tráfego e Persona",
    description: "Levanta ângulos de marketing, dores do público alvo e orienta qual melhor linha editorial usar na campanha."
  }
];

export default function AgentesPage() {
  const { openChat } = useAgent();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconWrapper}>
            <Bot size={24} className={styles.headerIcon} />
          </div>
          <div>
            <h1 className={styles.title}>Agentes de Inteligência Artificial</h1>
            <p className={styles.subtitle}>
              Configure os seus assistentes, dê papéis, regras e memórias dedicadas.
            </p>
          </div>
        </div>
        <button className={styles.newAgentBtn}>
          <Plus size={16} />
          Novo Agente
        </button>
      </header>

      <div className={styles.content}>
        <div className={styles.agentsGrid}>
           {AGENTS_MOCK.map((agent) => (
             <div 
               key={agent.id} 
               className={styles.agentCard} 
               onClick={() => openChat({ id: agent.id, name: agent.name, role: agent.role })}
             >
                <div className={styles.cardHeader}>
                  <div className={styles.cardAvatar}><Bot size={20} className={styles.headerIcon}/></div>
                  <span className={styles.statusBadge}>Online</span>
                </div>
                <h3 className={styles.agentName}>{agent.name}</h3>
                <span className={styles.agentRole}>{agent.role}</span>
                <p className={styles.agentDesc}>{agent.description}</p>
                <div className={styles.cardFooter}>
                  <span>Conversar</span>
                  <ArrowRight size={14} />
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
