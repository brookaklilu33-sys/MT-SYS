import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Calendar,
  Building,
  User,
  Clock,
  ArrowRight,
  FileText,
  AlertCircle,
  Download,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  DollarSign,
  ArrowRightLeft,
  Settings
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { AuditLog } from '../../types';
import { getTranslation } from '../../services/i18n';

export const AuditLogViewer: React.FC = () => {
  const { auditLogs, shops, currentShopId } = useShop();
  const { userProfile, isSuperAdmin, language } = useAuth();
  const t = getTranslation(language);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShopFilter, setSelectedShopFilter] = useState<string>('all');
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Security isolation: non-superadmin only sees logs relevant to their shops
  const authorizedLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (isSuperAdmin) return true;
      if (!log.shopId) return true;
      return userProfile?.shopIds.includes(log.shopId);
    });
  }, [auditLogs, isSuperAdmin, userProfile]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return authorizedLogs.filter((log) => {
      const matchesSearch =
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.performedByEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.reason && log.reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.entityId && log.entityId.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesShop =
        selectedShopFilter === 'all' ? true : log.shopId === selectedShopFilter;

      const matchesEntity =
        selectedEntityFilter === 'all' ? true : log.entityType === selectedEntityFilter;

      return matchesSearch && matchesShop && matchesEntity;
    });
  }, [authorizedLogs, searchTerm, selectedShopFilter, selectedEntityFilter]);

  // Metric counts
  const totalLogsCount = authorizedLogs.length;
  const saleCorrectionsCount = authorizedLogs.filter((l) => l.action.includes('CORRECTION')).length;
  const bbfAdjustmentsCount = authorizedLogs.filter((l) => l.action.includes('BBF')).length;
  const transferOutCount = authorizedLogs.filter((l) => l.action.includes('TRANSFER_OUT')).length;

  const exportAuditCSV = () => {
    const headers = [
      'Timestamp',
      'Action',
      'Shop',
      'Entity Type',
      'Entity ID',
      'Performed By',
      'User Email',
      'Details',
      'Reason'
    ];

    const rows = filteredLogs.map((l) => [
      l.timestamp,
      l.action,
      l.shopName || l.shopId || 'HQ',
      l.entityType,
      l.entityId,
      l.performedBy,
      l.performedByEmail,
      l.details.replace(/"/g, '""'),
      (l.reason || '').replace(/"/g, '""')
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Moderntech_Audit_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CORRECTION') || action.includes('ADJUST')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    if (action.includes('CREATE')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (action.includes('CLOSE') || action.includes('REOPEN')) {
      return 'bg-blue-100 text-[#2878B9] border-blue-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="space-y-6">
      {/* Header and Summary Cards */}
      <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#EAF4FC] text-[#2878B9] flex items-center justify-center font-bold">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h1 className="text-lg font-bold text-[#202B38]">System Audit Trail & Modification History</h1>
            </div>
            <p className="text-xs text-[#778493] mt-1">
              Immutable chronological record of sales recordings, encoding corrections, BBF adjustments, and Float allocations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportAuditCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8EDF2] bg-[#F7FAFD] hover:bg-[#EAF4FC] text-xs font-semibold text-[#202B38] transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#2878B9]" />
              <span>Export Audit CSV</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#E8EDF2]">
          <div className="p-3 bg-[#F7FAFD] rounded-xl border border-[#E8EDF2]">
            <span className="text-[11px] text-[#778493] block">Total Audit Records</span>
            <span className="text-base font-bold text-[#202B38]">{totalLogsCount}</span>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
            <span className="text-[11px] text-amber-700 block">Sales Corrections</span>
            <span className="text-base font-bold text-amber-900">{saleCorrectionsCount}</span>
          </div>

          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
            <span className="text-[11px] text-blue-700 block">BBF Adjustments</span>
            <span className="text-base font-bold text-blue-900">{bbfAdjustmentsCount}</span>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-[11px] text-emerald-700 block">Transfer Out Events</span>
            <span className="text-base font-bold text-emerald-900">{transferOutCount}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#E8EDF2]">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#778493] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search invoice #, user, reason, action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl text-[#202B38] focus:border-[#2878B9] focus:outline-hidden"
            />
          </div>

          {/* Shop Filter */}
          <div>
            <select
              value={selectedShopFilter}
              onChange={(e) => setSelectedShopFilter(e.target.value)}
              className="w-full text-xs p-2 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl text-[#202B38] focus:border-[#2878B9] focus:outline-hidden"
            >
              <option value="all">All Shops</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Entity Type Filter */}
          <div>
            <select
              value={selectedEntityFilter}
              onChange={(e) => setSelectedEntityFilter(e.target.value)}
              className="w-full text-xs p-2 bg-[#F7FAFD] border border-[#E8EDF2] rounded-xl text-[#202B38] focus:border-[#2878B9] focus:outline-hidden"
            >
              <option value="all">All Entity Types</option>
              <option value="sale">Sales Transactions</option>
              <option value="transfer_out">Transfer Out Allocations</option>
              <option value="bbf">BBF (Beginning Balance)</option>
              <option value="period">Monthly Reporting Periods</option>
              <option value="setting">Commission & Settings</option>
              <option value="user">User Profiles</option>
              <option value="shop">Shops & Branches</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Timeline / Table */}
      <div className="bg-white rounded-2xl border border-[#E8EDF2] shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-[#F7FAFD] border-b border-[#E8EDF2] flex items-center justify-between text-xs font-semibold text-[#202B38]">
          <span>Audit Log Entries ({filteredLogs.length})</span>
          <span className="text-[11px] text-[#778493]">Real-time synchronization active</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#778493]">
            No audit records matching the specified criteria.
          </div>
        ) : (
          <div className="divide-y divide-[#E8EDF2]">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const hasDiff = log.previousValues || log.newValues;

              return (
                <div key={log.id} className="p-4 hover:bg-[#F7FAFD]/60 transition-colors text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start sm:items-center gap-2.5">
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="p-1 rounded text-[#778493] hover:text-[#202B38] hover:bg-[#EAF4FC]"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-[#2878B9]" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>

                      {log.shopName && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#202B38] px-2 py-0.5 rounded bg-[#EAF4FC] border border-[#DCEEFF]">
                          <Building className="w-3 h-3 text-[#2878B9]" />
                          <span>{log.shopName}</span>
                        </span>
                      )}

                      <span className="font-medium text-[#202B38]">{log.details}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#778493] pl-7 sm:pl-0">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-[#778493]" />
                        <span className="text-[#202B38] font-medium">{log.performedBy}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#778493]" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Mandatory Reason Note */}
                  {log.reason && (
                    <div className="mt-2 ml-7 p-2 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>
                        <strong>Correction / Adjustment Reason: </strong>
                        <span className="italic">{log.reason}</span>
                      </span>
                    </div>
                  )}

                  {/* Expanded Diff Viewer */}
                  {isExpanded && (
                    <div className="mt-3 ml-7 p-3 bg-white rounded-xl border border-[#E8EDF2] space-y-3">
                      <div className="text-[11px] font-semibold text-[#778493] uppercase tracking-wider">
                        Technical Audit Details & Payload
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {log.previousValues && (
                          <div className="p-2.5 rounded-lg bg-red-50/50 border border-red-200">
                            <span className="block font-semibold text-red-800 text-[11px] mb-1">
                              Previous Values (Before Change)
                            </span>
                            <pre className="font-mono text-[10px] overflow-x-auto text-red-950 p-2 bg-white rounded border border-red-100 max-h-48">
                              {JSON.stringify(log.previousValues, null, 2)}
                            </pre>
                          </div>
                        )}

                        {log.newValues && (
                          <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200">
                            <span className="block font-semibold text-emerald-800 text-[11px] mb-1">
                              New Values (After Change)
                            </span>
                            <pre className="font-mono text-[10px] overflow-x-auto text-emerald-950 p-2 bg-white rounded border border-emerald-100 max-h-48">
                              {JSON.stringify(log.newValues, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-between text-[10px] text-[#778493] pt-1 border-t border-[#E8EDF2]">
                        <span>Log ID: {log.id}</span>
                        <span>Entity ID: {log.entityId}</span>
                        <span>Actor Email: {log.performedByEmail}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
