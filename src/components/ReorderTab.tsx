import { useState } from 'react';
import {
  Ban,
  Check,
  Copy,
  Minus,
  Pencil,
  PhoneCall,
  Plus,
  SkipForward,
  Undo2,
  X,
} from 'lucide-react';
import { ReorderLine, ReorderLineActionState, ReorderPlan } from '../types';
import { formatINR } from '../utils/kiranaRules';

interface ReorderTabProps {
  plan: ReorderPlan;
  budget: number;
  onSetActionState: (itemId: string, state: ReorderLineActionState) => void;
  onUpdateQtyOverride: (itemId: string, qty: number) => void;
  onResetQtyOverride: (itemId: string) => void;
}

export function ReorderTab({
  plan,
  budget,
  onSetActionState,
  onUpdateQtyOverride,
  onResetQtyOverride,
}: ReorderTabProps) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editQtyDraft, setEditQtyDraft] = useState<number>(1);
  const [showCallReadyModal, setShowCallReadyModal] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // Group funded lines by distributor
  const distributorMap = new Map<string, ReorderLine[]>();
  for (const line of plan.fundedLines) {
    const dist = line.item.distributor;
    const existing = distributorMap.get(dist) ?? [];
    existing.push(line);
    distributorMap.set(dist, existing);
  }
  const distributorGroups = Array.from(distributorMap.entries());

  const approvedLines = plan.fundedLines.filter(
    (l) => l.actionState === 'approved'
  );
  const approvedByDistributor = new Map<string, ReorderLine[]>();
  for (const line of approvedLines) {
    const dist = line.item.distributor;
    const existing = approvedByDistributor.get(dist) ?? [];
    existing.push(line);
    approvedByDistributor.set(dist, existing);
  }
  const approvedDistributorGroups = Array.from(approvedByDistributor.entries());

  const startEdit = (line: ReorderLine) => {
    setEditingItemId(line.item.id);
    setEditQtyDraft(line.qty);
  };

  const commitEdit = (itemId: string) => {
    const validQty = Math.max(1, Math.round(editQtyDraft || 1));
    onUpdateQtyOverride(itemId, validQty);
    setEditingItemId(null);
  };

  const buildWhatsAppText = () => {
    const lines: string[] = ['*Reorder List — Kirana Co-pilot*', ''];
    for (const [distributor, groupLines] of approvedDistributorGroups) {
      lines.push(`*${distributor}*`);
      for (const l of groupLines) {
        lines.push(`- ${l.item.alias} (${distributor}): ${l.qty} units (${formatINR(l.amount)})`);
      }
      lines.push('');
    }
    lines.push(`Estimated total: ${formatINR(plan.approvedOrderTotal)}`);
    return lines.join('\n');
  };

  const handleCopyWhatsApp = async () => {
    const text = buildWhatsAppText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#111814] tracking-tight">
            Draft Reorder
          </h1>
          <p className="text-xs md:text-sm text-[#5A655E]">
            Auto-built inside {formatINR(budget)} budget · Lowest days left first
          </p>
        </div>
        <span className="text-sm font-bold text-[#111814] tabular-nums">
          {formatINR(plan.activeOrderTotal)} / {formatINR(budget)}
        </span>
      </div>

      {/* Funded Draft Order grouped by Distributor */}
      {distributorGroups.length === 0 ? (
        <section className="bg-[#ECFDF5] border border-[#BBF7D0] rounded-2xl p-5 text-sm font-semibold text-[#14532D]">
          No items need reordering right now.
        </section>
      ) : (
        <div className="space-y-4">
          {distributorGroups.map(([distributor, lines]) => {
            const distTotal = lines
              .filter((l) => l.actionState !== 'skipped')
              .reduce((sum, l) => sum + l.amount, 0);

            return (
              <section
                key={distributor}
                className="bg-white border border-[#E2E6E0] rounded-2xl overflow-hidden"
              >
                <div className="px-4 py-3 bg-[#F2F5F0] border-b border-[#E2E6E0] flex items-center justify-between gap-2">
                  <h2 className="text-sm md:text-base font-bold text-[#111814]">
                    {distributor}
                  </h2>
                  <span className="text-sm font-bold text-[#111814] tabular-nums">
                    {formatINR(distTotal)}
                  </span>
                </div>

                <div className="divide-y divide-[#ECEFEA]">
                  {lines.map((line) => {
                    const isEditing = editingItemId === line.item.id;
                    const isApproved = line.actionState === 'approved';
                    const isSkipped = line.actionState === 'skipped';

                    return (
                      <div
                        key={line.item.id}
                        className={`p-4 space-y-3 transition-opacity ${
                          isSkipped
                            ? 'bg-[#F7F8F6] opacity-70'
                            : isApproved
                              ? 'bg-[#ECFDF5]/60'
                              : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p
                                className={`text-base font-bold ${
                                  isSkipped
                                    ? 'line-through text-[#5A655E]'
                                    : 'text-[#111814]'
                                }`}
                              >
                                {line.item.alias}
                              </p>
                              {isApproved && (
                                <span className="text-xs font-bold text-[#15803D]">
                                  Approved
                                </span>
                              )}
                              {isSkipped && (
                                <span className="text-xs font-bold text-[#5A655E]">
                                  Skipped
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#647068]">
                              {line.item.officialName}
                            </p>
                            <p
                              className={`mt-1 text-sm ${
                                line.reducedToFitBudget
                                  ? 'font-medium text-[#B45309]'
                                  : 'text-[#525E56]'
                              }`}
                            >
                              {line.reason}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-[#111814] tabular-nums">
                              {formatINR(line.amount)}
                            </p>
                            <p className="text-sm font-semibold text-[#37413A] tabular-nums">
                              {line.qty} {line.qty === 1 ? 'unit' : 'units'}
                            </p>
                            {line.reducedToFitBudget && (
                              <p className="text-[11px] font-semibold text-[#B45309]">
                                Need {line.suggestedQty}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Inline Edit Qty */}
                        {isEditing ? (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() =>
                                setEditQtyDraft((q) => Math.max(1, q - 1))
                              }
                              className="min-h-[48px] min-w-[48px] rounded-xl border border-[#CBD2C9] bg-white flex items-center justify-center"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              inputMode="numeric"
                              min={1}
                              value={editQtyDraft}
                              onChange={(e) =>
                                setEditQtyDraft(Number(e.target.value))
                              }
                              aria-label={`Quantity for ${line.item.alias}`}
                              className="w-20 min-h-[48px] text-center rounded-xl border-2 border-[#14532D] bg-white text-base font-bold tabular-nums focus:outline-none"
                            />
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() => setEditQtyDraft((q) => q + 1)}
                              className="min-h-[48px] min-w-[48px] rounded-xl border border-[#CBD2C9] bg-white flex items-center justify-center"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => commitEdit(line.item.id)}
                              className="min-h-[48px] px-4 rounded-xl bg-[#14532D] text-white text-sm font-semibold whitespace-nowrap"
                            >
                              Save qty
                            </button>
                            {line.isEdited && (
                              <button
                                type="button"
                                onClick={() => {
                                  onResetQtyOverride(line.item.id);
                                  setEditingItemId(null);
                                }}
                                className="min-h-[48px] px-3 rounded-xl border border-[#CBD2C9] bg-white text-xs font-semibold text-[#37413A] whitespace-nowrap"
                              >
                                Auto
                              </button>
                            )}
                          </div>
                        ) : (
                          /* Three Action Buttons: Approve, Edit, Skip */
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                onSetActionState(
                                  line.item.id,
                                  isApproved ? 'pending' : 'approved'
                                )
                              }
                              className={`min-h-[48px] px-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                                isApproved
                                  ? 'bg-[#15803D] text-white'
                                  : 'bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#14532D] border border-[#BBF7D0]'
                              }`}
                            >
                              <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                              <span>{isApproved ? 'Approved' : 'Approve'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => startEdit(line)}
                              className="min-h-[48px] px-3 rounded-xl border border-[#D4DAD2] bg-white hover:bg-[#F7F8F6] text-[#111814] font-semibold text-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
                            >
                              <Pencil className="w-4 h-4 shrink-0" aria-hidden="true" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                onSetActionState(
                                  line.item.id,
                                  isSkipped ? 'pending' : 'skipped'
                                )
                              }
                              className={`min-h-[48px] px-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 whitespace-nowrap ${
                                isSkipped
                                  ? 'bg-[#E2E6E0] text-[#111814]'
                                  : 'border border-[#D4DAD2] bg-[#F7F8F6] hover:bg-[#ECEFEA] text-[#525E56]'
                              }`}
                            >
                              {isSkipped ? (
                                <>
                                  <Undo2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                                  <span>Undo</span>
                                </>
                              ) : (
                                <>
                                  <SkipForward className="w-4 h-4 shrink-0" aria-hidden="true" />
                                  <span>Skip</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Not Funded Section */}
      {plan.notFundedLines.length > 0 && (
        <section className="bg-white border border-[#FECACA] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-[#FEF2F2] border-b border-[#FECACA] flex items-center justify-between">
            <h2 className="text-sm md:text-base font-bold text-[#B91C1C]">
              Not funded ({plan.notFundedLines.length})
            </h2>
            <span className="text-xs font-medium text-[#991B1B]">
              Outside {formatINR(budget)} budget
            </span>
          </div>
          <div className="divide-y divide-[#FEE2E2]">
            {plan.notFundedLines.map((line) => (
              <div
                key={line.item.id}
                className="p-4 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-base font-bold text-[#111814]">
                    {line.item.alias}
                  </p>
                  <p className="text-xs text-[#647068]">
                    {line.item.officialName} · {line.item.distributor}
                  </p>
                  <p className="mt-1 text-sm text-[#991B1B]">{line.reason}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-bold text-[#B91C1C] tabular-nums">
                    {formatINR(line.neededAmount)}
                  </p>
                  <p className="text-xs text-[#647068] tabular-nums">
                    {line.neededQty} units
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Don't Reorder Section */}
      {plan.dontReorderLines.length > 0 && (
        <section className="bg-white border border-[#E2E6E0] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-[#FFFBEB] border-b border-[#FDE68A] flex items-center gap-2">
            <Ban className="w-4 h-4 text-[#B45309] shrink-0" aria-hidden="true" />
            <h2 className="text-sm md:text-base font-bold text-[#92400E]">
              Don&apos;t reorder ({plan.dontReorderLines.length})
            </h2>
          </div>
          <div className="divide-y divide-[#ECEFEA]">
            {plan.dontReorderLines.map((entry) => (
              <div
                key={entry.item.id}
                className="p-4 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-base font-bold text-[#111814]">
                    {entry.item.alias}
                  </p>
                  <p className="text-xs text-[#647068]">
                    {entry.item.officialName}
                  </p>
                  <p className="mt-1 text-sm text-[#525E56]">{entry.reason}</p>
                </div>
                <span className="text-sm font-semibold text-[#5A655E] tabular-nums shrink-0">
                  {entry.metrics.totalStock} in stock
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer: Total vs Budget + Call-ready list button */}
      <section className="bg-white border-2 border-[#14532D]/20 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#5A655E]">
            Order total vs budget
          </p>
          <p className="text-xl md:text-2xl font-bold text-[#111814] tabular-nums mt-0.5">
            {formatINR(plan.activeOrderTotal)}{' '}
            <span className="text-base font-medium text-[#5A655E]">
              / {formatINR(budget)} budget
            </span>
          </p>
          <p className="text-xs text-[#525E56] mt-0.5 tabular-nums">
            {plan.approvedCount > 0
              ? `${plan.approvedCount} ${plan.approvedCount === 1 ? 'item' : 'items'} approved (${formatINR(plan.approvedOrderTotal)})`
              : 'Tap Approve on the items you want to order'}
          </p>
        </div>

        <button
          type="button"
          disabled={plan.approvedCount === 0}
          onClick={() => setShowCallReadyModal(true)}
          className={`min-h-[48px] px-5 py-3 rounded-xl font-semibold text-base flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
            plan.approvedCount > 0
              ? 'bg-[#14532D] hover:bg-[#166534] text-white'
              : 'bg-[#E2E6E0] text-[#78847C] cursor-not-allowed'
          }`}
        >
          <PhoneCall className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>Call-ready list</span>
        </button>
      </section>

      {/* Call-ready List Modal */}
      {showCallReadyModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="call-ready-title"
        >
          <div className="w-full md:max-w-lg bg-white rounded-t-3xl md:rounded-2xl max-h-[88vh] flex flex-col overflow-hidden shadow-xl">
            <div className="md:hidden w-10 h-1.5 bg-[#D4DAD2] rounded-full mx-auto mt-3 shrink-0" />

            <div className="px-5 py-4 border-b border-[#E2E6E0] flex items-center justify-between gap-3">
              <div>
                <h2
                  id="call-ready-title"
                  className="text-lg font-bold text-[#111814]"
                >
                  Call-ready list
                </h2>
                <p className="text-xs text-[#5A655E]">
                  Approved items grouped by distributor
                </p>
              </div>
              <button
                type="button"
                aria-label="Close call-ready list"
                onClick={() => setShowCallReadyModal(false)}
                className="min-h-[44px] min-w-[44px] -mr-2 rounded-xl flex items-center justify-center text-[#525E56] hover:bg-[#F2F5F0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {approvedDistributorGroups.map(([distributor, groupLines]) => (
                <div
                  key={distributor}
                  className="border border-[#E2E6E0] rounded-xl overflow-hidden"
                >
                  <div className="px-4 py-2.5 bg-[#F2F5F0] border-b border-[#E2E6E0]">
                    <h3 className="text-sm font-bold text-[#111814]">
                      {distributor}
                    </h3>
                  </div>
                  <ul className="divide-y divide-[#ECEFEA]">
                    {groupLines.map((l) => (
                      <li
                        key={l.item.id}
                        className="px-4 py-3 flex items-center justify-between gap-3"
                      >
                        <span className="text-base font-bold text-[#111814]">
                          {l.item.alias}{' '}
                          <span className="font-normal text-[#525E56]">
                            ({distributor})
                          </span>
                        </span>
                        <span className="text-base font-bold text-[#14532D] tabular-nums shrink-0">
                          {l.qty} units
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="flex items-center justify-between text-sm font-bold text-[#111814] pt-1">
                <span>Approved total</span>
                <span className="tabular-nums">
                  {formatINR(plan.approvedOrderTotal)}
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-[#E2E6E0] bg-[#F7F8F6]">
              <button
                type="button"
                onClick={handleCopyWhatsApp}
                className="w-full min-h-[52px] rounded-xl bg-[#14532D] hover:bg-[#166534] text-white font-semibold text-base flex items-center justify-center gap-2"
              >
                {copiedWhatsApp ? (
                  <>
                    <Check className="w-5 h-5" aria-hidden="true" />
                    <span>Copied for WhatsApp</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" aria-hidden="true" />
                    <span>Copy for WhatsApp</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
