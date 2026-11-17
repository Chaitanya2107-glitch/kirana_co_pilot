import {
  ClipboardList,
  Home,
  IndianRupee,
  Package,
  Truck,
} from 'lucide-react';
import { TabId } from '../types';

interface NavProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  lowCount: number;
  atRiskCount: number;
}

const NAV_ITEMS: { id: TabId; label: string; shortLabel: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', shortLabel: 'Home', icon: Home },
  { id: 'stock', label: 'Stock', shortLabel: 'Stock', icon: Package },
  { id: 'delivery', label: 'Delivery', shortLabel: 'Delivery', icon: Truck },
  { id: 'reorder', label: 'Reorder', shortLabel: 'Reorder', icon: ClipboardList },
  { id: 'cash', label: 'Cash & Khata', shortLabel: 'Cash', icon: IndianRupee },
];

export function TopHeader({ activeTab, onSelectTab, lowCount }: NavProps) {
  return (
    <header className="bg-white border-b border-[#E2E6E0]">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className="text-lg md:text-xl font-bold tracking-tight text-[#111814] whitespace-nowrap shrink-0 text-left focus-visible:outline-2 focus-visible:outline-[#15803D] rounded-md"
        >
          Kirana Co-pilot
        </button>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-2"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#15803D] ${
                  isActive
                    ? 'bg-[#14532D] text-white'
                    : 'text-[#4B554E] hover:bg-[#EEF2EC] hover:text-[#111814]'
                }`}
              >
                {item.label}
                {item.id === 'reorder' && lowCount > 0 && (
                  <span
                    className={`ml-2 font-mono-num text-xs ${
                      isActive ? 'text-emerald-200' : 'text-[#B91C1C]'
                    }`}
                  >
                    ({lowCount})
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={() => onSelectTab('delivery')}
            className="min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold bg-[#F2F5F0] text-[#111814] hover:bg-[#E5EAE2] transition-colors whitespace-nowrap shrink-0 md:inline-flex hidden items-center gap-2 focus-visible:outline-2 focus-visible:outline-[#15803D]"
          >
            <Truck className="w-4 h-4" aria-hidden="true" />
            Add Delivery
          </button>
          <span className="md:hidden text-xs font-medium text-[#5A655E] whitespace-nowrap">
            Daily Check
          </span>
        </div>
      </div>
    </header>
  );
}

export function BottomNav({ activeTab, onSelectTab, lowCount, atRiskCount }: NavProps) {
  return (
    <nav
      aria-label="Bottom navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DCE1DA] pb-safe"
    >
      <div className="grid grid-cols-5 h-16">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const count =
            item.id === 'reorder'
              ? lowCount
              : item.id === 'stock'
                ? atRiskCount
                : 0;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center min-h-[48px] px-1 transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#15803D] ${
                isActive ? 'text-[#14532D]' : 'text-[#5A655E]'
              }`}
            >
              <div className="relative">
                <Icon
                  className="w-5 h-5"
                  strokeWidth={isActive ? 2.4 : 1.9}
                  aria-hidden="true"
                />
                {count > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center leading-none ${
                      item.id === 'reorder'
                        ? 'bg-[#B91C1C] text-white'
                        : 'bg-[#B45309] text-white'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] mt-1 leading-none whitespace-nowrap ${
                  isActive ? 'font-bold text-[#14532D]' : 'font-medium'
                }`}
              >
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
