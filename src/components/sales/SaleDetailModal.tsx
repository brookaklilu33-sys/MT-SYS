import React, { useState } from 'react';
import {
  X,
  Edit2,
  Save,
  Plus,
  Eye,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { Sale, BankDeposit } from '../../types';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { ImageModal } from '../common/ImageModal';
import { formatCurrency } from '../../services/calculations';
import { getTranslation } from '../../services/i18n';

interface SaleDetailModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SaleDetailModal: React.FC<SaleDetailModalProps> = ({ sale, isOpen, onClose }) => {
  const { updateSale } = useShop();
  const { userProfile, isSuperAdmin, language } = useAuth();
  const t = getTranslation(language);

  const [isEditing, setIsEditing] = useState(false);
  const [salesAmount, setSalesAmount] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [salesDate, setSalesDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // New deposit slip addition state
  const [isAddingDeposit, setIsAddingDeposit] = useState(false);
  const [newDepositAmount, setNewDepositAmount] = useState('');
  const [newDepositBank, setNewDepositBank] = useState('Commercial Bank of Ethiopia (CBE)');
  const [newDepositRef, setNewDepositRef] = useState('');
  const [newDepositImg, setNewDepositImg] = useState('');

  // Image preview state
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  if (!isOpen || !sale) return null;

  const startEdit = () => {
    setSalesAmount(sale.salesAmount.toString());
    setInvoiceNumber(sale.invoiceNumber);
    setSalesDate(sale.salesDate);
    setNotes(sale.notes || '');
    setCorrectionReason('');
    setErrorMessage('');
    setIsEditing(true);
  };

  const handleSaveCorrection = async () => {
    if (!correctionReason.trim()) {
      setErrorMessage('A mandatory correction reason is required to maintain audit compliance.');
      return;
    }
    const amountNum = parseFloat(salesAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage('Please provide a valid sales amount.');
      return;
    }

    setIsSaving(true);
    try {
      await updateSale(
        sale.id,
        {
          salesAmount: amountNum,
          unitPrice: amountNum,
          invoiceNumber: invoiceNumber.trim(),
          salesDate,
          notes: notes.trim() || undefined
        },
        correctionReason.trim()
      );
      setIsEditing(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update sale.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDeposit = async () => {
    const amount = parseFloat(newDepositAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid deposit amount');
      return;
    }

    const newDep: BankDeposit = {
      id: `dep-${Date.now()}`,
      depositDate: new Date().toISOString().split('T')[0],
      amount,
      bankName: newDepositBank,
      refNumber: newDepositRef || undefined,
      imageUrl: newDepositImg || undefined,
      uploadedAt: new Date().toISOString(),
      uploadedBy: userProfile?.displayName
    };

    const updatedDeposits = [...(sale.bankDeposits || []), newDep];

    await updateSale(
      sale.id,
      {
        bankDeposits: updatedDeposits
      },
      `Attached bank deposit receipt for ETB ${amount.toLocaleString()}`
    );

    setIsAddingDeposit(false);
    setNewDepositAmount('');
    setNewDepositRef('');
    setNewDepositImg('');
  };

  const handleDepositFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewDepositImg(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-[#E8EDF2] flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#E8EDF2] bg-[#F7FAFD] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-white border border-[#E8EDF2] text-[#202B38] font-bold">
                #{sale.invoiceNumber}
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[#202B38]">Transaction Details & Evidence</h2>
                <p className="text-xs text-[#778493]">{sale.shopName || sale.shopId}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  onClick={startEdit}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border border-[#E8EDF2] bg-white hover:bg-[#EAF4FC] text-[#2878B9] flex items-center gap-1 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Correct Entry</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-[#778493] hover:text-[#202B38] hover:bg-[#EAF4FC] rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-5">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Financial Overview Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#EAF4FC]/50 border border-[#DCEEFF]">
                <span className="text-[11px] text-[#778493] block">{t.colAmount}</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={salesAmount}
                    onChange={(e) => setSalesAmount(e.target.value)}
                    className="w-full text-base font-bold text-[#202B38] p-1 border rounded bg-white mt-1"
                  />
                ) : (
                  <span className="text-base font-bold text-[#2878B9]">
                    {formatCurrency(sale.salesAmount)}
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#E8EDF2]">
                <span className="text-[11px] text-[#778493] block">{t.totalDeposited}</span>
                <span className="text-base font-bold text-[#202B38]">
                  {formatCurrency(sale.totalDeposited)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#E8EDF2]">
                <span className="text-[11px] text-[#778493] block">{t.variance}</span>
                <span
                  className={`text-base font-bold ${
                    sale.depositDifference === 0
                      ? 'text-emerald-600'
                      : sale.depositDifference > 0
                      ? 'text-amber-600'
                      : 'text-blue-600'
                  }`}
                >
                  {sale.depositDifference === 0 ? t.fullyReconciled : formatCurrency(sale.depositDifference)}
                </span>
              </div>
            </div>

            {/* Correction Form Mode */}
            {isEditing && (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
                  <AlertCircle className="w-4 h-4" />
                  <span>Audit Trail Correction Mode</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[#778493] mb-1">{t.invoiceRefLabel}</label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full p-2 bg-white border border-[#E8EDF2] rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#778493] mb-1">{t.salesDateLabel}</label>
                    <input
                      type="date"
                      value={salesDate}
                      onChange={(e) => setSalesDate(e.target.value)}
                      className="w-full p-2 bg-white border border-[#E8EDF2] rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202B38] mb-1">
                    Mandatory Correction Reason *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Explain why this record is being corrected (e.g. Encoding mistake on paper slip)..."
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-amber-300 rounded-lg focus:outline-hidden"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-lg border border-[#E8EDF2] bg-white text-xs text-[#778493]"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveCorrection}
                    className="px-4 py-1.5 rounded-lg bg-[#2878B9] hover:bg-[#1e6197] text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Correction'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* General Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-y border-[#E8EDF2] py-3">
              <div>
                <span className="text-[#778493] block">{t.colProduct}</span>
                <span className="font-medium text-[#202B38]">{sale.productName || 'FLOAT'}</span>
              </div>
              <div>
                <span className="text-[#778493] block">{t.colDistrict}</span>
                <span className="font-medium text-[#202B38]">{sale.districtName || 'General'}</span>
              </div>
              <div>
                <span className="text-[#778493] block">{t.salesDateLabel}</span>
                <span className="font-medium text-[#202B38]">{sale.salesDate}</span>
              </div>
              <div>
                <span className="text-[#778493] block">{t.colStatus}</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                    sale.status === 'reconciled'
                      ? 'bg-emerald-100 text-emerald-800'
                      : sale.status === 'partial'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {sale.status === 'reconciled' ? t.fullyReconciled : sale.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Sales Invoice Attached Evidence */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-[#202B38]">{t.salesInvoicePhoto}</h4>
                <span className="text-[11px] text-[#778493]">
                  {sale.invoiceImages?.length || 0} page(s)
                </span>
              </div>

              {sale.invoiceImages && sale.invoiceImages.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {sale.invoiceImages.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setPreviewImage(img);
                        setPreviewTitle(`Sales Invoice #${sale.invoiceNumber} - Page ${i + 1}`);
                      }}
                      className="group relative cursor-pointer w-24 h-24 rounded-lg overflow-hidden border border-[#E8EDF2] bg-slate-50 hover:shadow-md transition-shadow"
                    >
                      <img src={img} alt="Invoice" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-dashed border-[#E8EDF2] text-xs text-[#778493] text-center">
                  No sales invoice photograph attached.
                </div>
              )}
            </div>

            {/* Bank Deposit Receipts Collection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-xs font-semibold text-[#202B38]">{t.bankDepositReceipts}</h4>
                  <span className="text-[11px] text-[#778493]">
                    {sale.bankDeposits?.length || 0} associated deposit slip(s)
                  </span>
                </div>
                {!isAddingDeposit && (
                  <button
                    type="button"
                    onClick={() => setIsAddingDeposit(true)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#2878B9] text-white hover:bg-[#1e6197] font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{t.addDeposit}</span>
                  </button>
                )}
              </div>

              {/* Add deposit slip form */}
              {isAddingDeposit && (
                <div className="p-3 bg-[#EAF4FC]/30 rounded-xl border border-[#DCEEFF] space-y-2.5 text-xs mb-3">
                  <div className="font-semibold text-[#202B38]">New Bank Deposit Slip</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#778493] block">{t.bankChannel}</label>
                      <select
                        value={newDepositBank}
                        onChange={(e) => setNewDepositBank(e.target.value)}
                        className="w-full p-1.5 border border-[#E8EDF2] rounded bg-white text-xs"
                      >
                        <option value="Commercial Bank of Ethiopia (CBE)">CBE</option>
                        <option value="Telebirr / Ethio Telecom">Telebirr</option>
                        <option value="Awash Bank">Awash Bank</option>
                        <option value="Dashen Bank">Dashen Bank</option>
                        <option value="Bank of Abyssinia">Bank of Abyssinia</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#778493] block">{t.amountDeposited}</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={newDepositAmount}
                        onChange={(e) => setNewDepositAmount(e.target.value)}
                        className="w-full p-1.5 border border-[#E8EDF2] rounded bg-white text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#778493] block">{t.refTxId}</label>
                      <input
                        type="text"
                        placeholder="e.g. CBE-99824"
                        value={newDepositRef}
                        onChange={(e) => setNewDepositRef(e.target.value)}
                        className="w-full p-1.5 border border-[#E8EDF2] rounded bg-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#778493] block">{t.depositPhoto}</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleDepositFileUpload}
                        className="w-full text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingDeposit(false)}
                      className="px-2.5 py-1 text-xs text-[#778493] border rounded bg-white"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={handleAddDeposit}
                      className="px-3 py-1 text-xs font-medium bg-[#2878B9] text-white rounded"
                    >
                      Save Deposit
                    </button>
                  </div>
                </div>
              )}

              {/* Deposit Items List */}
              {sale.bankDeposits && sale.bankDeposits.length > 0 ? (
                <div className="space-y-2">
                  {sale.bankDeposits.map((dep, idx) => (
                    <div
                      key={dep.id || idx}
                      className="flex items-center justify-between p-3 rounded-lg border border-[#E8EDF2] bg-[#F7FAFD] text-xs"
                    >
                      <div className="flex items-center gap-3">
                        {dep.imageUrl ? (
                          <div
                            onClick={() => {
                              setPreviewImage(dep.imageUrl!);
                              setPreviewTitle(`${dep.bankName} - ETB ${dep.amount.toLocaleString()}`);
                            }}
                            className="w-10 h-10 rounded border border-[#E8EDF2] overflow-hidden shrink-0 cursor-pointer"
                          >
                            <img src={dep.imageUrl} alt="Deposit" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded bg-[#EAF4FC] text-[#2878B9] flex items-center justify-center shrink-0">
                            <DollarSign className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-[#202B38] block">{dep.bankName}</span>
                          <span className="text-[11px] text-[#778493]">
                            {dep.depositDate} {dep.refNumber ? `• Ref: ${dep.refNumber}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-[#202B38] block">
                          {formatCurrency(dep.amount)}
                        </span>
                        {dep.uploadedBy && (
                          <span className="text-[10px] text-[#778493] block">by {dep.uploadedBy}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-dashed border-[#E8EDF2] text-xs text-[#778493] text-center">
                  {t.noDepositsYet}
                </div>
              )}
            </div>

            {/* Audit & Encoder Meta */}
            <div className="p-3 rounded-xl bg-[#F7FAFD] border border-[#E8EDF2] text-[11px] text-[#778493] space-y-1">
              <div className="flex justify-between">
                <span>{t.colEncoder}:</span>
                <span className="font-medium text-[#202B38]">{sale.createdByName || sale.createdBy}</span>
              </div>
              <div className="flex justify-between">
                <span>Created at:</span>
                <span>{new Date(sale.createdAt).toLocaleString()}</span>
              </div>
              {sale.updatedBy && (
                <div className="flex justify-between border-t border-[#E8EDF2] pt-1">
                  <span>{t.colLastUpdated}:</span>
                  <span className="font-medium text-[#202B38]">{sale.updatedBy}</span>
                </div>
              )}
              {sale.correctionReason && (
                <div className="border-t border-[#E8EDF2] pt-1">
                  <span className="font-semibold text-[#202B38]">Correction Note: </span>
                  <span className="italic">{sale.correctionReason}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox for receipt photos */}
      <ImageModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage || ''}
        title={previewTitle}
      />
    </>
  );
};

