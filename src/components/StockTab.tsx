import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronRight,
  ClipboardCheck,
  Minus,
  Plus,
  X,
} from 'lucide-react';
import { AtRiskItem, InventoryItem, ItemMetrics } from '../types';
import { formatDays, formatINR, formatShortDate } from '../utils/kiranaRules';

interface StockTabProps {
  allMetrics: ItemMetrics[];
  atRiskItems: AtRiskItem[];
  onRenameAlias: (itemId: string, newAlias: string) => void;
  onSaveWeeklyCount: (counts: Record<string, number>) => void;
  highlightRiskOnMount?: boolean;
}

export function StockTab({
  allMetrics,
  atRiskItems,
  onRenameAlias,
  onSaveWeeklyCount,
  highlightRiskOnMount,
}: StockTabProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [aliasInput, setAliasInput] = useState('');
  const [isWeeklyCountMode, setIsWeeklyCountMode] = useState(false);
  const [weeklyCounts, setWeeklyCounts] = useState<Record<string, number>>({});
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (highlightRiskOnMount) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [highlightRiskOnMount]);

  const selectedMetrics = selectedItemId
    ? allMetrics.find((m) => m.item.id === selectedItemId) ?? null
    : null;

  const openDetailSheet = (item: InventoryItem) => {
    setSelectedItemId(item.id);
    setAliasInput(item.alias);
  };

  const closeDetailSheet = () => {
    setSelectedItemId(null);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMetrics) return;
    const trimmed = aliasInput.trim();
    if (trimmed) {
      onRenameAlias(selectedMetrics.item.id, trimmed);
      setSavedNotice(`Renamed to "${trimmed}"`);
      setTimeout(() => setSavedNotice(null), 2500);
    }
    setSelectedItemId(null);
  };

  const startWeeklyCount = () => {
    const initial: Record<string, number> = {};
    for (const m of allMetrics) {
      initial[m.item.id] = m.totalStock;
    }
    setWeeklyCounts(initial);
    setIsWeeklyCountMode(true);
  };

  const adjustWeeklyCount = (itemId: string, delta: number) => {
    setWeeklyCounts((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] ?? 0) + delta),
    }));
  };

  const handleSaveWeeklyCount = () => {
    onSaveWeeklyCount(weeklyCounts);
    setIsWeeklyCountMode(false);
    setSavedNotice('Stock counts updated');
    setTimeout(() => setSavedNotice(null), 2500);
  };

  const getStatusChipStyle = (status: ItemMetrics['status']) => {
    if (status === 'Low') {
      return 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]';
    }
    if (status === 'Old stock') {
      return 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]';
    }
    return 'bg-[#ECFDF5] text-[#15803D] border-[#BBF7D0]';
  };

  return (
    <div className="space-y-5">
      {/* Header + Weekly Count Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#111814] tracking-tight">
            Stock
          </h1>
          <p className="text-xs md:text-sm text-[#5A655E]">
            Tap any item to see batches or rename
          </p>
        </div>

        {!isWeeklyCountMode ? (
          <button
            type="button"
            onClick={startWeeklyCount}
            className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[#14532D] hover:bg-[#166534] text-white font-semibold text-sm flex items-center gap-2 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#14532D]"
          >
            <ClipboardCheck className="w-4 h-4" aria-hidden="true" />
            <span>Weekly count</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsWeeklyCountMode(false)}
              className="min-h-[48px] px-4 rounded-xl border border-[#D4DAD2] bg-white text-[#37413A] font-semibold text-sm whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveWeeklyCount}
              className="min-h-[48px] px-5 rounded-xl bg-[#14532D] hover:bg-[#166534] text-white font-semibold text-sm flex items-center gap-1.5 whitespace-nowrap"
            >
              <Check className="w-4 h-4" aria-hidden="true" />
              <span>Save counts</span>
            </button>
          </div>
        )}
      </div>

      {savedNotice && (
        <div
          role="status"
          className="rounded-xl bg-[#ECFDF5] border border-[#BBF7D0] px-4 py-3 text-sm font-semibold text-[#14532D]"
        >
          {savedNotice}
        </div>
      )}

      {/* Weekly Count Fast Mode */}
      {isWeeklyCountMode ? (
        <section className="bg-white border border-[#E2E6E0] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-[#F2F5F0] border-b border-[#E2E6E0] flex items-center justify-between">
            <span className="text-sm font-semibold text-[#111814]">
              Count each item on shelf
            </span>
            <span className="text-xs text-[#5A655E]">
              Tap + / − then Save
            </span>
          </div>
          <div className="divide-y divide-[#ECEFEA]">
            {allMetrics.map(({ item, totalStock }) => {
              const current = weeklyCounts[item.id] ?? totalStock;
              return (
                <div
                  key={item.id}
                  className="p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-[#111814] truncate">
                      {item.alias}
                    </p>
                    <p className="text-xs text-[#647068] truncate">
                      {item.officialName} · Was {totalStock}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      aria-label={`Decrease ${item.alias}`}
                      onClick={() => adjustWeeklyCount(item.id, -1)}
                      className="min-h-[48px] min-w-[48px] rounded-xl border border-[#D4DAD2] bg-[#F7F8F6] hover:bg-[#ECEFEA] text-[#111814] flex items-center justify-center active:scale-95"
                    >
                      <Minus className="w-5 h-5" />
                    </button>

                    <span className="w-11 text-center text-lg font-bold text-[#111814] tabular-nums">
                      {current}
                    </span>

                    <button
                      type="button"
                      aria-label={`Increase ${item.alias}`}
                      onClick={() => adjustWeeklyCount(item.id, 1)}
                      className="min-h-[48px] min-w-[48px] rounded-xl border border-[#D4DAD2] bg-[#F7F8F6] hover:bg-[#ECEFEA] text-[#111814] flex items-center justify-center active:scale-95"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-4 bg-[#F7F8F6] border-t border-[#E2E6E0]">
            <button
              type="button"
              onClick={handleSaveWeeklyCount}
              className="w-full min-h-[48px] rounded-xl bg-[#14532D] hover:bg-[#166534] text-white font-semibold text-base flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" aria-hidden="true" />
              <span>Save weekly count</span>
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* At-Risk List at the top, sorted by ₹ at risk */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base md:text-lg font-bold text-[#111814] flex items-center gap-2">
                <AlertTriangle
                  className="w-5 h-5 text-[#B45309] shrink-0"
                  aria-hidden="true"
                />
                <span>Sell first (at-risk stock)</span>
              </h2>
              <span className="text-xs font-medium text-[#5A655E]">
                Sorted by ₹ at risk
              </span>
            </div>

            {atRiskItems.length === 0 ? (
              <div className="bg-[#ECFDF5] border border-[#BBF7D0] rounded-2xl p-4 text-sm font-medium text-[#14532D]">
                Good news — no old batches are at risk right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {atRiskItems.map((entry) => (
                  <button
                    key={entry.item.id}
                    type="button"
                    onClick={() => openDetailSheet(entry.item)}
                    className="text-left bg-[#FFFBEB] hover:bg-[#FEF3C7]/60 border border-[#FDE68A] rounded-2xl p-4 flex flex-col justify-between gap-3 transition-colors min-h-[48px]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-bold text-[#111814]">
                          {entry.item.alias}
                        </p>
                        <p className="text-xs text-[#647068]">
                          {entry.item.officialName}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-[#B91C1C] tabular-nums">
                          {formatINR(entry.atRiskRupees)} at risk
                        </p>
                        <p className="text-xs text-[#92400E] tabular-nums">
                          {entry.atRiskUnits} old units
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-[#4B3B16]">{entry.reason}</p>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#FDE68A]">
                      <span className="text-xs font-semibold text-[#92400E]">
                        Action: {entry.suggestedAction}
                      </span>
                      <span className="text-xs font-semibold text-[#111814] flex items-center gap-0.5">
                        Details
                        <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* All Items List */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base md:text-lg font-bold text-[#111814]">
                All items ({allMetrics.length})
              </h2>
            </div>

            <div className="bg-white border border-[#E2E6E0] rounded-2xl divide-y divide-[#ECEFEA] overflow-hidden">
              {allMetrics.map((m) => (
                <button
                  key={m.item.id}
                  type="button"
                  onClick={() => openDetailSheet(m.item)}
                  className="w-full text-left px-4 py-3.5 min-h-[64px] hover:bg-[#F7F8F6] active:bg-[#EEF2EC] transition-colors flex items-center justify-between gap-3 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#14532D]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-[#111814] truncate">
                      {m.item.alias}
                    </p>
                    <p className="text-xs text-[#647068] truncate">
                      {m.item.officialName}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#111814] tabular-nums">
                        {m.totalStock} left
                      </p>
                      <p className="text-xs text-[#5A655E] tabular-nums">
                        {formatDays(m.daysLeft)}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-md border text-xs font-bold whitespace-nowrap ${getStatusChipStyle(
                        m.status
                      )}`}
                    >
                      {m.status}
                    </span>

                    <ChevronRight
                      className="w-4 h-4 text-[#859189]"
                      aria-hidden="true"
                    />
                  </div>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Item Detail Sheet / Modal */}
      {selectedMetrics && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-sheet-title"
        >
          <div className="w-full md:max-w-lg bg-white rounded-t-3xl md:rounded-2xl max-h-[88vh] flex flex-col overflow-hidden shadow-xl">
            <div className="md:hidden w-10 h-1.5 bg-[#D4DAD2] rounded-full mx-auto mt-3 shrink-0" />

            <div className="px-5 py-4 border-b border-[#E2E6E0] flex items-start justify-between gap-3">
              <div>
                <h2
                  id="detail-sheet-title"
                  className="text-lg font-bold text-[#111814]"
                >
                  {selectedMetrics.item.alias}
                </h2>
                <p className="text-xs text-[#647068]">
                  {selectedMetrics.item.officialName} · {selectedMetrics.item.distributor}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close item details"
                onClick={closeDetailSheet}
                className="min-h-[44px] min-w-[44px] -mr-2 -mt-1 rounded-xl flex items-center justify-center text-[#525E56] hover:bg-[#F2F5F0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-[#F7F8F6] rounded-xl p-3">
                  <p className="text-xs text-[#5A655E]">In stock</p>
                  <p className="text-lg font-bold text-[#111814] tabular-nums mt-0.5">
                    {selectedMetrics.totalStock}
                  </p>
                </div>
                <div className="bg-[#F7F8F6] rounded-xl p-3">
                  <p className="text-xs text-[#5A655E]">Avg daily sales</p>
                  <p className="text-lg font-bold text-[#111814] tabular-nums mt-0.5">
                    {selectedMetrics.item.dailySales}/day
                  </p>
                </div>
                <div className="bg-[#F7F8F6] rounded-xl p-3">
                  <p className="text-xs text-[#5A655E]">Days left</p>
                  <p className="text-lg font-bold text-[#111814] tabular-nums mt-0.5">
                    {formatDays(selectedMetrics.daysLeft)}
                  </p>
                </div>
              </div>

              {/* Batches */}
              <div>
                <h3 className="text-sm font-bold text-[#111814] mb-2">
                  Batches ({selectedMetrics.batchDetails.length})
                </h3>
                {selectedMetrics.batchDetails.length === 0 ? (
                  <p className="text-sm text-[#5A655E]">No units in stock.</p>
                ) : (
                  <div className="border border-[#E2E6E0] rounded-xl divide-y divide-[#ECEFEA]">
                    {selectedMetrics.batchDetails.map((b) => (
                      <div
                        key={b.batch.id}
                        className={`px-3.5 py-3 flex items-center justify-between gap-3 ${
                          b.isAtRisk ? 'bg-[#FFFBEB]' : 'bg-white'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold text-[#111814] tabular-nums">
                            {b.batch.qty} units
                          </p>
                          <p className="text-xs text-[#5A655E]">
                            Bought on {formatShortDate(b.batch.boughtDate)} ({formatINR(b.batch.buyPrice)}/unit)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#111814] tabular-nums">
                            {b.ageDays} {b.ageDays === 1 ? 'day' : 'days'} old
                          </p>
                          {b.isAtRisk ? (
                            <p className="text-xs font-semibold text-[#B45309] tabular-nums">
                              {formatINR(b.rupeesAtRisk)} at risk · {b.remainingShelfLifeDays}d left
                            </p>
                          ) : (
                            <p className="text-xs text-[#5A655E] tabular-nums">
                              {b.remainingShelfLifeDays}d shelf life left
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rename Alias */}
              <form onSubmit={handleRenameSubmit} className="space-y-2 pt-2 border-t border-[#E2E6E0]">
                <label
                  htmlFor="rename-alias-input"
                  className="block text-sm font-bold text-[#111814]"
                >
                  Rename (your shop name for this item)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="rename-alias-input"
                    type="text"
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value)}
                    placeholder="Enter name you use"
                    className="flex-1 min-h-[48px] px-3.5 rounded-xl border border-[#CBD2C9] bg-white text-base font-medium text-[#111814] focus:border-[#14532D] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="min-h-[48px] px-5 rounded-xl bg-[#14532D] hover:bg-[#166534] text-white font-semibold text-sm whitespace-nowrap shrink-0"
                  >
                    Save name
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
