/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShopProvider, useShop } from './context/ShopContext';
import { Header } from './components/common/Header';
import { ShopDashboard } from './components/dashboard/ShopDashboard';
import { ShopSpreadsheet } from './components/spreadsheet/ShopSpreadsheet';
import { TransferOutManagement } from './components/transfer/TransferOutManagement';
import { SuperadminDashboard } from './components/admin/SuperadminDashboard';
import { AuditLogViewer } from './components/audit/AuditLogViewer';
import { RecordSaleModal } from './components/sales/RecordSaleModal';
import { SaleDetailModal } from './components/sales/SaleDetailModal';
import { Sale } from './types';

function ERPAppContent() {
  const { isSuperAdmin } = useAuth();
  const { setCurrentShopId } = useShop();

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'spreadsheet' | 'transfer' | 'audit' | 'admin'>('dashboard');
  const [isRecordSaleOpen, setIsRecordSaleOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const handleSelectShopFromAdmin = (shopId: string) => {
    setCurrentShopId(shopId);
    setCurrentTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F7FAFD] flex flex-col font-sans text-[#202B38]">
      {/* Top Minimalist Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenRecordSale={() => setIsRecordSaleOpen(true)}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <ShopDashboard
            onOpenRecordSale={() => setIsRecordSaleOpen(true)}
            onViewSpreadsheet={() => setCurrentTab('spreadsheet')}
            onSelectSale={(sale) => setSelectedSale(sale)}
          />
        )}

        {currentTab === 'spreadsheet' && (
          <ShopSpreadsheet
            onOpenRecordSale={() => setIsRecordSaleOpen(true)}
            onSelectSale={(sale) => setSelectedSale(sale)}
          />
        )}

        {currentTab === 'transfer' && isSuperAdmin && (
          <TransferOutManagement />
        )}

        {currentTab === 'audit' && (
          <AuditLogViewer />
        )}

        {currentTab === 'admin' && isSuperAdmin && (
          <SuperadminDashboard
            onSelectShop={handleSelectShopFromAdmin}
          />
        )}
      </main>

      {/* Record Sale Modal (Mobile-first fast sequential encoding) */}
      <RecordSaleModal
        isOpen={isRecordSaleOpen}
        onClose={() => setIsRecordSaleOpen(false)}
      />

      {/* Transaction & Evidence Detail Modal */}
      <SaleDetailModal
        sale={selectedSale}
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-[#E8EDF2] py-4 text-center text-xs text-[#778493] no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Moderntech Shop ERP — Centralized Multi-Branch Financial & Evidence Reconciliation</span>
          <span className="font-mono text-[11px] text-[#2878B9]">ISO 9001 Audited Ledger • Addis Ababa, Ethiopia</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <ERPAppContent />
      </ShopProvider>
    </AuthProvider>
  );
}
