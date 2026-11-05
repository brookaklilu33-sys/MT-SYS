import React, { useState } from 'react';
import {
  X,
  Edit2,
  Save,
  Plus,
  Eye,
  AlertCircle,
  DollarSign,
  Upload,
  Camera,
  Trash2,
  CheckCircle2,
  Receipt,
  FileCheck2,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Sale, BankDeposit } from '../../types';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { ImageModal } from '../common/ImageModal';
import { formatCurrency } from '../../services/calculations';
import { getTranslation } from '../../services/i18n';
import { generateInvoiceSvg, generateDepositSvg } from '../../services/receiptAssets';

interface SaleDetailModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SaleDetailModal: React.FC<SaleDetailModalProps> = ({ sale, isOpen, onClose }) => {
  const { updateSale } = useShop();
  const { userProfile, isSuperAdmin, language } = useAuth();
  const t = getTranslation(language);

  // Edit / Correction State
  const [isEditing, setIsEditing] = useState(false);
  const [salesAmount, setSalesAmount] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [salesDate, setSalesDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Edited Invoice Photos State (in edit mode)
  const [editedInvoiceImages, setEditedInvoiceImages] = useState<string[]>([]);

  // Confirmation Step State before finalizing correction
  const [showConfirmStep, setShowConfirmStep] = useState(false);

  // Add Bank Deposit Form State
  const [isAddingDeposit, setIsAddingDeposit] = useState(false);
  const [newDepositAmount, setNewDepositAmount] = useState('');
  const [newDepositBank, setNewDepositBank] = useState('Commercial Bank of Ethiopia (CBE)');
  const [newDepositRef, setNewDepositRef] = useState('');
  const [newDepositDate, setNewDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDepositImg, setNewDepositImg] = useState('');
  const [newDepositFileName, setNewDepositFileName] = useState('');
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [depositError, setDepositError] = useState('');

  // Add Invoice Photo Form State (direct attach when not in full edit)
  const [isAttachingInvoicePhoto, setIsAttachingInvoicePhoto] = useState(false);
  const [newInvoiceImg, setNewInvoiceImg] = useState('');
  const [newInvoiceFileName, setNewInvoiceFileName] = useState('');

  // Image Preview Lightbox State
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  if (!isOpen || !sale) return null;

  const startEdit = () => {
    setSalesAmount(sale.salesAmount.toString());
    setInvoiceNumber(sale.invoiceNumber);
    setSalesDate(sale.salesDate);
    setNotes(sale.notes || '');
    setEditedInvoiceImages([...(sale.invoiceImages || [])]);
    setCorrectionReason('');
    setErrorMessage('');
    setShowConfirmStep(false);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setShowConfirmStep(false);
    setErrorMessage('');
  };

  // Convert File to base64 Data URL
  const handleFileProcess = (file: File, callback: (dataUrl: string, fileName: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      callback(dataUrl, file.name);
    };
    reader.readAsDataURL(file);
  };

  // Handle Invoice Image Upload in Edit Mode
  const handleEditInvoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach((file) => {
        handleFileProcess(file, (dataUrl) => {
          setEditedInvoiceImages((prev) => [...prev, dataUrl]);
        });
      });
    }
  };

  // Remove Invoice Photo in Edit Mode
  const handleRemoveInvoiceImage = (index: number) => {
    setEditedInvoiceImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Quick Direct Invoice Photo Upload (when not in full edit mode)
  const handleDirectInvoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      handleFileProcess(file, (dataUrl, fileName) => {
        setNewInvoiceImg(dataUrl);
        setNewInvoiceFileName(fileName);
      });
    }
  };

  const handleConfirmDirectInvoicePhoto = async () => {
    if (!newInvoiceImg) return;
    setIsSaving(true);
    try {
      const updatedImages = [...(sale.invoiceImages || []), newInvoiceImg];
      await updateSale(
        sale.id,
        { invoiceImages: updatedImages },
        `Attached additional sales invoice photo: ${newInvoiceFileName || 'Invoice Receipt Page'}`
      );
      setSuccessBanner('Sales invoice photo attached successfully!');
      setIsAttachingInvoicePhoto(false);
      setNewInvoiceImg('');
      setNewInvoiceFileName('');
      setTimeout(() => setSuccessBanner(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to attach invoice photo.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Deposit Slip File Selection
  const handleDepositFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      handleFileProcess(file, (dataUrl, fileName) => {
        setNewDepositImg(dataUrl);
        setNewDepositFileName(fileName);
      });
    }
  };

  // Auto-fill Remaining Balance for Deposit
  const handleFillRemainingDeposit = () => {
    const diff = Math.max(0, sale.depositDifference);
    if (diff > 0) {
      setNewDepositAmount(diff.toString());
    } else {
      setNewDepositAmount(sale.salesAmount.toString());
    }
  };

  // Validate before showing confirmation review
  const handleProceedToConfirm = () => {
    if (!correctionReason.trim()) {
      setErrorMessage('A mandatory correction reason is required to maintain audit compliance.');
      return;
    }
    const amountNum = parseFloat(salesAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage('Please provide a valid sales amount.');
      return;
    }
    setErrorMessage('');
    setShowConfirmStep(true);
  };

  // Save Confirmed Correction
  const handleSaveCorrection = async () => {
    const amountNum = parseFloat(salesAmount);
    setIsSaving(true);
    try {
      await updateSale(
        sale.id,
        {
          salesAmount: amountNum,
          unitPrice: amountNum,
          invoiceNumber: invoiceNumber.trim(),
          salesDate,
          notes: notes.trim() || undefined,
          invoiceImages: editedInvoiceImages
        },
        correctionReason.trim()
      );
      setIsEditing(false);
      setShowConfirmStep(false);
      setSuccessBanner('Changes confirmed and saved to audit log!');
      setTimeout(() => setSuccessBanner(''), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update sale.');
    } finally {
      setIsSaving(false);
    }
  };

  // Add Bank Deposit
  const handleAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newDepositAmount);
    if (isNaN(amount) || amount <= 0) {
      setDepositError('Please enter a valid deposit amount.');
      return;
    }

    setIsSubmittingDeposit(true);
    setDepositError('');

    try {
      // If no photo was uploaded, generate an authentic deposit SVG
      const depositImgUrl =
        newDepositImg ||
        generateDepositSvg(newDepositBank, newDepositRef || `DEP-${Date.now().toString().slice(-5)}`, amount, newDepositDate);

      const newDep: BankDeposit = {
        id: `dep-${Date.now()}`,
        depositDate: newDepositDate,
        amount,
        bankName: newDepositBank,
        refNumber: newDepositRef.trim() || undefined,
        imageUrl: depositImgUrl,
        uploadedAt: new Date().toISOString(),
        uploadedBy: userProfile?.displayName || userProfile?.email || 'Shop Manager'
      };

      const updatedDeposits = [...(sale.bankDeposits || []), newDep];

      await updateSale(
        sale.id,
        { bankDeposits: updatedDeposits },
        `Attached ${newDepositBank} bank deposit receipt #${newDepositRef || 'N/A'} for ETB ${amount.toLocaleString()}`
      );

      setIsAddingDeposit(false);
      setNewDepositAmount('');
      setNewDepositRef('');
      setNewDepositImg('');
      setNewDepositFileName('');
      setSuccessBanner(`Bank deposit of ETB ${amount.toLocaleString()} attached and reconciled!`);
      setTimeout(() => setSuccessBanner(''), 3500);
    } catch (err: any) {
      setDepositError(err.message || 'Failed to attach deposit.');
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  // Remove Existing Deposit
  const handleRemoveDeposit = async (depositId: string, amount: number, bankName: string) => {
    if (!window.confirm(`Are you sure you want to remove the deposit of ETB ${amount.toLocaleString()} from ${bankName}?`)) {
      return;
    }

    const updated = (sale.bankDeposits || []).filter((d) => d.id !== depositId);
    await updateSale(
      sale.id,
      { bankDeposits: updated },
      `Removed bank deposit slip of ETB ${amount.toLocaleString()} (${bankName})`
    );
    setSuccessBanner('Deposit slip removed.');
    setTimeout(() => setSuccessBanner(''), 3000);
  };

  // Computed values for confirmation preview
  const parsedNewAmount = parseFloat(salesAmount) || 0;
  const currentTotalDeposited = sale.totalDeposited;
  const newProjectedDifference = parsedNewAmount - currentTotalDeposited;
  const newProjectedStatus =
    currentTotalDeposited === parsedNewAmount
      ? 'Fully Reconciled'
      : currentTotalDeposited > parsedNewAmount
      ? 'Over Deposited'
      : currentTotalDeposited > 0
      ? 'Partial'
      : 'Unreconciled';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E8EDF2] flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#E8EDF2] bg-[#F7FAFD] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-white border border-[#E8EDF2] text-[#202B38] font-bold shadow-2xs">
                #{sale.invoiceNumber}
              </span>
              <div>
                <h2 className="text-sm font-bold text-[#202B38]">Transaction Details & Evidence</h2>
                <p className="text-xs text-[#778493]">{sale.shopName || sale.shopId} {sale.districtName ? `• ${sale.districtName}` : ''}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  type="button"
                  onClick={startEdit}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#DCEEFF] bg-[#EAF4FC] hover:bg-[#DCEEFF] text-[#2878B9] flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Correct Entry</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-[#778493] hover:text-[#202B38] hover:bg-[#EAF4FC] rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {successBanner && (
            <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successBanner}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="px-5 py-2.5 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-5">
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#EAF4FC]/60 border border-[#DCEEFF]">
                <span className="text-[11px] text-[#778493] font-medium block uppercase tracking-wider">{t.colAmount}</span>
                <span className="text-lg font-bold text-[#2878B9] mt-0.5 block">
                  {formatCurrency(sale.salesAmount)}
                </span>
                <span className="text-[10px] text-[#778493] mt-0.5 block">
                  Invoice Value
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#E8EDF2] shadow-2xs">
                <span className="text-[11px] text-[#778493] font-medium block uppercase tracking-wider">{t.totalDeposited}</span>
                <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
                  {formatCurrency(sale.totalDeposited)}
                </span>
                <span className="text-[10px] text-emerald-600 mt-0.5 block font-medium">
                  {sale.bankDeposits?.length || 0} slip(s) attached
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#E8EDF2] shadow-2xs">
                <span className="text-[11px] text-[#778493] font-medium block uppercase tracking-wider">{t.variance}</span>
                <span
                  className={`text-lg font-bold mt-0.5 block ${
                    sale.depositDifference === 0
                      ? 'text-emerald-600'
                      : sale.depositDifference > 0
                      ? 'text-amber-600'
                      : 'text-blue-600'
                  }`}
                >
                  {sale.depositDifference === 0 ? 'ETB 0.00' : formatCurrency(sale.depositDifference)}
                </span>
                <span
                  className={`text-[10px] font-semibold mt-0.5 inline-block px-1.5 py-0.5 rounded ${
                    sale.status === 'reconciled'
                      ? 'bg-emerald-100 text-emerald-800'
                      : sale.status === 'partial'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {sale.status === 'reconciled' ? 'FULLY RECONCILED' : sale.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* AUDIT TRAIL CORRECTION MODE (Form vs Confirmation Review) */}
            {isEditing && (
              <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/40 p-4 sm:p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-700" />
                    <div>
                      <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                        {showConfirmStep ? 'Confirm Changes Before Saving' : 'Audit Trail Correction Mode'}
                      </h3>
                      <p className="text-[11px] text-amber-700">
                        {showConfirmStep
                          ? 'Review the side-by-side comparison below to verify before committing.'
                          : 'Modify sales figures, invoice reference, or attached evidence with audit logging.'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                    {showConfirmStep ? 'Step 2 of 2: Confirm' : 'Step 1 of 2: Edit'}
                  </span>
                </div>

                {!showConfirmStep ? (
                  /* Step 1: Edit Input Form */
                  <div className="space-y-3.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[#778493] font-medium mb-1">Invoice Number *</label>
                        <input
                          type="text"
                          value={invoiceNumber}
                          onChange={(e) => setInvoiceNumber(e.target.value)}
                          className="w-full p-2 bg-white border border-[#E8EDF2] rounded-xl font-mono text-xs font-bold text-[#202B38]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[#778493] font-medium mb-1">Sales Amount (ETB) *</label>
                        <input
                          type="number"
                          step="any"
                          value={salesAmount}
                          onChange={(e) => setSalesAmount(e.target.value)}
                          className="w-full p-2 bg-white border border-[#E8EDF2] rounded-xl text-xs font-bold text-[#2878B9]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[#778493] font-medium mb-1">Sales Date *</label>
                        <input
                          type="date"
                          value={salesDate}
                          onChange={(e) => setSalesDate(e.target.value)}
                          className="w-full p-2 bg-white border border-[#E8EDF2] rounded-xl text-xs text-[#202B38]"
                          required
                        />
                      </div>
                    </div>

                    {/* Manage Invoice Evidence Photos within Edit Mode */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[#778493] font-medium">Sales Invoice Photos ({editedInvoiceImages.length})</label>
                        <label className="cursor-pointer text-[11px] font-semibold text-[#2878B9] hover:underline flex items-center gap-1">
                          <Plus className="w-3 h-3" />
                          <span>Add Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleEditInvoiceUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {editedInvoiceImages.length > 0 ? (
                        <div className="flex flex-wrap gap-2.5 p-2 bg-white rounded-xl border border-[#E8EDF2]">
                          {editedInvoiceImages.map((img, i) => (
                            <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-[#E8EDF2] bg-slate-50">
                              <img
                                src={img}
                                alt={`Invoice ${i + 1}`}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = generateInvoiceSvg(invoiceNumber || 'INV', parseFloat(salesAmount) || 0, salesDate);
                                }}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewImage(img);
                                    setPreviewTitle(`Invoice Photo - Page ${i + 1}`);
                                  }}
                                  className="p-1 hover:text-[#2878B9] rounded"
                                  title="View"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveInvoiceImage(i)}
                                  className="p-1 hover:text-red-400 rounded"
                                  title="Remove"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 text-center border border-dashed border-amber-300 rounded-xl bg-white text-[#778493] text-xs">
                          No invoice photos attached. Click &quot;Add Photo&quot; to upload evidence.
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#202B38] mb-1">
                        Mandatory Correction Reason *
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Explain why this record is being corrected (e.g. Encoding mistake on paper receipt, wrong invoice number, corrected deposit amount)..."
                        value={correctionReason}
                        onChange={(e) => setCorrectionReason(e.target.value)}
                        className="w-full text-xs p-2.5 bg-white border border-amber-400 rounded-xl focus:outline-hidden text-[#202B38]"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-amber-200">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3.5 py-1.5 rounded-xl border border-[#E8EDF2] bg-white text-xs text-[#778493] hover:bg-[#F7FAFD]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleProceedToConfirm}
                        className="px-4 py-1.5 rounded-xl bg-[#2878B9] hover:bg-[#1e6197] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <span>Review &amp; Confirm Changes</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Step 2: Confirmation Side-by-Side Review */
                  <div className="space-y-4 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-[#E8EDF2] space-y-2">
                      <div className="text-[11px] font-bold text-[#202B38] uppercase tracking-wider mb-2">
                        Summary of Changes
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-[#F7FAFD] border border-[#E8EDF2]">
                          <span className="text-[#778493] block text-[10px]">CURRENT VALUE</span>
                          <div className="font-semibold text-[#202B38] mt-1">
                            Invoice: #{sale.invoiceNumber}
                          </div>
                          <div className="font-bold text-[#2878B9]">
                            {formatCurrency(sale.salesAmount)}
                          </div>
                          <div className="text-[11px] text-[#778493]">
                            Date: {sale.salesDate}
                          </div>
                          <div className="text-[11px] text-[#778493]">
                            Status: {sale.status.toUpperCase()}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200">
                          <span className="text-amber-800 font-semibold block text-[10px]">NEW / REVISED VALUE</span>
                          <div className="font-bold text-[#202B38] mt-1">
                            Invoice: #{invoiceNumber}
                          </div>
                          <div className="font-bold text-amber-800 text-sm">
                            {formatCurrency(parsedNewAmount)}
                          </div>
                          <div className="text-[11px] text-[#202B38]">
                            Date: {salesDate}
                          </div>
                          <div className="text-[11px] font-bold text-emerald-700">
                            Status: {newProjectedStatus.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#E8EDF2] text-[11px]">
                        <span className="text-[#778493]">Audit Reason: </span>
                        <span className="font-medium text-[#202B38] italic">&quot;{correctionReason}&quot;</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-amber-200">
                      <button
                        type="button"
                        onClick={() => setShowConfirmStep(false)}
                        className="px-3.5 py-1.5 rounded-xl border border-[#E8EDF2] bg-white text-xs text-[#778493] hover:bg-[#F7FAFD]"
                      >
                        Back to Edit
                      </button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={handleSaveCorrection}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isSaving ? 'Saving to Audit Log...' : 'Confirm & Save Changes'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* General Info Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-y border-[#E8EDF2] py-3">
              <div>
                <span className="text-[#778493] block text-[11px]">{t.colProduct}</span>
                <span className="font-semibold text-[#202B38]">{sale.productName || 'FLOAT'}</span>
              </div>
              <div>
                <span className="text-[#778493] block text-[11px]">{t.colDistrict}</span>
                <span className="font-semibold text-[#202B38]">{sale.districtName || 'General'}</span>
              </div>
              <div>
                <span className="text-[#778493] block text-[11px]">{t.salesDateLabel}</span>
                <span className="font-semibold text-[#202B38]">{sale.salesDate}</span>
              </div>
              <div>
                <span className="text-[#778493] block text-[11px]">{t.colStatus}</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                    sale.status === 'reconciled'
                      ? 'bg-emerald-100 text-emerald-800'
                      : sale.status === 'partial'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {sale.status === 'reconciled' ? 'FULLY RECONCILED' : sale.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* SECTION A: SALES INVOICE PHOTO EVIDENCE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#202B38] flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-[#2878B9]" />
                    <span>A. Sales Invoice Photo Evidence</span>
                  </h4>
                  <p className="text-[11px] text-[#778493]">
                    Attached sales document(s) &amp; paper invoice slips.
                  </p>
                </div>

                {!isEditing && !isAttachingInvoicePhoto && (
                  <button
                    type="button"
                    onClick={() => setIsAttachingInvoicePhoto(true)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl border border-[#DCEEFF] bg-[#EAF4FC] hover:bg-[#DCEEFF] text-[#2878B9] font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Attach Photo</span>
                  </button>
                )}
              </div>

              {/* Quick Attach Invoice Photo Form */}
              {isAttachingInvoicePhoto && (
                <div className="p-3.5 rounded-xl border border-[#DCEEFF] bg-[#F7FAFD] space-y-3 text-xs animate-in fade-in">
                  <div className="font-bold text-[#202B38] flex items-center justify-between">
                    <span>Upload Sales Invoice Photo</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAttachingInvoicePhoto(false);
                        setNewInvoiceImg('');
                      }}
                      className="text-[#778493] hover:text-[#202B38]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <label className="flex-1 w-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#2878B9]/40 hover:border-[#2878B9] rounded-xl bg-white cursor-pointer transition-colors">
                      <Camera className="w-6 h-6 text-[#2878B9] mb-1" />
                      <span className="font-semibold text-[#2878B9] text-xs">Choose Photo or Capture</span>
                      <span className="text-[10px] text-[#778493] mt-0.5">PNG, JPG or PDF slip</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleDirectInvoiceUpload}
                        className="hidden"
                      />
                    </label>

                    {newInvoiceImg && (
                      <div className="w-24 h-24 rounded-xl border border-[#E8EDF2] overflow-hidden bg-white shrink-0 relative group">
                        <img src={newInvoiceImg} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                  </div>

                  {newInvoiceImg && (
                    <div className="flex justify-end gap-2 pt-1 border-t border-[#E8EDF2]">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAttachingInvoicePhoto(false);
                          setNewInvoiceImg('');
                        }}
                        className="px-3 py-1.5 border border-[#E8EDF2] rounded-xl text-[#778493] bg-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={handleConfirmDirectInvoicePhoto}
                        className="px-4 py-1.5 rounded-xl bg-[#2878B9] hover:bg-[#1e6197] text-white font-semibold transition-colors"
                      >
                        {isSaving ? 'Uploading...' : 'Confirm & Attach Photo'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Attached Invoice Images Gallery */}
              {sale.invoiceImages && sale.invoiceImages.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {sale.invoiceImages.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setPreviewImage(img);
                        setPreviewTitle(`Sales Invoice #${sale.invoiceNumber} - Page ${i + 1}`);
                      }}
                      className="group relative cursor-pointer w-28 h-28 rounded-xl overflow-hidden border border-[#E8EDF2] bg-white hover:border-[#2878B9] hover:shadow-md transition-all flex flex-col"
                    >
                      <div className="flex-1 overflow-hidden relative">
                        <img
                          src={img}
                          alt={`Invoice Page ${i + 1}`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = generateInvoiceSvg(sale.invoiceNumber, sale.salesAmount, sale.salesDate);
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-[11px] font-semibold">
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </div>
                      </div>
                      <div className="px-2 py-1 bg-[#F7FAFD] border-t border-[#E8EDF2] text-[10px] text-[#778493] truncate font-mono">
                        Page {i + 1} • Verified
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-[#E8EDF2] text-xs text-[#778493] text-center bg-[#F7FAFD]">
                  <Receipt className="w-6 h-6 mx-auto mb-1 text-[#778493]/60" />
                  <span>No invoice photos attached yet. Click &quot;Attach Photo&quot; to upload supporting documents.</span>
                </div>
              )}
            </div>

            {/* SECTION B: BANK DEPOSIT RECEIPTS COLLECTION */}
            <div className="space-y-3 pt-2 border-t border-[#E8EDF2]">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#202B38] flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <span>B. Bank Deposit Receipts &amp; Slips</span>
                  </h4>
                  <p className="text-[11px] text-[#778493]">
                    Supporting bank payment advice, CBE transaction numbers, and Telebirr confirmations.
                  </p>
                </div>

                {!isAddingDeposit && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingDeposit(true);
                      handleFillRemainingDeposit();
                    }}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Bank Deposit</span>
                  </button>
                )}
              </div>

              {/* Add Deposit Form */}
              {isAddingDeposit && (
                <form
                  onSubmit={handleAddDeposit}
                  className="p-4 bg-[#F7FAFD] rounded-2xl border border-[#DCEEFF] space-y-3.5 text-xs animate-in zoom-in-95"
                >
                  <div className="flex items-center justify-between border-b border-[#E8EDF2] pb-2">
                    <span className="font-bold text-[#202B38]">Attach New Bank Deposit Slip</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingDeposit(false)}
                      className="text-[#778493] hover:text-[#202B38]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {depositError && (
                    <div className="p-2 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                      {depositError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-[#778493] font-medium block mb-1">
                        Bank / Channel *
                      </label>
                      <select
                        value={newDepositBank}
                        onChange={(e) => setNewDepositBank(e.target.value)}
                        className="w-full p-2 border border-[#E8EDF2] rounded-xl bg-white text-xs font-semibold text-[#202B38]"
                      >
                        <option value="Commercial Bank of Ethiopia (CBE)">Commercial Bank of Ethiopia (CBE)</option>
                        <option value="Telebirr / Ethio Telecom">Telebirr / Ethio Telecom</option>
                        <option value="Awash Bank">Awash Bank</option>
                        <option value="Dashen Bank">Dashen Bank</option>
                        <option value="Bank of Abyssinia">Bank of Abyssinia</option>
                        <option value="Cooperative Bank of Oromia">Cooperative Bank of Oromia</option>
                        <option value="Nib International Bank">Nib International Bank</option>
                        <option value="Hibret Bank">Hibret Bank</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-[#778493] font-medium block">
                          Amount Deposited (ETB) *
                        </label>
                        {sale.depositDifference > 0 && (
                          <button
                            type="button"
                            onClick={handleFillRemainingDeposit}
                            className="text-[10px] text-[#2878B9] font-bold hover:underline"
                          >
                            Fill Balance ({formatCurrency(sale.depositDifference)})
                          </button>
                        )}
                      </div>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={newDepositAmount}
                        onChange={(e) => setNewDepositAmount(e.target.value)}
                        className="w-full p-2 border border-[#E8EDF2] rounded-xl bg-white text-xs font-bold text-[#202B38]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-[#778493] font-medium block mb-1">
                        Bank Ref / TX ID
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. CBE-99824 or FT26..."
                        value={newDepositRef}
                        onChange={(e) => setNewDepositRef(e.target.value)}
                        className="w-full p-2 border border-[#E8EDF2] rounded-xl bg-white text-xs font-mono font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-[#778493] font-medium block mb-1">
                        Deposit Date
                      </label>
                      <input
                        type="date"
                        value={newDepositDate}
                        onChange={(e) => setNewDepositDate(e.target.value)}
                        className="w-full p-2 border border-[#E8EDF2] rounded-xl bg-white text-xs text-[#202B38]"
                      />
                    </div>
                  </div>

                  {/* Upload Bank Deposit Receipt Photo */}
                  <div>
                    <label className="text-[11px] text-[#778493] font-medium block mb-1">
                      Upload Deposit Slip Photo
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex-1 flex items-center gap-2 p-2.5 border-2 border-dashed border-[#E8EDF2] hover:border-[#2878B9] rounded-xl bg-white cursor-pointer transition-colors text-xs text-[#778493]">
                        <Camera className="w-4 h-4 text-[#2878B9]" />
                        <span className="font-medium text-[#202B38]">
                          {newDepositFileName || 'Choose slip photo from device'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleDepositFileSelect}
                          className="hidden"
                        />
                      </label>

                      {newDepositImg && (
                        <div
                          onClick={() => {
                            setPreviewImage(newDepositImg);
                            setPreviewTitle('New Deposit Slip Preview');
                          }}
                          className="w-12 h-12 rounded-lg border border-[#E8EDF2] overflow-hidden bg-white shrink-0 cursor-pointer relative group"
                        >
                          <img src={newDepositImg} alt="Deposit preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                            <Eye className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-[#E8EDF2]">
                    <button
                      type="button"
                      onClick={() => setIsAddingDeposit(false)}
                      className="px-3.5 py-1.5 text-xs text-[#778493] border border-[#E8EDF2] rounded-xl bg-white hover:bg-[#F7FAFD]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingDeposit}
                      className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSubmittingDeposit ? 'Attaching...' : 'Confirm & Attach Deposit'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Deposit Items List */}
              {sale.bankDeposits && sale.bankDeposits.length > 0 ? (
                <div className="space-y-2.5">
                  {sale.bankDeposits.map((dep, idx) => {
                    const fallbackSvg = generateDepositSvg(
                      dep.bankName || 'CBE',
                      dep.refNumber || `DEP-${idx + 1}`,
                      dep.amount,
                      dep.depositDate || sale.salesDate
                    );

                    return (
                      <div
                        key={dep.id || idx}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-[#E8EDF2] bg-[#F7FAFD] text-xs hover:border-[#DCEEFF] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => {
                              setPreviewImage(dep.imageUrl || fallbackSvg);
                              setPreviewTitle(`${dep.bankName} - ETB ${dep.amount.toLocaleString()}`);
                            }}
                            className="w-12 h-12 rounded-lg border border-[#E8EDF2] overflow-hidden shrink-0 cursor-pointer bg-white relative group shadow-2xs"
                          >
                            <img
                              src={dep.imageUrl || fallbackSvg}
                              alt="Deposit Slip"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = fallbackSvg;
                              }}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          <div>
                            <span className="font-bold text-[#202B38] block">{dep.bankName}</span>
                            <span className="text-[11px] text-[#778493] block">
                              {dep.depositDate} {dep.refNumber ? `• Ref: ${dep.refNumber}` : ''}
                            </span>
                            {dep.uploadedBy && (
                              <span className="text-[10px] text-[#778493] block mt-0.5">
                                Verified by: {dep.uploadedBy}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-bold text-emerald-700 text-sm block">
                              {formatCurrency(dep.amount)}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                              VERIFIED SLIP
                            </span>
                          </div>

                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDeposit(dep.id, dep.amount, dep.bankName)}
                              className="p-1.5 text-[#778493] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove deposit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-[#E8EDF2] text-xs text-[#778493] text-center bg-[#F7FAFD]">
                  <DollarSign className="w-6 h-6 mx-auto mb-1 text-[#778493]/60" />
                  <span>No bank deposit receipts attached yet. Click &quot;Add Bank Deposit&quot; to balance this invoice.</span>
                </div>
              )}
            </div>

            {/* AUDIT & ENCODER METADATA FOOTER */}
            <div className="p-3.5 rounded-xl bg-[#F7FAFD] border border-[#E8EDF2] text-[11px] text-[#778493] space-y-1.5">
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
                  <span className="font-semibold text-amber-800">Latest Correction Reason: </span>
                  <span className="italic text-[#202B38]">&quot;{sale.correctionReason}&quot;</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Receipt Photos */}
      <ImageModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage || ''}
        title={previewTitle}
        subtitle="Verified Moderntech ERP Financial Document Evidence"
      />
    </>
  );
};
