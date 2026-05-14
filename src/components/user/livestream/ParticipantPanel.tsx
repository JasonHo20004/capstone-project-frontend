import { Crown, Hand, UserRound, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Participant {
  user_id: string;
  user_name: string;
  is_host: boolean;
  hand_raised: boolean;
  hand_position: number;
}

interface Props {
  participants: Participant[];
  currentUserId: string;
  isHost: boolean;
  onInvite: (userId: string) => void;
  className?: string;
}

function initials(name: string) {
  return name
    .split(' ')
    .map(s => s.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
}

/**
 * Sidebar listing participants in the room, with raised-hand queue at the top.
 * Host sees a "Mời phát biểu" button on raised-hand entries.
 */
export function ParticipantPanel({ participants, currentUserId, isHost, onInvite, className }: Props) {
  const raised = participants
    .filter(p => p.hand_raised)
    .sort((a, b) => a.hand_position - b.hand_position);
  const others = participants.filter(p => !p.hand_raised);

  return (
    <div className={cn('flex flex-col bg-white border-l border-slate-200', className)}>
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 shrink-0">
        <UserRound className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs font-medium text-slate-500">Người trong phòng</span>
        <span className="ml-auto text-xs text-slate-400">{participants.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
        {raised.length > 0 && (
          <div>
            <div className="flex items-center gap-1 px-2 mb-1">
              <Hand className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                Đang giơ tay ({raised.length})
              </span>
            </div>
            <div className="space-y-1">
              {raised.map(p => (
                <Row
                  key={p.user_id}
                  p={p}
                  isMe={p.user_id === currentUserId}
                  isHost={isHost}
                  onInvite={onInvite}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          {raised.length > 0 && (
            <div className="px-2 mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Đang nghe
              </span>
            </div>
          )}
          <div className="space-y-1">
            {others.map(p => (
              <Row key={p.user_id} p={p} isMe={p.user_id === currentUserId} isHost={isHost} onInvite={onInvite} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ p, isMe, isHost, onInvite }: {
  p: Participant;
  isMe: boolean;
  isHost: boolean;
  onInvite: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors',
        p.hand_raised ? 'bg-amber-50 border border-amber-100' : 'hover:bg-slate-50',
        isMe && 'ring-1 ring-indigo-200',
      )}
    >
      <div
        className={cn(
          'relative w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0',
          p.is_host ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600',
        )}
      >
        {initials(p.user_name)}
        {p.hand_raised && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-white text-[9px] font-bold flex items-center justify-center shadow"
            aria-label={`Vị trí ${p.hand_position}`}
          >
            {p.hand_position}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className={cn('text-xs font-medium truncate', isMe ? 'text-indigo-700' : 'text-slate-700')}>
            {p.user_name}{isMe ? ' (bạn)' : ''}
          </span>
          {p.is_host && <Crown className="w-3 h-3 text-amber-500 shrink-0" aria-label="Host" />}
        </div>
        {p.hand_raised && (
          <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
            <Hand className="w-2.5 h-2.5" /> giơ tay
          </span>
        )}
      </div>

      {isHost && p.hand_raised && !p.is_host && (
        <button
          onClick={() => onInvite(p.user_id)}
          className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded transition-colors shrink-0"
          title="Mời học viên phát biểu"
        >
          <Megaphone className="w-3 h-3" /> Mời
        </button>
      )}
    </div>
  );
}
