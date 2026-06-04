import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface FloatingReaction {
  id: number;
  emoji: string;
  user_name: string;
  /** horizontal start position (0-100 vw fraction within the layer) */
  x: number;
}

interface Props {
  reactions: FloatingReaction[];
  onExpire: (id: number) => void;
}

/**
 * Renders floating emoji reactions that drift upward and fade out.
 * Each reaction auto-expires after 3 s.
 */
export function ReactionLayer({ reactions, onExpire }: Props) {
  return (
    <>
      <style>{`
        @keyframes reaction-float {
          0%   { transform: translateY(0) scale(0.6);   opacity: 0; }
          15%  { transform: translateY(-10px) scale(1.1); opacity: 1; }
          80%  { transform: translateY(-160px) scale(1);  opacity: 1; }
          100% { transform: translateY(-220px) scale(0.7); opacity: 0; }
        }
        .reaction-fly {
          animation: reaction-float 3s ease-out forwards;
        }
      `}</style>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {reactions.map(r => (
          <ReactionItem key={r.id} reaction={r} onExpire={onExpire} />
        ))}
      </div>
    </>
  );
}

function ReactionItem({ reaction, onExpire }: { reaction: FloatingReaction; onExpire: (id: number) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onExpire(reaction.id), 3000);
    return () => clearTimeout(t);
  }, [reaction.id, onExpire]);

  return (
    <div
      className="reaction-fly absolute bottom-2 flex flex-col items-center"
      style={{ left: `${reaction.x}%` }}
    >
      <span className="text-3xl drop-shadow-md select-none">{reaction.emoji}</span>
      <span className="text-[10px] text-slate-500 bg-white/80 px-1.5 py-0.5 rounded-full mt-0.5 max-w-[80px] truncate">
        {reaction.user_name}
      </span>
    </div>
  );
}

const REACTION_EMOJIS = ['👍', '❤️', '👏', '🎉', '🤔', '😮', '🔥', '😂'] as const;

interface BarProps {
  disabled?: boolean;
  onSend: (emoji: string) => void;
}

export function ReactionBar({ disabled, onSend }: BarProps) {
  const { t } = useTranslation('livestream');
  const [cooldown, setCooldown] = useState(false);

  const handle = (emoji: string) => {
    if (disabled || cooldown) return;
    onSend(emoji);
    setCooldown(true);
    setTimeout(() => setCooldown(false), 600);
  };

  return (
    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full px-2 py-1 shadow-sm">
      {REACTION_EMOJIS.map(e => (
        <button
          key={e}
          onClick={() => handle(e)}
          disabled={disabled || cooldown}
          aria-label={t('reactions.sendAria', { emoji: e })}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 active:scale-90 transition-transform disabled:opacity-50 disabled:cursor-not-allowed text-xl leading-none select-none"
        >
          {e}
        </button>
      ))}
    </div>
  );
}
