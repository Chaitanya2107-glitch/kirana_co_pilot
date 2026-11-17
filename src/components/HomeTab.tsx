import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Pencil,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { SAVED_THIS_MONTH } from '../data/initialData';
import { formatINR } from '../utils/kiranaRules';

interface HomeTabProps {
  stuckRupees: number;
  atRiskCount: number;
  lowItemsCount: number;
  budget: number;
  onUpdateBudget: (newBudget: number) => void;
  onGoToStockRisk: () => void;
  onGoToReorder: () => void;
}

export function HomeTab({
  stuckRupees,
  atRiskCount,
  lowItemsCount,
  budget,
  onUpdateBudget,
  onGoToStockRisk,
  onGoToReorder,
}: HomeTabProps) {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState(String(budget));

  const handleStartEdit = () => {
    setBudgetDraft(String(budget));
    setIsEditingBudget(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(budgetDraft.replace(/[^0-9]/g, ''));
    if (Number.isFinite(parsed) && parsed >= 0) {
      onUpdateBudget(parsed);
    }
    setIsEditingBudget(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-[#111814] tracking-tight">
          Shop Summary
        </h1>
        <span className="text-xs md:text-sm text-[#5A655E]">
          2-minute daily check
        </span>
      </div>

      {/* Primary Hero Card + Secondary Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Big Card: ₹X stuck in old or slow stock */}
        <section className="lg:col-span-7 bg-white border border-[#E2E6E0] rounded-2xl p-5 md:p-6 flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#B45309]">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Old or slow stock</span>
            </div>

            <p className="mt-3 text-3xl md:text-4xl font-bold text-[#111814] tabular-nums tracking-tight">
              {formatINR(stuckRupees)} stuck in old or slow stock
            </p>

            <p className="mt-2 text-sm md:text-base text-[#525E56]">
              {atRiskCount > 0
                ? `${atRiskCount} ${atRiskCount === 1 ? 'item has' : 'items have'} older packs that may not sell before expiry.`
                : 'No stock is at risk of expiring right now.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onGoToStockRisk}
            className="w-full sm:w-auto min-h-[48px] px-5 py-3 rounded-xl bg-[#B45309] hover:bg-[#92400E] active:scale-[0.99] text-white font-semibold text-base flex items-center justify-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B45309]"
          >
            <span>See what to sell first</span>
            <ArrowRight className="w-5 h-5 shrink-0" aria-hidden="true" />
          </button>
        </section>

        {/* Right Column on Desktop, Stacked on Mobile */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Card: N items running low */}
          <section className="bg-white border border-[#E2E6E0] rounded-2xl p-5 flex-1 flex flex-col justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#B91C1C]">
                Needs reorder soon
              </p>
              <p className="mt-1.5 text-2xl md:text-3xl font-bold text-[#111814] tabular-nums">
                {lowItemsCount} {lowItemsCount === 1 ? 'item' : 'items'} running low
              </p>
              <p className="mt-1 text-sm text-[#525E56]">
                {lowItemsCount > 0
                  ? 'Less than 4 days of stock left based on daily sales.'
                  : 'Every item has 4 or more days of stock.'}
              </p>
            </div>

            <button
              type="button"
              onClick={onGoToReorder}
              className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#14532D] hover:bg-[#166534] active:scale-[0.99] text-white font-semibold text-base flex items-center justify-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D]"
            >
              <span>Plan reorder</span>
              <ArrowRight className="w-5 h-5 shrink-0" aria-hidden="true" />
            </button>
          </section>

          {/* Card: ₹1,240 saved this month */}
          <section className="bg-[#ECFDF5] border border-[#BBF7D0] rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-[#15803D]">
                <TrendingUp className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Saved this month</span>
              </div>
              <p className="mt-1 text-2xl md:text-3xl font-bold text-[#14532D] tabular-nums">
                {formatINR(SAVED_THIS_MONTH)} saved this month
              </p>
              <p className="mt-0.5 text-xs md:text-sm text-[#166534]">
                Avoided over-ordering &amp; expiry waste
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Small row: cash budget ₹7,000 (editable inline) */}
      <section className="bg-white border border-[#E2E6E0] rounded-2xl p-4 md:px-5 md:py-4">
        {isEditingBudget ? (
          <form
            onSubmit={handleSaveBudget}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <label
              htmlFor="home-budget-input"
              className="flex items-center gap-2 text-sm font-semibold text-[#111814]"
            >
              <Wallet className="w-4 h-4 text-[#525E56]" aria-hidden="true" />
              <span>Cash budget for next reorder</span>
            </label>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-40">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-bold text-[#525E56]">
                  ₹
                </span>
                <input
                  id="home-budget-input"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={100}
                  value={budgetDraft}
                  onChange={(e) => setBudgetDraft(e.target.value)}
                  autoFocus
                  className="w-full min-h-[48px] pl-7 pr-3 rounded-xl border-2 border-[#14532D] bg-white text-base font-bold text-[#111814] tabular-nums focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="min-h-[48px] px-4 rounded-xl bg-[#14532D] text-white font-semibold text-sm flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>Save</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingBudget(false)}
                className="min-h-[48px] px-3 rounded-xl bg-[#F2F5F0] text-[#37413A] font-semibold text-sm whitespace-nowrap shrink-0"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <Wallet className="w-5 h-5 text-[#525E56] shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#111814]">
                  Cash budget
                </p>
                <p className="text-xs text-[#5A655E]">
                  Used to cap draft reorder
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xl font-bold text-[#111814] tabular-nums">
                {formatINR(budget)}
              </span>
              <button
                type="button"
                onClick={handleStartEdit}
                className="min-h-[48px] min-w-[48px] px-3 rounded-xl border border-[#D4DAD2] bg-[#F7F8F6] hover:bg-[#ECEFEA] text-sm font-semibold text-[#111814] flex items-center justify-center gap-1.5 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#14532D]"
              >
                <Pencil className="w-4 h-4" aria-hidden="true" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
