"use client";

import { AgentProvider } from "@/context/AgentContext";
import AgentChatGlobal from "@/components/Agentes/AgentChatGlobal";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AgentProvider>
      {children}
      <AgentChatGlobal />
    </AgentProvider>
  );
}
