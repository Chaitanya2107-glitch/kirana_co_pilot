import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { INITIAL_CASH_POSITION, UPI_CASH_IN_TODAY } from '../data/initialData';
import { KhataCustomer, KhataTag } from '../types';
import { computeCashSummary, formatINR } from '../utils/kiranaRules';

interface CashKhataTabProps {
  customers: KhataCustomer[];
  orderTotal: number;
  onUpdateCustomerTag: (customerId: string, tag: KhataTag) => void;
}

const TAG_OPTIONS: KhataTag[] = ['Pays on time', 'Usually late', 'Uncertain'];

export function CashKhataTab({
  customers,
  orderTotal,
  onUpdateCustomerTag,
}: CashKhataTabProps) {
  const summary = computeCashSummary(
    INITIAL_CASH_POSITION,
    customers,
    orderTotal
  );

  const getTagButtonStyle = (tag: KhataTag, isSelected: boolean) => {
    if (!isSelected) {
      return 'bg-[#F7F8F6] text-[#525E56] border-[#DCE1DA] hover:bg-[#ECEFEA]';
    }
    if (tag === 'Pays on time') {
      return 'bg-[#15803D] text-white border-[#15803D]';
    }
    if (tag === 'Usually late') {
      return 'bg-[#B45309] text-white border-[#B45309]';
    }
    return 'bg-[#B91C1C] text-white border-[#B91C1C]';
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#111814] tracking-tight">
          Cash &amp; Khata
        </h1>
        <p className="text-xs md:text-sm text-[#5A655E]">
          See how much cash is safe to spend after delayed credit
        </p>
      </div>

      {/* Warning if safe to spend < order total */}
      {summary.isBelowOrderTotal ? (
        <div
          role="alert"
          className="rounded-2xl bg-[#FFFBEB] border-2 border-[#F59E0B] p-4 flex items-start gap-3"
        >
          <AlertTriangle
            className="w-6 h-6 text-[#B45309] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <p className="text-base font-bold text-[#78350F]">
              Safe to spend ({formatINR(summary.safeToSpend)}) is below your order total ({formatINR(orderTotal)}).
            </p>
            <p className="text-sm text-[#92400E] mt-0.5">
              Collect delayed khata first or skip lower-priority items on Reorder.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#ECFDF5] border border-[#BBF7D0] p-4 flex items-center gap-3">
          <CheckCircle2
            className="w-6 h-6 text-[#15803D] shrink-0"
            aria-hidden="true"
          />
          <p className="text-sm md:text-base font-semibold text-[#14532D]">
            Safe to spend ({formatINR(summary.safeToSpend)}) covers your current order total ({formatINR(orderTotal)}).
          </p>
        </div>
      )}

      {/* Top Cash & Safe-to-Spend Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Safe to spend card with working */}
        <section className="lg:col-span-6 bg-white border border-[#E2E6E0] rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#525E56]">
              Safe to spend
            </p>
            <p
              className={`mt-1.5 text-3xl md:text-4xl font-bold tabular-nums tracking-tight ${
                summary.isBelowOrderTotal ? 'text-[#B45309]' : 'text-[#15803D]'
              }`}
            >
              {formatINR(summary.safeToSpend)}
            </p>
          </div>

          <div className="bg-[#F7F8F6] rounded-xl p-3.5 space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#525E56]">Cash position</span>
              <span className="font-bold text-[#111814] tabular-nums">
                {formatINR(INITIAL_CASH_POSITION)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#525E56]">
                Minus delayed khata (Usually late + Uncertain)
              </span>
              <span className="font-bold text-[#B91C1C] tabular-nums">
                − {formatINR(summary.delayedShare)}
              </span>
            </div>
            <div className="pt-1.5 border-t border-[#E2E6E0] flex items-center justify-between">
              <span className="font-semibold text-[#111814]">Safe to spend</span>
              <span className="font-bold text-[#111814] tabular-nums">
                {formatINR(summary.safeToSpend)}
              </span>
            </div>
          </div>
        </section>

        {/* Cash position, UPI today, Khata summary */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <section className="bg-white border border-[#E2E6E0] rounded-2xl p-5 flex flex-col justify-center">
            <p className="text-sm font-semibold text-[#525E56]">
              UPI cash-in today
            </p>
            <p className="mt-1.5 text-2xl md:text-3xl font-bold text-[#15803D] tabular-nums">
              {formatINR(UPI_CASH_IN_TODAY)}
            </p>
            <p className="mt-1 text-xs text-[#647068]">Received today</p>
          </section>

          <section className="bg-white border border-[#E2E6E0] rounded-2xl p-5 flex flex-col justify-center">
            <p className="text-sm font-semibold text-[#525E56]">
              Cash position
            </p>
            <p className="mt-1.5 text-2xl md:text-3xl font-bold text-[#111814] tabular-nums">
              {formatINR(INITIAL_CASH_POSITION)}
            </p>
            <p className="mt-1 text-xs text-[#647068]">Cash + bank balance</p>
          </section>

          <section className="sm:col-span-2 bg-white border border-[#E2E6E0] rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#525E56]">
                Khata outstanding
              </p>
              <p className="mt-1 text-2xl md:text-3xl font-bold text-[#111814] tabular-nums">
                {formatINR(summary.totalKhata)}
              </p>
              <p className="mt-0.5 text-xs text-[#647068]">
                Across {customers.length} customers
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-[#B45309]">
                Delayed share
              </p>
              <p className="text-xl font-bold text-[#B45309] tabular-nums mt-0.5">
                {formatINR(summary.delayedShare)}
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Khata Customer List with Editable Tags */}
      <section className="bg-white border border-[#E2E6E0] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-[#F2F5F0] border-b border-[#E2E6E0] flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm md:text-base font-bold text-[#111814]">
            Khata customers ({customers.length})
          </h2>
          <span className="text-xs text-[#5A655E]">
            Tap a tag to update payment reliability
          </span>
        </div>

        <div className="divide-y divide-[#ECEFEA]">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="flex items-baseline justify-between md:block">
                <p className="text-base font-bold text-[#111814]">
                  {customer.name}
                </p>
                <p className="text-lg font-bold text-[#111814] tabular-nums md:mt-0.5">
                  {formatINR(customer.amount)}
                </p>
              </div>

              <div
                className="grid grid-cols-3 gap-1.5"
                role="group"
                aria-label={`Payment tag for ${customer.name}`}
              >
                {TAG_OPTIONS.map((tag) => {
                  const isSelected = customer.tag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onUpdateCustomerTag(customer.id, tag)}
                      aria-pressed={isSelected}
                      className={`min-h-[48px] px-2.5 py-2 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap flex items-center justify-center ${getTagButtonStyle(
                        tag,
                        isSelected
                      )}`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
