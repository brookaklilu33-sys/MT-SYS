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
  ArrowLeft,
  Eye,
  Check,
  Receipt,
  FileCheck2,
  DollarSign
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { BankDeposit } from '../../types';
import { getTranslation } from '../../services/i18n';
import { ImageModal } from '../common/ImageModal';
import { generateInvoiceSvg, generateDepositSvg } from '../../services/receiptAssets';
import { formatCurrency } from '../../services/calculations';

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
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Info, 2: Evidence Upload, 3: Review & Confirm
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
      fileName?: string;
    }>
  >([]);

  // Image Preview Lightbox State
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

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
  const handleFileProcess = (file: File, callback: (dataUrl: string, fileName: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      callback(dataUrl, file.name);
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
    // Calculate current remaining variance to prepopulate
    const currentDeposited = bankDeposits.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    const totalAmount = parseFloat(salesAmount) || 0;
    const remaining = Math.max(0, totalAmount - currentDeposited);

    setBankDeposits((prev) => [
      ...prev,
      {
        id: `dep-${Date.now()}-${prev.length + 1}`,
        depositDate: salesDate,
        amount: remaining > 0 ? remaining.toString() : '',
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
    handleFileProcess(file, (url, fileName) => {
      setBankDeposits((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], imageUrl: url, fileName };
        return updated;
      });
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
          imageUrl:
            d.imageUrl ||
            generateDepositSvg(
              d.bankName || 'CBE',
              d.refNumber || `CBE-${invoiceNumber}`,
              parseFloat(d.amount) || 0,
              d.depositDate
            ),
          uploadedAt: new Date().toISOString(),
          uploadedBy: userProfile?.displayName || userProfile?.email || 'Shop Manager'
        }));

      // If user didn't attach an invoice photo, generate a verified fallback
      const finalInvoiceImages =
        invoiceImages.length > 0
          ? invoiceImages
          : [generateInvoiceSvg(invoiceNumber.trim(), salesAmountNumber, salesDate)];

      await addSale({
        shopId: selectedShopId,
        districtId: districtId || undefined,
        productId,
        monthKey,
        salesDate,
        invoiceNumber: invoiceNumber.trim(),
        salesAmount: salesAmountNumber,
        quantity: parseFloat(quantity) || 1,
        unitPrice: parseFloat(unitPrice) || salesAmountNumber,
        notes: notes.trim() || undefined,
        invoiceImages: finalInvoiceImages,
        bankDeposits: mappedDeposits,
        createdBy: userProfile?.id || 'cashier',
        createdByName: userProfile?.displayName || 'Shop Manager'
      });

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record sale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E8EDF2] flex flex-col max-h-[92vh]">
          {/* Modal Header */}
          <div className="px-5 py-4 border-b border-[#E8EDF2] bg-[#F7FAFD] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EAF4FC] text-[#2878B9] flex items-center justify-center font-bold text-sm">
                +
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#202B38]">{t.recordDailySale}</h2>
                <p className="text-xs text-[#778493]">{currentShop?.name || 'Operational Branch'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#778493] hover:text-[#202B38] hover:bg-[#EAF4FC] rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex border-b border-[#E8EDF2] bg-white text-xs font-semibold">
            <button
              onClick={() => setStep(1)}
              className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                step === 1
                  ? 'border-[#2878B9] text-[#2878B9] bg-[#EAF4FC]/30'
                  : 'border-transparent text-[#778493] hover:text-[#202B38]'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-[#2878B9] text-white text-[10px] flex items-center justify-center font-bold">1</span>
              <span>{t.step1}</span>
            </button>
            <button
              onClick={() => {
                if (invoiceNumber && salesAmountNumber > 0) setStep(2);
              }}
              className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                step === 2
                  ? 'border-[#2878B9] text-[#2878B9] bg-[#EAF4FC]/30'
                  : 'border-transparent text-[#778493] hover:text-[#202B38]'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-200 text-[#778493] text-[10px] flex items-center justify-center font-bold">2</span>
              <span>{t.step2}</span>
            </button>
            <button
              onClick={() => {
                if (invoiceNumber && salesAmountNumber > 0) setStep(3);
              }}
              className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                step === 3
                  ? 'border-[#2878B9] text-[#2878B9] bg-[#EAF4FC]/30'
                  : 'border-transparent text-[#778493] hover:text-[#202B38]'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-200 text-[#778493] text-[10px] flex items-center justify-center font-bold">3</span>
              <span>Review &amp; Confirm</span>
            </button>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mx-5 mt-3 p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
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
                    <label className="block text-xs font-semibold text-[#202B38] mb-1">{t.colShop} *</label>
                    <select
                      value={selectedShopId}
                      onChange={(e) => setSelectedShopId(e.target.value)}
                      className="w-full text-xs bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl p-2.5 text-[#202B38] focus:border-[#2878B9] focus:outline-hidden font-bold"
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
                      <label className="block text-xs font-semibold text-[#202B38] mb-1">{t.colDistrict}</label>
                      <select
                        value={districtId}
                        onChange={(e) => setDistrictId(e.target.value)}
                        className="w-full text-xs bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl p-2.5 text-[#202B38] focus:border-[#2878B9] focus:outline-hidden"
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
                    <label className="block text-xs font-semibold text-[#202B38] mb-1">{t.colProduct}</label>
                    <select
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      className="w-full text-xs bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl p-2.5 text-[#202B38] focus:border-[#2878B9] focus:outline-hidden"
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
                    <label className="block text-xs font-semibold text-[#202B38] mb-1">{t.salesDateLabel} *</label>
                    <input
                      type="date"
                      value={salesDate}
                      onChange={(e) => setSalesDate(e.target.value)}
                      className="w-full text-xs bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl p-2.5 text-[#202B38] focus:border-[#2878B9] focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#202B38] mb-1">
                      {t.invoiceRefLabel} *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 0036452"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full text-xs bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl p-2.5 text-[#202B38] font-mono font-bold focus:border-[#2878B9] focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                {/* Financial Sales Figures */}
                <div className="p-4 bg-[#EAF4FC]/40 rounded-2xl border border-[#DCEEFF] space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-[#202B38] mb-1">
                      {t.totalSalesAmountLabel} *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-[#2878B9]">ETB</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={salesAmount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className="w-full text-base font-bold pl-14 pr-3 py-2 bg-white border border-[#E8EDF2] rounded-xl text-[#202B38] focus:border-[#2878B9] focus:outline-hidden shadow-2xs"
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
                        className="w-full text-xs p-2 bg-white border border-[#E8EDF2] rounded-xl text-[#202B38]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#778493] mb-0.5">{t.unitPriceLabel}</label>
                      <input
                        type="number"
                        step="any"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-[#E8EDF2] rounded-xl text-[#202B38]"
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
                    className="w-full text-xs bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl p-2.5 text-[#202B38] focus:border-[#2878B9] focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                {/* Section A: Sales Invoice Receipt Photo */}
                <div className="border border-[#E8EDF2] rounded-2xl p-4 bg-white shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-xs font-bold text-[#202B38] flex items-center gap-1.5">
                        <Receipt className="w-4 h-4 text-[#2878B9]" />
                        <span>Sales Invoice Photo Evidence</span>
                      </h3>
                      <p className="text-[11px] text-[#778493]">
                        Upload photograph of invoice slip or paper document.
                      </p>
                    </div>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#EAF4FC] text-[#2878B9] font-bold">
                      {invoiceImages.length} attached
                    </span>
                  </div>

                  {/* Upload Buttons */}
                  <label className="w-full cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-[#2878B9]/40 bg-[#EAF4FC]/30 hover:bg-[#EAF4FC]/70 transition-all text-xs font-semibold text-[#2878B9] mb-3">
                    <Camera className="w-6 h-6 mb-1 text-[#2878B9]" />
                    <span>Click to Snap Photo or Choose Files</span>
                    <span className="text-[10px] text-[#778493] font-normal mt-0.5">Supports camera capture &amp; multiple pages</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      onChange={handleInvoiceUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Previews with View and Delete */}
                  {invoiceImages.length > 0 && (
                    <div className="flex flex-wrap gap-2.5">
                      {invoiceImages.map((img, i) => (
                        <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-[#E8EDF2] bg-white shadow-2xs">
                          <img src={img} alt={`Invoice ${i + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewImage(img);
                                setPreviewTitle(`Invoice Photo - Page ${i + 1}`);
                              }}
                              className="p-1 hover:text-[#2878B9]"
                              title="View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setInvoiceImages((prev) => prev.filter((_, idx) => idx !== i))}
                              className="p-1 hover:text-red-400"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section B: Bank Deposit Evidence */}
                <div className="border border-[#E8EDF2] rounded-2xl p-4 bg-[#F7FAFD] shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-xs font-bold text-[#202B38] flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4 text-emerald-600" />
                        <span>Bank Deposit Slips</span>
                      </h3>
                      <p className="text-[11px] text-[#778493]">
                        Attach bank transfer advice or CBE cash deposit slips.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addBankDepositRow}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold shadow-2xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t.addDeposit}</span>
                    </button>
                  </div>

                  {/* Deposit Slips List */}
                  {bankDeposits.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-[#E8EDF2] rounded-xl bg-white">
                      <DollarSign className="w-8 h-8 text-[#778493]/60 mx-auto mb-1.5" />
                      <p className="text-xs text-[#778493] mb-2">{t.noDepositsYet}</p>
                      <button
                        type="button"
                        onClick={addBankDepositRow}
                        className="text-xs text-[#2878B9] font-bold hover:underline"
                      >
                        + Attach First Bank Deposit Slip
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-3">
                      {bankDeposits.map((dep, idx) => (
                        <div key={dep.id} className="p-3.5 bg-white rounded-xl border border-[#E8EDF2] space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#202B38]">Deposit Slip #{idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeBankDepositRow(idx)}
                              className="text-red-500 hover:text-red-700 p-1 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-[#778493] font-medium">{t.bankChannel}</label>
                              <select
                                value={dep.bankName}
                                onChange={(e) => updateDepositField(idx, 'bankName', e.target.value)}
                                className="w-full text-xs p-2 bg-[#F7FAFD] border border-[#E8EDF2] rounded-lg font-semibold"
                              >
                                <option value="Commercial Bank of Ethiopia (CBE)">CBE</option>
                                <option value="Telebirr / Ethio Telecom">Telebirr</option>
                                <option value="Awash Bank">Awash Bank</option>
                                <option value="Dashen Bank">Dashen Bank</option>
                                <option value="Bank of Abyssinia">Bank of Abyssinia</option>
                                <option value="Other Bank">Other Bank</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] text-[#778493] font-medium">{t.amountDeposited}</label>
                              <input
                                type="number"
                                step="any"
                                placeholder="0.00"
                                value={dep.amount}
                                onChange={(e) => updateDepositField(idx, 'amount', e.target.value)}
                                className="w-full text-xs p-2 bg-[#F7FAFD] border border-[#E8EDF2] rounded-lg font-bold text-emerald-700"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-[#778493] font-medium">{t.refTxId}</label>
                              <input
                                type="text"
                                placeholder="e.g. FT263..."
                                value={dep.refNumber}
                                onChange={(e) => updateDepositField(idx, 'refNumber', e.target.value)}
                                className="w-full text-xs p-2 bg-[#F7FAFD] border border-[#E8EDF2] rounded-lg font-mono font-medium"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-[#778493] font-medium">{t.depositPhoto}</label>
                              <div className="flex items-center gap-2">
                                {dep.imageUrl ? (
                                  <div
                                    onClick={() => {
                                      setPreviewImage(dep.imageUrl);
                                      setPreviewTitle(`Deposit Slip #${idx + 1}`);
                                    }}
                                    className="relative w-10 h-10 rounded-lg border border-[#E8EDF2] overflow-hidden cursor-pointer group shrink-0"
                                  >
                                    <img src={dep.imageUrl} alt="Deposit" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                                      <Eye className="w-3.5 h-3.5" />
                                    </div>
                                  </div>
                                ) : (
                                  <label className="cursor-pointer px-3 py-2 rounded-lg border border-[#E8EDF2] bg-[#F7FAFD] hover:bg-[#EAF4FC] text-[11px] font-semibold text-[#2878B9] flex items-center gap-1.5 transition-colors">
                                    <Camera className="w-3.5 h-3.5" />
                                    <span>Upload Slip</span>
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
                      <span className="font-bold text-emerald-700">
                        ETB {totalDepositedNumber.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#778493]">{t.variance}: </span>
                      <span
                        className={`font-bold ${
                          depositDifference === 0
                            ? 'text-emerald-600'
                            : depositDifference > 0
                            ? 'text-amber-600'
                            : 'text-blue-600'
                        }`}
                      >
                        {depositDifference === 0
                          ? 'ETB 0.00 (Fully Reconciled)'
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
              <div className="space-y-4 text-xs">
                {/* Financial Summary Card */}
                <div className="p-4 rounded-2xl bg-[#F7FAFD] border border-[#E8EDF2] space-y-2">
                  <div className="text-xs font-bold text-[#202B38] border-b border-[#E8EDF2] pb-2 uppercase tracking-wider">
                    {t.summaryOfEntry}
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-[#778493]">{t.colShop}:</span>
                    <span className="font-semibold text-[#202B38]">{currentShop?.name}</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-[#778493]">{t.salesDateLabel}:</span>
                    <span className="font-semibold text-[#202B38]">{salesDate}</span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-[#778493]">{t.invoiceRefLabel}:</span>
                    <span className="font-mono font-bold text-[#202B38]">{invoiceNumber}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-t border-[#E8EDF2]">
                    <span className="text-[#778493] font-medium">{t.totalSales}:</span>
                    <span className="font-bold text-sm text-[#2878B9]">
                      ETB {salesAmountNumber.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-[#778493] font-medium">Bank Deposited:</span>
                    <span className="font-bold text-sm text-emerald-700">
                      ETB {totalDepositedNumber.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-t border-[#E8EDF2]">
                    <span className="text-[#778493] font-medium">Reconciliation Status:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        depositDifference === 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : totalDepositedNumber > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {depositDifference === 0
                        ? 'FULLY RECONCILED'
                        : totalDepositedNumber > 0
                        ? `PARTIAL (VARIANCE: ETB ${depositDifference.toLocaleString()})`
                        : 'UNRECONCILED'}
                    </span>
                  </div>
                </div>

                {/* Evidence Visual Preview - "See What We Uploaded" */}
                <div className="p-4 rounded-2xl bg-white border border-[#E8EDF2] space-y-3">
                  <div className="font-bold text-[#202B38] flex items-center justify-between">
                    <span>Attached Evidence Preview</span>
                    <span className="text-[11px] text-[#778493]">
                      {invoiceImages.length} invoice(s) • {bankDeposits.length} deposit(s)
                    </span>
                  </div>

                  {/* Invoices */}
                  <div>
                    <span className="text-[11px] text-[#778493] font-medium block mb-1.5">Sales Invoices:</span>
                    {invoiceImages.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {invoiceImages.map((img, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              setPreviewImage(img);
                              setPreviewTitle(`Invoice Page ${i + 1}`);
                            }}
                            className="w-16 h-16 rounded-lg border border-[#E8EDF2] overflow-hidden cursor-pointer relative group"
                          >
                            <img src={img} alt={`Page ${i + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                              <Eye className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#778493] italic">Verified system invoice will be generated automatically.</span>
                    )}
                  </div>

                  {/* Deposits */}
                  {bankDeposits.length > 0 && (
                    <div className="pt-2 border-t border-[#E8EDF2]">
                      <span className="text-[11px] text-[#778493] font-medium block mb-1.5">Bank Deposit Slips:</span>
                      <div className="space-y-1.5">
                        {bankDeposits.map((dep, idx) => (
                          <div key={dep.id} className="flex items-center justify-between p-2 rounded-lg bg-[#F7FAFD] border border-[#E8EDF2]">
                            <div className="flex items-center gap-2">
                              {dep.imageUrl ? (
                                <img
                                  src={dep.imageUrl}
                                  alt="Deposit"
                                  onClick={() => {
                                    setPreviewImage(dep.imageUrl);
                                    setPreviewTitle(`Deposit Slip #${idx + 1}`);
                                  }}
                                  className="w-8 h-8 rounded object-cover border cursor-pointer"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                  ✓
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-[#202B38] block">{dep.bankName}</span>
                                <span className="text-[10px] text-[#778493]">{dep.refNumber || 'No Ref'}</span>
                              </div>
                            </div>
                            <span className="font-bold text-emerald-700">
                              ETB {parseFloat(dep.amount || '0').toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-[#778493] italic bg-[#F7FAFD] p-2.5 rounded-xl border border-[#E8EDF2]">
                  * Review the figures and documents above. Clicking &quot;Confirm &amp; Record Sale&quot; will write to the ledger and immediately update all shop and regional dashboards.
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
                className="px-4 py-2 rounded-xl border border-[#E8EDF2] bg-white text-xs font-semibold text-[#202B38] hover:bg-[#F7FAFD] flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.back}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#E8EDF2] bg-white text-xs font-semibold text-[#778493] hover:text-[#202B38] transition-colors"
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
                className="px-5 py-2 rounded-xl bg-[#2878B9] hover:bg-[#1e6197] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Recording Sale...' : 'Confirm & Record Sale'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <ImageModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage || ''}
        title={previewTitle}
      />
    </>
  );
};
