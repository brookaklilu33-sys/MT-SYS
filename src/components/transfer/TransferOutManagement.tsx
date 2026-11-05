import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Plus,
  Edit2,
  Building,
  Calendar,
  Layers,
  ShieldAlert
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../services/calculations';
import { getTranslation } from '../../services/i18n';
import { TransferOut } from '../../types';

export const TransferOutManagement: React.FC = () => {
  const { isSuperAdmin, language } = useAuth();
  const t = getTranslation(language);

  const {
    shops,
    districts,
    products,
    transferOuts,
    addTransferOut,
    updateTransferOut,
    currentMonthKey
  } = useShop();

  const [selectedShopId, setSelectedShopId] = useState<string>('adama_main');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('float');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [refNumber, setRefNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Editing state
  const [editingTransfer, setEditingTransfer] = useState<TransferOut | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editRef, setEditRef] = useState('');
  const [editReason, setEditReason] = useState('');

  if (!isSuperAdmin) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto">
        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-3" />
        <h2 className="text-base font-bold text-red-900">Access Restricted</h2>
        <p className="text-xs text-red-700 mt-1">
          Transfer Out management is strictly restricted to Moderntech Superadmins.
        </p>
      </div>
    );
  }

  const shopDistricts = districts.filter((d) => d.shopId === selectedShopId && d.status === 'active');

  const ADAMA_BRANCHES = ['adama', 'hawassa', 'borena', 'bale', 'assela'];

  const filteredTransfers = transferOuts.filter((tItem) => {
    if (selectedShopId === 'adama_main') {
      return (tItem.shopId === 'adama_main' || ADAMA_BRANCHES.includes(tItem.shopId)) && tItem.monthKey === selectedMonth;
    }
    return tItem.shopId === selectedShopId && tItem.monthKey === selectedMonth;
  });

  const totalTransferred = filteredTransfers.reduce((sum, tItem) => sum + tItem.amount, 0);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid transfer amount.');
      return;
    }
    if (!refNumber.trim()) {
      setErrorMessage('Please enter a reference number (e.g. TO 1-20 or TO-ADM-01).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const shop = shops.find((s) => s.id === selectedShopId);
      const district = districts.find((d) => d.id === selectedDistrictId);
      const product = products.find((p) => p.id === selectedProductId);

      await addTransferOut({
        shopId: selectedShopId,
        shopName: shop?.name || selectedShopId,
        districtId: selectedDistrictId || undefined,
        districtName: district?.name,
        productId: selectedProductId,
        productName: product?.name || 'FLOAT',
        monthKey: selectedMonth,
        amount: numAmount,
        date,
        refNumber: refNumber.trim(),
        notes: notes.trim() || undefined,
        createdBy: 'Superadmin'
      });

      setAmount('');
      setRefNumber('');
      setNotes('');
      setSuccessMessage('Transfer Out allocated successfully in real time!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create Transfer Out.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingTransfer) return;
    if (!editReason.trim()) {
      alert('A mandatory audit reason is required.');
      return;
    }
    const num = parseFloat(editAmount);
    if (isNaN(num) || num <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    await updateTransferOut(
      editingTransfer.id,
      {
        amount: num,
        refNumber: editRef.trim()
      },
      editReason.trim()
    );

    setEditingTransfer(null);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-[#202B38]">{t.transferOut} Management</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-purple-100 text-purple-800 border border-purple-200">
              Superadmin Only
            </span>
          </div>
          <p className="text-xs text-[#778493] mt-1">
            Allocate and control Float batches transferred to Adama Main or individual branch accounts for the active reporting month.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedShopId}
            onChange={(e) => setSelectedShopId(e.target.value)}
            className="text-xs p-2 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl text-[#202B38] font-bold"
          >
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs p-2 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl text-[#202B38] font-semibold"
          >
            <option value="2026-10">October 2026</option>
            <option value="2026-11">November 2026</option>
            <option value="2026-12">December 2026</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transfer Encoding Form */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs">
          <h2 className="text-sm font-bold text-[#202B38] mb-3 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-[#2878B9]" />
            <span>Record Transfer Out Allocation</span>
          </h2>

          {errorMessage && (
            <div className="mb-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-3 p-2.5 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleCreateTransfer} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[#778493] mb-1 font-medium">Target Account *</label>
              <select
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                className="w-full p-2.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl text-[#202B38] font-bold"
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isConsolidated ? '(Regional Consolidation)' : ''}
                  </option>
                ))}
              </select>
              {selectedShopId === 'adama_main' && (
                <p className="text-[10px] text-[#2878B9] mt-1 font-medium">
                  * Allocating to Adama Main will fund the regional float pool for Adama, Hawassa, Borena, Bale, and Assela.
                </p>
              )}
            </div>

            {shopDistricts.length > 0 && (
              <div>
                <label className="block text-[#778493] mb-1 font-medium">District (Optional)</label>
                <select
                  value={selectedDistrictId}
                  onChange={(e) => setSelectedDistrictId(e.target.value)}
                  className="w-full p-2.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl text-[#202B38]"
                >
                  <option value="">General Branch Allocation</option>
                  {shopDistricts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-[#778493] mb-1 font-medium">Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full p-2.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl text-[#202B38]"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[#778493] mb-1 font-medium">Transfer Date *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl text-[#202B38]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#778493] mb-1 font-medium">Ref Number *</label>
                <input
                  type="text"
                  placeholder="e.g. TO-ADM-01"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  className="w-full p-2.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl text-[#202B38] font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[#778493] mb-1 font-medium">Transfer Amount (ETB) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-[#2878B9]">ETB</span>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-12 pr-3 py-2 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl text-[#202B38] font-bold text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[#778493] mb-1 font-medium">Notes (Optional)</label>
              <textarea
                rows={2}
                placeholder="Bank dispatch reference, authorized float batch..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl text-[#202B38]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-[#2878B9] hover:bg-[#1e6197] text-white font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>{isSubmitting ? 'Allocating...' : 'Allocate Transfer Out'}</span>
            </button>
          </form>
        </div>

        {/* Existing Transfers in Month */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-[#E8EDF2] shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs text-[#778493]">Total Transfer Out for {selectedMonth}</div>
              <div className="text-xl font-bold text-[#2878B9]">
                {formatCurrency(totalTransferred)}
              </div>
            </div>
            <div className="text-right text-xs text-[#778493]">
              <span className="font-semibold text-[#202B38]">{filteredTransfers.length}</span> batch(es) recorded
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8EDF2] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E8EDF2]">
              <h3 className="text-sm font-bold text-[#202B38]">Recorded Float Transfer Batches</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7FAFD] text-[#778493] font-medium border-b border-[#E8EDF2]">
                  <tr>
                    <th className="py-2.5 px-4">Ref Number</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Account</th>
                    <th className="py-2.5 px-4 text-right">Amount (ETB)</th>
                    <th className="py-2.5 px-4">Notes</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EDF2]">
                  {filteredTransfers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#778493]">
                        No Transfer Out records for {selectedShopId} in {selectedMonth}.
                      </td>
                    </tr>
                  ) : (
                    filteredTransfers.map((tItem) => (
                      <tr key={tItem.id} className="hover:bg-[#F7FAFD]">
                        <td className="py-3 px-4 font-mono font-bold text-[#202B38]">{tItem.refNumber}</td>
                        <td className="py-3 px-4 text-[#778493]">{tItem.date}</td>
                        <td className="py-3 px-4 text-[#202B38] font-medium">{tItem.shopName}</td>
                        <td className="py-3 px-4 text-right font-bold text-[#2878B9]">
                          {formatCurrency(tItem.amount)}
                        </td>
                        <td className="py-3 px-4 text-[#778493] truncate max-w-[150px]">
                          {tItem.notes || '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setEditingTransfer(tItem);
                              setEditAmount(tItem.amount.toString());
                              setEditRef(tItem.refNumber);
                              setEditReason('');
                            }}
                            className="p-1 text-[#2878B9] hover:bg-[#EAF4FC] rounded"
                            title="Edit with audit reason"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Transfer Dialog */}
      {editingTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3.5 border border-[#E8EDF2] shadow-xl text-xs">
            <h3 className="text-sm font-bold text-[#202B38]">Edit Transfer Out #{editingTransfer.refNumber}</h3>

            <div>
              <label className="block text-[#778493] mb-1">Ref Number</label>
              <input
                type="text"
                value={editRef}
                onChange={(e) => setEditRef(e.target.value)}
                className="w-full p-2 border rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-[#778493] mb-1">Amount (ETB)</label>
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-full p-2 border rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block text-[#778493] mb-1 font-semibold text-red-600">
                Mandatory Audit Reason *
              </label>
              <textarea
                rows={2}
                placeholder="Reason for modifying this financial transfer..."
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="w-full p-2 border border-red-300 rounded-lg"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingTransfer(null)}
                className="px-3 py-1.5 border rounded-lg text-[#778493]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                className="px-4 py-1.5 bg-[#2878B9] text-white font-semibold rounded-lg"
              >
                Save Correction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
