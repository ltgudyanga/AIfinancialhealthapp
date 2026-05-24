'use client';
import type { TabId } from '@/lib/types';

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'journal',   icon: '📒', label: 'Journal'   },
  { id: 'planner',   icon: '📅', label: 'Budget'    },
  { id: 'analytics', icon: '📈', label: 'Analytics' },
  { id: 'si60',      icon: '🛡️', label: 'SI-60'     },
  { id: 'vault',     icon: '🗄️', label: 'Vault'     },
  { id: 'partners',  icon: '👥', label: 'Partners'  },
];

interface Props {
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden glass-panel border-t border-blue-500/20 flex safe-area-inset-bottom">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => setActiveTab(t.id)}
          className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
            activeTab === t.id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <span className="text-base leading-none">{t.icon}</span>
          <span className="text-[8px] font-black uppercase tracking-wide">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
