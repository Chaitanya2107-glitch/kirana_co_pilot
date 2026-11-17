import { parseLocalDate } from '../data/initialData';
import {
  AtRiskItem,
  BatchRiskInfo,
  DontReorderLine,
  InventoryItem,
  ItemMetrics,
  ItemStatus,
  KhataCustomer,
  NotFundedLine,
  ReorderLine,
  ReorderLineActionState,
  ReorderPlan,
  SuggestedAction,
} from '../types';

export function formatINR(amount: number): string {
  const rounded = Math.round(amount);
  const absFormatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.abs(rounded));
  return rounded < 0 ? `-₹${absFormatted}` : `₹${absFormatted}`;
}

export function formatDays(days: number): string {
  if (!Number.isFinite(days)) return '0 days';
  const rounded = Math.round(days * 10) / 10;
  const display = Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
  return `${display} ${rounded === 1 ? 'day' : 'days'}`;
}

export function formatShortDate(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export function getBatchAgeDays(boughtDate: string, todayStr: string): number {
  const bought = parseLocalDate(boughtDate);
  const today = parseLocalDate(todayStr);
  const diffMs = today.getTime() - bought.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

export function computeItemMetrics(item: InventoryItem, todayStr: string): ItemMetrics {
  const activeBatches = item.batches.filter((b) => b.qty > 0);
  const totalStock = activeBatches.reduce((sum, b) => sum + b.qty, 0);
  const daysLeft = item.dailySales > 0 ? totalStock / item.dailySales : Infinity;
  const isLow = daysLeft < 4;

  const batchDetails: BatchRiskInfo[] = activeBatches
    .map((batch) => {
      const ageDays = getBatchAgeDays(batch.boughtDate, todayStr);
      const remainingShelfLifeDays = Math.max(0, item.shelfLifeDays - ageDays);
      const isOverSixtyPercentAge = ageDays > 0.6 * item.shelfLifeDays;
      const isAtRisk = isOverSixtyPercentAge && daysLeft > remainingShelfLifeDays;
      const rupeesAtRisk = isAtRisk ? batch.qty * batch.buyPrice : 0;
      return {
        batch,
        ageDays,
        remainingShelfLifeDays,
        isAtRisk,
        rupeesAtRisk,
      };
    })
    .sort((a, b) => b.ageDays - a.ageDays);

  const atRiskBatches = batchDetails.filter((b) => b.isAtRisk);
  const hasAtRiskBatch = atRiskBatches.length > 0;
  const atRiskUnits = atRiskBatches.reduce((sum, b) => sum + b.batch.qty, 0);
  const atRiskRupees = atRiskBatches.reduce((sum, b) => sum + b.rupeesAtRisk, 0);

  let status: ItemStatus = 'OK';
  if (isLow) {
    status = 'Low';
  } else if (hasAtRiskBatch) {
    status = 'Old stock';
  }

  // Don't-reorder rule:
  // Skip an item if its old units alone cover the time until their expiry
  // (old units / daily sales >= days left in shelf life) OR its total days left is above 14.
  const oldBatches = batchDetails.filter((b) => b.ageDays > 0.6 * item.shelfLifeDays);
  const oldUnitsCount = oldBatches.reduce((sum, b) => sum + b.batch.qty, 0);
  const oldestOldBatch = oldBatches[0];

  let dontReorderReason: string | null = null;
  if (
    oldestOldBatch &&
    item.dailySales > 0 &&
    oldUnitsCount / item.dailySales >= oldestOldBatch.remainingShelfLifeDays
  ) {
    const coverDays = Math.round(oldUnitsCount / item.dailySales);
    dontReorderReason = `${oldUnitsCount} old units cover the next ${coverDays} days (before expiry in ${oldestOldBatch.remainingShelfLifeDays} days)`;
  } else if (daysLeft > 14) {
    const roundedTotalDays = Math.round(daysLeft);
    if (oldUnitsCount > 0) {
      dontReorderReason = `${oldUnitsCount} old units + ${totalStock - oldUnitsCount} newer units cover the next ${roundedTotalDays} days`;
    } else {
      dontReorderReason = `${totalStock} units cover the next ${roundedTotalDays} days (over 14 days)`;
    }
  }

  return {
    item,
    totalStock,
    daysLeft,
    isLow,
    hasAtRiskBatch,
    atRiskUnits,
    atRiskRupees,
    status,
    batchDetails,
    dontReorderReason,
  };
}

export function getAtRiskItems(allMetrics: ItemMetrics[]): AtRiskItem[] {
  const results: AtRiskItem[] = [];

  for (const m of allMetrics) {
    if (!m.hasAtRiskBatch || m.atRiskRupees <= 0) continue;
    const atRiskBatches = m.batchDetails.filter((b) => b.isAtRisk);
    const oldestRiskBatch = atRiskBatches[0];
    const hasNewerBatch = m.batchDetails.some((b) => !b.isAtRisk);

    let suggestedAction: SuggestedAction = 'Put in front';
    if (m.atRiskRupees >= 500 && m.item.dailySales < 1) {
      suggestedAction = 'Small discount';
    } else if (!hasNewerBatch || oldestRiskBatch.remainingShelfLifeDays <= 30) {
      suggestedAction = 'Bundle';
    }
    // If newer stock sits beside older stock, putting older units in front is critical;
    // when excess value is high & velocity is slow, small discount or bundle moves it faster.
    if (hasNewerBatch && m.atRiskRupees < 500) {
      suggestedAction = 'Put in front';
    }

    const reason = `${m.atRiskUnits} old units expire in ${oldestRiskBatch.remainingShelfLifeDays} days, but current stock lasts ${Math.round(m.daysLeft)} days at ${m.item.dailySales}/day`;

    results.push({
      item: m.item,
      totalStock: m.totalStock,
      daysLeft: m.daysLeft,
      atRiskUnits: m.atRiskUnits,
      atRiskRupees: m.atRiskRupees,
      oldestRiskBatch,
      suggestedAction,
      reason,
    });
  }

  return results.sort((a, b) => b.atRiskRupees - a.atRiskRupees);
}

export function buildReorderPlan(
  allMetrics: ItemMetrics[],
  budget: number,
  actionStates: Record<string, ReorderLineActionState>,
  qtyOverrides: Record<string, number>
): ReorderPlan {
  const dontReorderLines: DontReorderLine[] = [];
  const eligibleLow: ItemMetrics[] = [];

  for (const m of allMetrics) {
    if (m.dontReorderReason) {
      dontReorderLines.push({
        item: m.item,
        metrics: m,
        reason: m.dontReorderReason,
      });
    } else if (m.isLow) {
      eligibleLow.push(m);
    }
  }

  // Rank Low items by days left (lowest first)
  eligibleLow.sort((a, b) => a.daysLeft - b.daysLeft);

  const fundedLines: ReorderLine[] = [];
  const notFundedLines: NotFundedLine[] = [];
  let remainingBudget = Math.max(0, budget);

  for (const m of eligibleLow) {
    const suggestedQty = Math.max(1, Math.ceil(7 * m.item.dailySales - m.totalStock));
    const unitPrice = m.item.buyPrice;
    const actionState = actionStates[m.item.id] ?? 'pending';
    const manualQty = qtyOverrides[m.item.id];
    const isEdited = manualQty !== undefined;

    if (actionState === 'skipped') {
      // Skipped lines don't consume budget so remaining budget can flow or stay clear
      const displayQty = isEdited ? Math.max(1, manualQty) : suggestedQty;
      fundedLines.push({
        item: m.item,
        metrics: m,
        suggestedQty,
        qty: displayQty,
        amount: displayQty * unitPrice,
        reducedToFitBudget: false,
        reason: `Sells ~${m.item.dailySales}/day, ${formatDays(m.daysLeft)} left`,
        actionState,
        isEdited,
      });
      continue;
    }

    const desiredQty = isEdited ? Math.max(1, manualQty) : suggestedQty;
    const desiredAmount = desiredQty * unitPrice;

    if (desiredAmount <= remainingBudget) {
      fundedLines.push({
        item: m.item,
        metrics: m,
        suggestedQty,
        qty: desiredQty,
        amount: desiredAmount,
        reducedToFitBudget: false,
        reason: `Sells ~${m.item.dailySales}/day, ${formatDays(m.daysLeft)} left`,
        actionState,
        isEdited,
      });
      remainingBudget -= desiredAmount;
    } else {
      const affordableQty = unitPrice > 0 ? Math.floor(remainingBudget / unitPrice) : 0;
      if (affordableQty >= 1) {
        const reducedAmount = affordableQty * unitPrice;
        fundedLines.push({
          item: m.item,
          metrics: m,
          suggestedQty,
          qty: affordableQty,
          amount: reducedAmount,
          reducedToFitBudget: true,
          reason: `Sells ~${m.item.dailySales}/day, ${formatDays(m.daysLeft)} left · Reduced to fit budget`,
          actionState,
          isEdited,
        });
        remainingBudget -= reducedAmount;
      } else {
        notFundedLines.push({
          item: m.item,
          metrics: m,
          neededQty: desiredQty,
          neededAmount: desiredAmount,
          reason: `Sells ~${m.item.dailySales}/day, ${formatDays(m.daysLeft)} left · Needs ${formatINR(desiredAmount)}`,
        });
      }
    }
  }

  const activeLines = fundedLines.filter((l) => l.actionState !== 'skipped');
  const approvedLines = fundedLines.filter((l) => l.actionState === 'approved');

  const activeOrderTotal = activeLines.reduce((sum, l) => sum + l.amount, 0);
  const approvedOrderTotal = approvedLines.reduce((sum, l) => sum + l.amount, 0);

  return {
    fundedLines,
    notFundedLines,
    dontReorderLines,
    activeOrderTotal,
    approvedOrderTotal,
    approvedCount: approvedLines.length,
    remainingBudget,
  };
}

export function computeCashSummary(
  cashPosition: number,
  customers: KhataCustomer[],
  orderTotal: number
) {
  const totalKhata = customers.reduce((sum, c) => sum + c.amount, 0);
  const delayedShare = customers
    .filter((c) => c.tag === 'Usually late' || c.tag === 'Uncertain')
    .reduce((sum, c) => sum + c.amount, 0);
  const safeToSpend = cashPosition - delayedShare;
  const isBelowOrderTotal = safeToSpend < orderTotal;

  return {
    totalKhata,
    delayedShare,
    safeToSpend,
    isBelowOrderTotal,
  };
}
