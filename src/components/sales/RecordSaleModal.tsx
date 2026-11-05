import React, { useState } from 'react';
import {
  X,
  Camera,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { BankDeposit } from '../../types';
import { getTranslation } from '../../services/i18n';

interface RecordSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecordSaleModal: React.FC<RecordSaleModalProps> = ({ isOpen, onClose }) => {
  const { currentShopId, shops, activeDistricts, products, addSale } = useShop();
  const { userProfile, isSuperAdmin, language } = useAuth();
  const t = getTranslation(language);

  // Filter only operational shops (excluding consolidated Adama Main & All)
  const operationalShops = shops.filter((s) => !s.isConsolidated);
  const initialShopId =
    currentShopId === 'all' || currentShopId === 'adama_main'
      ? userProfile?.shopIds.find((id) => id !== 'all' && id !== 'adama_main') || operationalShops[0]?.id || 'jemo'
      : currentShopId;

  const [selectedShopId, setSelectedShopId] = useState<string>(initialShopId);
  const currentShop = shops.find((s) => s.id === selectedShopId);

  // Form State
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Info, 2: Evidence Upload, 3: Review
  const [districtId, setDistrictId] = useState<string>(activeDistricts[0]?.id || '');
  const [productId, setProductId] = useState<string>(products[0]?.id || 'float');
  const [salesDate, setSalesDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [salesAmount, setSalesAmount] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Invoice Receipts (Multiple pages allowed)
  const [invoiceImages, setInvoiceImages] = useState<string[]>([]);

  // Bank Deposit Receipts (Unlimited per invoice)
  const [bankDeposits, setBankDeposits] = useState<
    Array<{
      id: string;
      depositDate: string;
      amount: string;
      bankName: string;
      refNumber: string;
      imageUrl: string;
    }>
  >([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Auto-fill unit price or sales amount when typing
  const handleAmountChange = (val: string) => {
    setSalesAmount(val);
    const num = parseFloat(val);
    const q = parseFloat(quantity) || 1;
    if (!isNaN(num) && q > 0) {
      setUnitPrice((num / q).toString());
    }
  };

  const handleQtyChange = (val: string) => {
    setQuantity(val);
    const q = parseFloat(val);
    const u = parseFloat(unitPrice);
    if (!isNaN(q) && !isNaN(u)) {
      setSalesAmount((q * u).toString());
    }
  };

  // Convert files to optimized base64 for instant preview and rock-solid persistence
  const handleFileProcess = (file: File, callback: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      callback(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleInvoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file) => {
        handleFileProcess(file, (url) => {
          setInvoiceImages((prev) => [...prev, url]);
        });
      });
    }
  };

  const addBankDepositRow = () => {
    setBankDeposits((prev) => [
      ...prev,
      {
        id: `dep-${Date.now()}-${prev.length + 1}`,
        depositDate: salesDate,
        amount: '',
        bankName: 'Commercial Bank of Ethiopia (CBE)',
        refNumber: '',
        imageUrl: ''
      }
    ]);
  };

  const removeBankDepositRow = (index: number) => {
    setBankDeposits((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDepositField = (index: number, field: string, value: string) => {
    setBankDeposits((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleDepositImageUpload = (index: number, file: File) => {
    handleFileProcess(file, (url) => {
      updateDepositField(index, 'imageUrl', url);
    });
  };

  const totalDepositedNumber = bankDeposits.reduce(
    (sum, d) => sum + (parseFloat(d.amount) || 0),
    0
  );
  const salesAmountNumber = parseFloat(salesAmount) || 0;
  const depositDifference = salesAmountNumber - totalDepositedNumber;

  const handleSubmit = async () => {
    if (!invoiceNumber.trim()) {
      setErrorMessage('Please enter an Invoice / Reference Number.');
      setStep(1);
      return;
    }
    if (salesAmountNumber <= 0) {
      setErrorMessage('Please enter a valid Sales Amount.');
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const monthKey = salesDate.substring(0, 7); // e.g. "2026-10"

      const mappedDeposits: BankDeposit[] = bankDeposits
        .filter((d) => parseFloat(d.amount) > 0 || d.imageUrl)
        .map((d) => ({
          id: d.id,
          depositDate: d.depositDate,
          amount: parseFloat(d.amount) || 0,
          bankName: d.bankName || 'Direct Deposit',
          refNumber: d.refNumber || undefined,
          imageUrl: d.imageUrl || undefined,
          uploadedAt: new Date().toISOString(),
          uploadedBy: userProfile?.displayName
        }));

      await addSale({
        shopId: selectedShopId,
        districtId: districtId || undefined,
        productId: productId || 'float',
        monthKey: monthKey,
        salesDate,
        invoiceNumber: invoiceNumber.trim(),
        salesAmount: salesAmountNumber,
        quantity: parseFloat(quantity) || 1,
        unitPrice: parseFloat(unitPrice) || salesAmountNumber,
        notes: notes.trim() || undefined,
        invoiceImages,
        bankDeposits: mappedDeposits,
        createdBy: userProfile?.id || 'manager',
        createdByName: userProfile?.displayName || 'Shop Manager'
      });

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record sale. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden border border-[#E8EDF2] flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#E8EDF2] bg-[#F7FAFD] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EAF4FC] text-[#2878B9] flex items-center justify-center font-bold text-sm">
              +
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#202B38]">{t.recordDailySale}</h2>
              <p className="text-xs text-[#778493]">{currentShop?.name || 'Operational Shop'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#778493] hover:text-[#202B38] hover:bg-[#EAF4FC] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex border-b border-[#E8EDF2] bg-white text-xs">
          <button
            onClick={() => setStep(1)}
            className={`flex-1 py-2.5 text-center font-medium border-b-2 transition-colors ${
              step === 1
                ? 'border-[#2878B9] text-[#2878B9] bg-[#EAF4FC]/30'
                : 'border-transparent text-[#778493] hover:text-[#202B38]'
            }`}
          >
            {t.step1}
          </button>
          <button
            onClick={() => {
              if (invoiceNumber && salesAmountNumber > 0) setStep(2);
            }}
            className={`flex-1 py-2.5 text-center font-medium border-b-2 transition-colors ${
              step === 2
                ? 'border-[#2878B9] text-[#2878B9] bg-[#EAF4FC]/30'
                : 'border-transparent text-[#778493] hover:text-[#202B38]'
            }`}
          >
            {t.step2}
          </button>
          <button
            onClick={() => {
              if (invoiceNumber && salesAmountNumber > 0) setStep(3);
            }}
            className={`flex-1 py-2.5 text-center font-medium border-b-2 transition-colors ${
              step === 3
                ? 'border-[#2878B9] text-[#2878B9] bg-[#EAF4FC]/30'
                : 'border-transparent text-[#778493] hover:text-[#202B38]'
            }`}
          >
            {t.step3}
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-5 mt-3 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {step === 1 && (
            <div className="space-y-3.5">
              {/* Branch Selection (for multi-shop managers / superadmins) */}
              {(isSuperAdmin || userProfile?.shopIds.length! > 1) && (
                <div>
                  <label className="block text-xs font-medium text-[#202B38] mb-1">{t.colShop} *</label>
                  <select
                    value={selectedShopId}
                    onChange={(e) => setSelectedShopId(e.target.value)}
                    className="w-full text-xs bg-[#F7FAFD] border border-[#E8EDF2] rounded-lg p-2.5 text-[#202B38] focus:border-[#2878B9] focus:outline-hidden font-medium"
                  >
                    {operationalShops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* District & Product Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeDistricts.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-[#202B38] mb-1">{t.colDistrict}</label>
                    <select
                      value={districtId}
                      onChange={(e) => setDistrictId(e.target.value)}
                      className="w-full text-xs bg-[#F7FAFD] border border-[#E8EDF2] rounded-lg p-2.5 text-[#202B38] focus:border-[#2878B9] focus:outline-hidden"
                    >
                      <option value="">General Shop</option>
                      {activeDistricts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-[#202B38] mb-1">{t.colProduct}</label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full text-xs bg-[#F7FAFD] border border-[#E8EDF2] rounded-lg p-2.5 text-[#202B38] focus:border-[#2878B9] focus:outline-hidden"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Invoice Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#202B38] mb-1">{t.salesDateLabel} *</label>
                  <input
                    type="date"
                    value={salesDate}
                    onChange={(e) => setSalesDate(e.target.value)}
                    className="w-full text-xs bg-[#F7FAFD] border border-[#E8EDF2] rounded-lg p-2.5 text-[#202B38] focus:border-[#2878B9] focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#202B38] mb-1">
                    {t.invoiceRefLabel} *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 0036452"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full text-xs bg-[#F7FAFD] border border-[#E8EDF2] rounded-lg p-2.5 text-[#202B38] font-mono focus:border-[#2878B9] focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Financial Sales Figures */}
              <div className="p-3.5 bg-[#EAF4FC]/40 rounded-xl border border-[#DCEEFF] space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#202B38] mb-1">
                    {t.totalSalesAmountLabel} *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-[#2878B9]">ETB</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={salesAmount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="w-full text-sm font-semibold pl-12 pr-3 py-2 bg-white border border-[#E8EDF2] rounded-lg text-[#202B38] focus:border-[#2878B9] focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#778493] mb-0.5">{t.quantityLabel}</label>
                    <input
                      type="number"
                      step="any"
                      value={quantity}
                      onChange={(e) => handleQtyChange(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-[#E8EDF2] rounded-lg text-[#202B38]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#778493] mb-0.5">{t.unitPriceLabel}</label>
                    <input
                      type="number"
                      step="any"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-[#E8EDF2] rounded-lg text-[#202B38]"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-[#202B38] mb-1">{t.notesLabel}</label>
                <textarea
                  rows={2}
                  placeholder="Additional comments or customer reference..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs bg-[#F7FAFD] border border-[#E8EDF2] rounded-lg p-2.5 text-[#202B38] focus:border-[#2878B9] focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              {/* Section A: Sales Invoice Receipt Photo */}
              <div className="border border-[#E8EDF2] rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xs font-semibold text-[#202B38]">{t.salesInvoicePhoto}</h3>
                    <p className="text-[11px] text-[#778493]">
                      {t.salesInvoicePhotoDesc}
                    </p>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-[#EAF4FC] text-[#2878B9] font-medium">
                    {invoiceImages.length} {t.attachedCount}
                  </span>
                </div>

                {/* Upload Buttons */}
                <div className="flex gap-2 mb-3">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-[#2878B9]/40 bg-[#EAF4FC]/30 hover:bg-[#EAF4FC]/70 transition-all text-xs font-medium text-[#2878B9]">
                    <Camera className="w-4 h-4" />
                    <span>{t.cameraGallery}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      capture="environment"
                      multiple
                      onChange={handleInvoiceUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Previews */}
                {invoiceImages.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 mt-2">
                    {invoiceImages.map((img, i) => (
                      <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-[#E8EDF2] bg-slate-50 shadow-xs">
                        <img src={img} alt={`Invoice ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setInvoiceImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded-md transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section B: Bank Deposit Evidence */}
              <div className="border border-[#E8EDF2] rounded-xl p-4 bg-[#F7FAFD]">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xs font-semibold text-[#202B38]">{t.bankDepositReceipts}</h3>
                    <p className="text-[11px] text-[#778493]">
                      {t.bankDepositDesc}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addBankDepositRow}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-[#2878B9] text-white hover:bg-[#1e6197] font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{t.addDeposit}</span>
                  </button>
                </div>

                {/* Deposit Slips List */}
                {bankDeposits.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-[#E8EDF2] rounded-xl bg-white">
                    <p className="text-xs text-[#778493] mb-2">{t.noDepositsYet}</p>
                    <button
                      type="button"
                      onClick={addBankDepositRow}
                      className="text-xs text-[#2878B9] font-medium hover:underline"
                    >
                      + {t.addDeposit}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 mt-3">
                    {bankDeposits.map((dep, idx) => (
                      <div key={dep.id} className="p-3 bg-white rounded-xl border border-[#E8EDF2] space-y-2.5 shadow-xs">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#202B38]">Deposit #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeBankDepositRow(idx)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-[#778493]">{t.bankChannel}</label>
                            <select
                              value={dep.bankName}
                              onChange={(e) => updateDepositField(idx, 'bankName', e.target.value)}
                              className="w-full text-xs p-1.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-md"
                            >
                              <option value="Commercial Bank of Ethiopia (CBE)">CBE</option>
                              <option value="Telebirr / Ethio Telecom">Telebirr</option>
                              <option value="Awash Bank">Awash Bank</option>
                              <option value="Dashen Bank">Dashen Bank</option>
                              <option value="Bank of Abyssinia">Bank of Abyssinia</option>
                              <option value="Other">Other Bank</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] text-[#778493]">{t.amountDeposited}</label>
                            <input
                              type="number"
                              step="any"
                              placeholder="0.00"
                              value={dep.amount}
                              onChange={(e) => updateDepositField(idx, 'amount', e.target.value)}
                              className="w-full text-xs p-1.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-md font-semibold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-[#778493]">{t.refTxId}</label>
                            <input
                              type="text"
                              placeholder="e.g. FT263..."
                              value={dep.refNumber}
                              onChange={(e) => updateDepositField(idx, 'refNumber', e.target.value)}
                              className="w-full text-xs p-1.5 bg-[#F7FAFD] border border-[#E8EDF2] rounded-md font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-[#778493]">{t.depositPhoto}</label>
                            <div className="flex items-center gap-2">
                              {dep.imageUrl ? (
                                <div className="relative w-10 h-10 rounded border border-[#E8EDF2] overflow-hidden">
                                  <img src={dep.imageUrl} alt="Deposit" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => updateDepositField(idx, 'imageUrl', '')}
                                    className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 hover:opacity-100"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <label className="cursor-pointer px-2.5 py-1.5 rounded-md border border-[#E8EDF2] bg-[#F7FAFD] hover:bg-[#EAF4FC] text-[11px] font-medium text-[#2878B9] flex items-center gap-1">
                                  <Camera className="w-3 h-3" />
                                  <span>{t.snapReceipt}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) handleDepositImageUpload(idx, e.target.files[0]);
                                    }}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Live Reconciliation Balance for this invoice */}
                <div className="mt-3 p-3 bg-white rounded-xl border border-[#E8EDF2] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#778493]">{t.totalDeposited}: </span>
                    <span className="font-semibold text-[#202B38]">
                      ETB {totalDepositedNumber.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#778493]">{t.variance}: </span>
                    <span
                      className={`font-semibold ${
                        depositDifference === 0
                          ? 'text-emerald-600'
                          : depositDifference > 0
                          ? 'text-amber-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {depositDifference === 0
                        ? t.fullyReconciled
                        : `ETB ${Math.abs(depositDifference).toLocaleString()} ${
                            depositDifference > 0 ? t.pendingVariance : t.overVariance
                          }`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#F7FAFD] border border-[#E8EDF2] space-y-2 text-xs">
                <div className="text-xs font-semibold text-[#202B38] border-b border-[#E8EDF2] pb-1.5">
                  {t.summaryOfEntry}
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-[#778493]">{t.colShop}:</span>
                  <span className="font-medium text-[#202B38]">{currentShop?.name}</span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-[#778493]">{t.salesDateLabel}:</span>
                  <span className="font-medium text-[#202B38]">{salesDate}</span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-[#778493]">{t.invoiceRefLabel}:</span>
                  <span className="font-mono font-medium text-[#202B38]">{invoiceNumber}</span>
                </div>

                <div className="flex justify-between py-1 border-t border-[#E8EDF2] pt-2">
                  <span className="text-[#778493]">{t.totalSales}:</span>
                  <span className="font-bold text-sm text-[#2878B9]">
                    ETB {salesAmountNumber.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-[#778493]">{t.bankDepositReceipts}:</span>
                  <span className="font-medium text-[#202B38]">
                    {bankDeposits.length} deposit(s) - ETB {totalDepositedNumber.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-[#778493]">{t.colStatus}:</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                      depositDifference === 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : totalDepositedNumber > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {depositDifference === 0
                      ? t.fullyReconciled
                      : totalDepositedNumber > 0
                      ? 'Partially Deposited'
                      : 'Unreconciled / Pending Deposit'}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-[#778493]">{t.colEvidence}:</span>
                  <span className="font-medium text-[#202B38]">{invoiceImages.length} image(s) attached</span>
                </div>
              </div>

              <div className="text-[11px] text-[#778493] italic">
                * By submitting, this transaction will immediately appear in Moderntech's centralized database and the shop's spreadsheet in real time.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 border-t border-[#E8EDF2] bg-[#F7FAFD] flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-3.5 py-1.5 rounded-lg border border-[#E8EDF2] bg-white text-xs font-medium text-[#202B38] hover:bg-[#F7FAFD] flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.back}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-[#E8EDF2] bg-white text-xs font-medium text-[#778493] hover:text-[#202B38]"
            >
              {t.cancel}
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (!invoiceNumber) {
                  setErrorMessage('Please enter invoice/ref number.');
                  return;
                }
                if (salesAmountNumber <= 0) {
                  setErrorMessage('Please enter sales amount.');
                  return;
                }
                setErrorMessage('');
                setStep((s) => (s + 1) as any);
              }}
              className="px-4 py-1.5 rounded-lg bg-[#2878B9] hover:bg-[#1e6197] text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <span>{t.next}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-5 py-2 rounded-lg bg-[#2878B9] hover:bg-[#1e6197] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Recording Sale...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.submitTransaction}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

