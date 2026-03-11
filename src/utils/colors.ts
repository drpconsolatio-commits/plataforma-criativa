export function getBadgeStyle(text: string | null | undefined): React.CSSProperties {
  if (!text) return {};
  
  // Cores prefixadas para objetivos padrão manterem a fidelidade visual original
  const lower = text.toLowerCase().trim();
  if (lower.includes("captação")) return { background: "#dbeafe", color: "#1e40af" };
  if (lower.includes("conversão")) return { background: "#dcfce7", color: "#15803d" };
  if (lower.includes("app")) return { background: "#f3e8ff", color: "#6b21a8" };
  if (lower.includes("perpétuo")) return { background: "#f3f4f6", color: "#1f2937" };
  if (lower.includes("google")) return { background: "#991b1b", color: "#ffffff" };

  // Para tags adicionadas manualmente, geramos uma cor única baseada no texto
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  
  // Cores em tom pastel vibrante para manter o estilo premium
  return {
    backgroundColor: `hsla(${hue}, 70%, 50%, 0.12)`,
    color: `hsl(${hue}, 75%, 45%)`,
    border: `1px solid hsla(${hue}, 70%, 50%, 0.2)`
  };
}
