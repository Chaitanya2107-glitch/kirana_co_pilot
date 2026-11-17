/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { BottomNav, TopHeader } from './components/BottomNav';
import { CashKhataTab } from './components/CashKhataTab';
import { DeliveryTab } from './components/DeliveryTab';
import { HomeTab } from './components/HomeTab';
import { ReorderTab } from './components/ReorderTab';
import { StockTab } from './components/StockTab';
import {
  createInitialItems,
  getTodayDateString,
  INITIAL_BUDGET,
  INITIAL_KHATA_CUSTOMERS,
} from './data/initialData';
import {
  Batch,
  InventoryItem,
  KhataCustomer,
  KhataTag,
  ReorderLineActionState,
  TabId,
} from './types';
import {
  buildReorderPlan,
  computeItemMetrics,
  getAtRiskItems,
} from './utils/kiranaRules';

export default function App() {
  const [today] = useState<string>(() => getTodayDateString());
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [stockRiskFocusTrigger, setStockRiskFocusTrigger] = useState(false);

  const [items, setItems] = useState<InventoryItem[]>(() =>
    createInitialItems(getTodayDateString())
  );
  const [budget, setBudget] = useState<number>(INITIAL_BUDGET);
  const [khataCustomers, setKhataCustomers] = useState<KhataCustomer[]>(
    INITIAL_KHATA_CUSTOMERS
  );
  const [reorderActionStates, setReorderActionStates] = useState<
    Record<string, ReorderLineActionState>
  >({});
  const [reorderQtyOverrides, setReorderQtyOverrides] = useState<
    Record<string, number>
  >({});

  const allMetrics = useMemo(
    () => items.map((item) => computeItemMetrics(item, today)),
    [items, today]
  );

  const atRiskItems = useMemo(() => getAtRiskItems(allMetrics), [allMetrics]);

  const stuckRupees = useMemo(
    () => atRiskItems.reduce((sum, entry) => sum + entry.atRiskRupees, 0),
    [atRiskItems]
  );

  const lowItemsCount = useMemo(
    () => allMetrics.filter((m) => m.isLow).length,
    [allMetrics]
  );

  const reorderPlan = useMemo(
    () =>
      buildReorderPlan(
        allMetrics,
        budget,
        reorderActionStates,
        reorderQtyOverrides
      ),
    [allMetrics, budget, reorderActionStates, reorderQtyOverrides]
  );

  const handleRenameAlias = (itemId: string, newAlias: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, alias: newAlias } : item
      )
    );
  };

  const handleSaveWeeklyCount = (counts: Record<string, number>) => {
    setItems((prev) =>
      prev.map((item) => {
        const targetCount = counts[item.id];
        if (targetCount === undefined) return item;
        const currentTotal = item.batches.reduce((sum, b) => sum + b.qty, 0);
        if (targetCount === currentTotal) return item;

        if (targetCount < currentTotal) {
          // Deduct from oldest batches first (FIFO)
          const sortedOldestFirst = [...item.batches].sort((a, b) =>
            a.boughtDate.localeCompare(b.boughtDate)
          );
          let toDeduct = currentTotal - targetCount;
          const updatedBatches: Batch[] = [];
          for (const batch of sortedOldestFirst) {
            if (toDeduct <= 0) {
              updatedBatches.push(batch);
            } else if (batch.qty <= toDeduct) {
              toDeduct -= batch.qty;
            } else {
              updatedBatches.push({ ...batch, qty: batch.qty - toDeduct });
              toDeduct = 0;
            }
          }
          return { ...item, batches: updatedBatches };
        } else {
          // Stock increased: add difference to newest batch or create a batch dated today
          const diff = targetCount - currentTotal;
          if (item.batches.length === 0) {
            return {
              ...item,
              batches: [
                {
                  id: `${item.id}-${Date.now()}`,
                  qty: diff,
                  boughtDate: today,
                  buyPrice: item.buyPrice,
                },
              ],
            };
          }
          const sortedNewestFirst = [...item.batches].sort((a, b) =>
            b.boughtDate.localeCompare(a.boughtDate)
          );
          const newestId = sortedNewestFirst[0].id;
          return {
            ...item,
            batches: item.batches.map((b) =>
              b.id === newestId ? { ...b, qty: b.qty + diff } : b
            ),
          };
        }
      })
    );
  };

  const handleAddDelivery = (
    itemId: string,
    qty: number,
    buyPrice: number,
    boughtDate: string
  ) => {
    const targetItem = items.find((i) => i.id === itemId);
    const olderUnitsRemaining = targetItem
      ? targetItem.batches
          .filter((b) => b.qty > 0)
          .reduce((sum, b) => sum + b.qty, 0)
      : 0;

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const newBatch: Batch = {
          id: `${item.id}-del-${Date.now()}`,
          qty,
          boughtDate,
          buyPrice,
        };
        return {
          ...item,
          buyPrice,
          batches: [...item.batches, newBatch],
        };
      })
    );

    return {
      olderUnitsRemaining,
      itemAlias: targetItem?.alias ?? '',
    };
  };

  const handleSetReorderActionState = (
    itemId: string,
    state: ReorderLineActionState
  ) => {
    setReorderActionStates((prev) => ({
      ...prev,
      [itemId]: state,
    }));
  };

  const handleUpdateQtyOverride = (itemId: string, qty: number) => {
    setReorderQtyOverrides((prev) => ({
      ...prev,
      [itemId]: qty,
    }));
  };

  const handleResetQtyOverride = (itemId: string) => {
    setReorderQtyOverrides((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const handleUpdateCustomerTag = (customerId: string, tag: KhataTag) => {
    setKhataCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, tag } : c))
    );
  };

  const handleSelectTab = (tab: TabId) => {
    setStockRiskFocusTrigger(false);
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-[#F6F7F4] text-[#111814] flex flex-col">
      <TopHeader
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        lowCount={lowItemsCount}
        atRiskCount={atRiskItems.length}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-24 md:pb-10">
        {activeTab === 'home' && (
          <HomeTab
            stuckRupees={stuckRupees}
            atRiskCount={atRiskItems.length}
            lowItemsCount={lowItemsCount}
            budget={budget}
            onUpdateBudget={setBudget}
            onGoToStockRisk={() => {
              setStockRiskFocusTrigger(true);
              setActiveTab('stock');
            }}
            onGoToReorder={() => setActiveTab('reorder')}
          />
        )}

        {activeTab === 'stock' && (
          <StockTab
            allMetrics={allMetrics}
            atRiskItems={atRiskItems}
            onRenameAlias={handleRenameAlias}
            onSaveWeeklyCount={handleSaveWeeklyCount}
            highlightRiskOnMount={stockRiskFocusTrigger}
          />
        )}

        {activeTab === 'delivery' && (
          <DeliveryTab
            items={items}
            allMetrics={allMetrics}
            onAddDelivery={handleAddDelivery}
          />
        )}

        {activeTab === 'reorder' && (
          <ReorderTab
            plan={reorderPlan}
            budget={budget}
            onSetActionState={handleSetReorderActionState}
            onUpdateQtyOverride={handleUpdateQtyOverride}
            onResetQtyOverride={handleResetQtyOverride}
          />
        )}

        {activeTab === 'cash' && (
          <CashKhataTab
            customers={khataCustomers}
            orderTotal={reorderPlan.activeOrderTotal}
            onUpdateCustomerTag={handleUpdateCustomerTag}
          />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        lowCount={lowItemsCount}
        atRiskCount={atRiskItems.length}
      />
    </div>
  );
}
