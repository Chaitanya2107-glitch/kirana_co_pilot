import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Truck } from 'lucide-react';
import { getTodayDateString } from '../data/initialData';
import { InventoryItem, ItemMetrics } from '../types';
import { formatINR } from '../utils/kiranaRules';

interface DeliveryTabProps {
  items: InventoryItem[];
  allMetrics: ItemMetrics[];
  onAddDelivery: (
    itemId: string,
    qty: number,
    buyPrice: number,
    boughtDate: string
  ) => { olderUnitsRemaining: number; itemAlias: string };
}

export function DeliveryTab({
  items,
  allMetrics,
  onAddDelivery,
}: DeliveryTabProps) {
  const today = getTodayDateString();
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id ?? '');
  const [qtyInput, setQtyInput] = useState<string>('10');
  const [priceInput, setPriceInput] = useState<string>(
    String(items[0]?.buyPrice ?? 0)
  );
  const [dateInput, setDateInput] = useState<string>(today);
  const [banner, setBanner] = useState<{
    olderUnits: number;
    alias: string;
    addedQty: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedItem = items.find((i) => i.id === selectedItemId) ?? items[0];
  const selectedMetrics = allMetrics.find((m) => m.item.id === selectedItemId);

  const handleSelectItem = (newId: string) => {
    setSelectedItemId(newId);
    const found = items.find((i) => i.id === newId);
    if (found) {
      setPriceInput(String(found.buyPrice));
    }
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const qty = Number(qtyInput);
    const price = Number(priceInput);

    if (!Number.isFinite(qty) || qty <= 0) {
      setErrorMsg('Enter a valid quantity (at least 1).');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setErrorMsg('Enter a valid purchase price per unit.');
      return;
    }

    setErrorMsg(null);
    const result = onAddDelivery(
      selectedItem.id,
      Math.round(qty),
      Math.round(price),
      dateInput || today
    );

    setBanner({
      olderUnits: result.olderUnitsRemaining,
      alias: result.itemAlias,
      addedQty: Math.round(qty),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#111814] tracking-tight">
          Record Delivery
        </h1>
        <p className="text-xs md:text-sm text-[#5A655E]">
          Add new stock when a distributor drops an order
        </p>
      </div>

      {/* Put-in-front Banner when older units remain */}
      {banner && banner.olderUnits > 0 && (
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
              You still have {banner.olderUnits} from the last order. Put them in front.
            </p>
            <p className="text-sm text-[#92400E] mt-0.5">
              Saved +{banner.addedQty} new units of {banner.alias}.
            </p>
          </div>
        </div>
      )}

      {/* Normal confirmation if no older units remained */}
      {banner && banner.olderUnits === 0 && (
        <div
          role="status"
          className="rounded-2xl bg-[#ECFDF5] border border-[#BBF7D0] p-4 flex items-center gap-3"
        >
          <CheckCircle2
            className="w-6 h-6 text-[#15803D] shrink-0"
            aria-hidden="true"
          />
          <p className="text-base font-bold text-[#14532D]">
            Saved +{banner.addedQty} units of {banner.alias}.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white border border-[#E2E6E0] rounded-2xl p-5 space-y-4"
        >
          {/* Pick item */}
          <div>
            <label
              htmlFor="delivery-item"
              className="block text-sm font-bold text-[#111814] mb-1.5"
            >
              Item
            </label>
            <select
              id="delivery-item"
              value={selectedItemId}
              onChange={(e) => handleSelectItem(e.target.value)}
              className="w-full min-h-[48px] px-3.5 rounded-xl border border-[#CBD2C9] bg-white text-base font-semibold text-[#111814] focus:border-[#14532D] focus:outline-none"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.alias} ({item.officialName})
                </option>
              ))}
            </select>
            {selectedItem && (
              <p className="mt-1 text-xs text-[#647068]">
                {selectedItem.officialName} · {selectedItem.distributor}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Quantity */}
            <div>
              <label
                htmlFor="delivery-qty"
                className="block text-sm font-bold text-[#111814] mb-1.5"
              >
                Quantity received
              </label>
              <input
                id="delivery-qty"
                type="number"
                inputMode="numeric"
                min={1}
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                className="w-full min-h-[48px] px-3.5 rounded-xl border border-[#CBD2C9] bg-white text-base font-bold text-[#111814] tabular-nums focus:border-[#14532D] focus:outline-none"
              />
            </div>

            {/* Purchase price per unit */}
            <div>
              <label
                htmlFor="delivery-price"
                className="block text-sm font-bold text-[#111814] mb-1.5"
              >
                Purchase price per unit (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-[#525E56]">
                  ₹
                </span>
                <input
                  id="delivery-price"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="w-full min-h-[48px] pl-8 pr-3.5 rounded-xl border border-[#CBD2C9] bg-white text-base font-bold text-[#111814] tabular-nums focus:border-[#14532D] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Date */}
          <div>
            <label
              htmlFor="delivery-date"
              className="block text-sm font-bold text-[#111814] mb-1.5"
            >
              Delivery date
            </label>
            <input
              id="delivery-date"
              type="date"
              value={dateInput}
              max={today}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-full min-h-[48px] px-3.5 rounded-xl border border-[#CBD2C9] bg-white text-base font-medium text-[#111814] focus:border-[#14532D] focus:outline-none"
            />
          </div>

          {errorMsg && (
            <p className="text-sm font-semibold text-[#B91C1C]" role="alert">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="w-full min-h-[52px] px-5 rounded-xl bg-[#14532D] hover:bg-[#166534] active:scale-[0.99] text-white font-semibold text-base flex items-center justify-center gap-2 transition-colors"
          >
            <Truck className="w-5 h-5" aria-hidden="true" />
            <span>Save delivery</span>
          </button>
        </form>

        {/* Current shelf check helper */}
        {selectedMetrics && (
          <aside className="lg:col-span-5 bg-white border border-[#E2E6E0] rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-[#111814]">
              Currently in shop: {selectedMetrics.item.alias}
            </h2>
            <p className="text-xs text-[#647068]">
              {selectedMetrics.item.officialName}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-[#F7F8F6] rounded-xl p-3">
                <p className="text-xs text-[#5A655E]">Existing stock</p>
                <p className="text-xl font-bold text-[#111814] tabular-nums mt-0.5">
                  {selectedMetrics.totalStock} units
                </p>
              </div>
              <div className="bg-[#F7F8F6] rounded-xl p-3">
                <p className="text-xs text-[#5A655E]">Last buy price</p>
                <p className="text-xl font-bold text-[#111814] tabular-nums mt-0.5">
                  {formatINR(selectedMetrics.item.buyPrice)}
                </p>
              </div>
            </div>

            {selectedMetrics.totalStock > 0 && (
              <p className="text-sm text-[#525E56]">
                If you add a new batch today, remember to keep existing{' '}
                <span className="font-bold text-[#111814]">
                  {selectedMetrics.totalStock} units
                </span>{' '}
                in front on the shelf.
              </p>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
