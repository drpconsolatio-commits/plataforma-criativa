"use client";

import styles from "./ChannelColumn.module.css";
import type { Column, Creative, Channel } from "./KanbanBoard";
import { CHANNELS } from "./KanbanBoard";

interface Props {
  column: Column;
  channelCreatives: Creative[];
  index: number;
  onOpenChannel: (channelType: Channel) => void;
}

const CHANNEL_CONFIG: Record<Channel, { icon: string; description: string }> = {
  "Tráfego Pago": {
    icon: "📢",
    description: "Facebook ADS, Google ADS, TikTok ADS",
  },
  "Orgânicos": {
    icon: "🌱",
    description: "Instagram, TikTok, YouTube",
  },
};

export default function ChannelColumn({
  column,
  channelCreatives,
  index,
  onOpenChannel,
}: Props) {
  const getCount = (channel: Channel): number => {
    return channelCreatives.filter((cr) => cr.channels.includes(channel)).length;
  };

  return (
    <div
      className={styles.column}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Column Header */}
      <div className={styles.columnHeader}>
        <div className={styles.headerLeft}>
          <span
            className={styles.colorDot}
            style={{ background: column.colorVar }}
          />
          <h2 className={styles.columnTitle}>{column.title}</h2>
        </div>
      </div>

      {/* Channel Cards — clickable, no preview */}
      <div className={styles.channelList}>
        {CHANNELS.map((channel) => {
          const count = getCount(channel);
          const config = CHANNEL_CONFIG[channel];
          return (
            <div
              key={channel}
              className={styles.channelCard}
              onClick={() => onOpenChannel(channel)}
            >
              <div className={styles.channelIcon}>{config.icon}</div>
              <div className={styles.channelInfo}>
                <span className={styles.channelName}>{channel}</span>
                <span className={styles.channelDesc}>{config.description}</span>
              </div>
              <div className={styles.channelMeta}>
                <span className={styles.channelCount}>{count}</span>
                <span className={styles.channelHint}>Abrir planilha →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
