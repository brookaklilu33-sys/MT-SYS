import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  ChevronDown,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  PlusCircle,
  Table,
  ArrowRightLeft,
  Settings,
  CheckCircle2,
  Globe,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useShop } from '../../context/ShopContext';
import { getTranslation } from '../../services/i18n';
import { Language } from '../../types';

interface HeaderProps {
  currentTab: 'dashboard' | 'spreadsheet' | 'transfer' | 'audit' | 'admin';
  setCurrentTab: (tab: 'dashboard' | 'spreadsheet' | 'transfer' | 'audit' | 'admin') => void;
  onOpenRecordSale: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  onOpenRecordSale
}) => {
  const { userProfile, signOut, signInWithGoogle, currentUser, switchDemoRole, isSuperAdmin, language, setLanguage } = useAuth();
  const {
    shops,
    currentShopId,
    setCurrentShopId,
    currentMonthKey,
    setCurrentMonthKey
  } = useShop();

  const t = getTranslation(language);

  const [showShopDropdown, setShowShopDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showRoleTester, setShowRoleTester] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const availableMonths = [
    { key: '2026-10', label: 'October 2026' },
    { key: '2026-11', label: 'November 2026' },
    { key: '2026-12', label: 'December 2026' }
  ];

  const currentMonthLabel =
    availableMonths.find((m) => m.key === currentMonthKey)?.label || currentMonthKey;

  const currentShopName =
    currentShopId === 'all'
      ? t.allShops
      : currentShopId === 'adama_main'
      ? t.adamaMain
      : shops.find((s) => s.id === currentShopId)?.name || 'Select Shop';

  // Allowed shops for dropdown
  const selectableShops = isSuperAdmin
    ? shops
    : shops.filter((s) => userProfile?.shopIds.includes(s.id));

  const languagesList: { code: Language; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'am', label: 'Amharic', native: 'አማርኛ' },
    { code: 'om', label: 'Afaan Oromoo', native: 'Afaan Oromoo' }
  ];

  return (
    <header className="bg-white border-b border-[#E8EDF2] sticky top-0 z-40">
      {/* Top Banner / Role Switcher for Testing Security Isolation */}
      <div className="bg-[#EAF4FC] border-b border-[#DCEEFF] px-4 py-1 text-xs text-[#202B38] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-[#2878B9] text-white">
            {userProfile?.role.replace('_', ' ').toUpperCase()}
          </span>
          <span className="text-[#778493] hidden sm:inline">{t.activeUser}:</span>
          <span className="font-medium text-[#202B38] truncate max-w-[200px]">
            {userProfile?.displayName} ({userProfile?.email})
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Selector in Top Banner */}
          <div className="relative">
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#202B38] hover:text-[#2878B9] px-2 py-0.5 rounded hover:bg-white/80 transition-colors"
            >
              <Globe className="w-3 h-3 text-[#2878B9]" />
              <span>{languagesList.find((l) => l.code === language)?.native || 'English'}</span>
              <ChevronDown className="w-2.5 h-2.5" />
            </button>

            {showLangDropdown && (
              <div className="absolute right-0 mt-1 w-36 bg-white border border-[#E8EDF2] rounded-lg shadow-lg py-1 z-50 text-xs">
                {languagesList.map((langItem) => (
                  <button
                    key={langItem.code}
                    onClick={() => {
                      setLanguage(langItem.code);
                      setShowLangDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-[#EAF4FC] flex items-center justify-between ${
                      language === langItem.code ? 'font-bold text-[#2878B9] bg-[#EAF4FC]/50' : 'text-[#202B38]'
                    }`}
                  >
                    <span>{langItem.native}</span>
                    {language === langItem.code && <CheckCircle2 className="w-3 h-3 text-[#2878B9]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowRoleTester(!showRoleTester)}
            className="text-[11px] font-medium text-[#2878B9] hover:underline flex items-center gap-1"
          >
            <span>{t.testIsolation}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Role Switcher Drawer */}
      {showRoleTester && (
        <div className="bg-white border-b border-[#E8EDF2] p-3 px-4 text-xs shadow-sm flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="text-[#778493]">
            <strong className="text-[#202B38]">{t.testIsolation}:</strong> {t.testIsolationDesc}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                switchDemoRole('superadmin');
                setShowRoleTester(false);
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                userProfile?.role === 'superadmin'
                  ? 'bg-[#2878B9] text-white border-[#2878B9]'
                  : 'bg-white text-[#202B38] border-[#E8EDF2] hover:bg-[#F7FAFD]'
              }`}
            >
              Superadmin (Global)
            </button>
            <button
              onClick={() => {
                switchDemoRole('shop_manager', 'jemo');
                setShowRoleTester(false);
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                userProfile?.role === 'shop_manager' && userProfile?.shopIds.includes('jemo')
                  ? 'bg-[#2878B9] text-white border-[#2878B9]'
                  : 'bg-white text-[#202B38] border-[#E8EDF2] hover:bg-[#F7FAFD]'
              }`}
            >
              Jemo Manager (Jemo Only)
            </button>
            <button
              onClick={() => {
                switchDemoRole('shop_manager', 'adama');
                setShowRoleTester(false);
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                userProfile?.role === 'shop_manager' && userProfile?.shopIds.includes('adama')
                  ? 'bg-[#2878B9] text-white border-[#2878B9]'
                  : 'bg-white text-[#202B38] border-[#E8EDF2] hover:bg-[#F7FAFD]'
              }`}
            >
              Adama Manager (Adama Only)
            </button>
            <button
              onClick={() => {
                switchDemoRole('shop_manager', 'hawassa');
                setShowRoleTester(false);
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                userProfile?.role === 'shop_manager' && userProfile?.shopIds.includes('hawassa')
                  ? 'bg-[#2878B9] text-white border-[#2878B9]'
                  : 'bg-white text-[#202B38] border-[#E8EDF2] hover:bg-[#F7FAFD]'
              }`}
            >
              Hawassa Manager (Hawassa Only)
            </button>
            <button
              onClick={() => {
                switchDemoRole('shop_manager', 'chiro');
                setShowRoleTester(false);
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                userProfile?.role === 'shop_manager' && userProfile?.shopIds.includes('chiro')
                  ? 'bg-[#2878B9] text-white border-[#2878B9]'
                  : 'bg-white text-[#202B38] border-[#E8EDF2] hover:bg-[#F7FAFD]'
              }`}
            >
              Chiro Manager (Chiro Only)
            </button>
          </div>
        </div>
      )}

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Navigation */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <img
                src="https://www.moderntechethiopia.com/wp-content/uploads/2019/05/moderntech.jpg"
                alt="Moderntech"
                className="h-8 w-auto object-contain rounded"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="leading-tight">
                <span className="font-bold text-base tracking-tight text-[#202B38]">Moderntech</span>
                <span className="text-[11px] font-semibold tracking-wider text-[#2878B9] block">{t.shopErp}</span>
              </div>
            </div>

            {/* Shop Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowShopDropdown(!showShopDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E8EDF2] bg-[#F7FAFD] hover:bg-[#EAF4FC] text-xs font-medium text-[#202B38] transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-[#2878B9]" />
                <span className="truncate max-w-[140px] sm:max-w-[200px] font-semibold">{currentShopName}</span>
                <ChevronDown className="w-3 h-3 text-[#778493]" />
              </button>

              {showShopDropdown && (
                <div className="absolute left-0 mt-1.5 w-64 bg-white border border-[#E8EDF2] rounded-lg shadow-lg py-1 z-50 text-xs max-h-96 overflow-y-auto">
                  <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-[#778493] font-semibold border-b border-[#E8EDF2]">
                    {t.selectBranch}
                  </div>

                  {isSuperAdmin && (
                    <>
                      {/* Special Administrative Account: ADAMA MAIN */}
                      <button
                        onClick={() => {
                          setCurrentShopId('adama_main');
                          setShowShopDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 hover:bg-[#EAF4FC] flex items-center justify-between border-b border-[#E8EDF2] ${
                          currentShopId === 'adama_main' ? 'font-bold text-[#2878B9] bg-[#EAF4FC]' : 'text-[#202B38] bg-[#F7FAFD]'
                        }`}
                      >
                        <div>
                          <div className="font-bold flex items-center gap-1.5 text-[#2878B9]">
                            <Layers className="w-3.5 h-3.5" />
                            <span>ADAMA MAIN (Consolidated)</span>
                          </div>
                          <div className="text-[10px] text-[#778493]">Adama, Hawassa, Borena, Bale, Assela</div>
                        </div>
                        {currentShopId === 'adama_main' && <CheckCircle2 className="w-3.5 h-3.5 text-[#2878B9]" />}
                      </button>

                      <button
                        onClick={() => {
                          setCurrentShopId('all');
                          setShowShopDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-[#EAF4FC] flex items-center justify-between border-b border-[#E8EDF2] ${
                          currentShopId === 'all' ? 'font-semibold text-[#2878B9] bg-[#EAF4FC]/60' : 'text-[#202B38]'
                        }`}
                      >
                        <span>{t.allShops}</span>
                        {currentShopId === 'all' && <CheckCircle2 className="w-3.5 h-3.5 text-[#2878B9]" />}
                      </button>
                    </>
                  )}

                  <div className="px-3 py-1 text-[9px] uppercase tracking-wider text-[#778493] bg-[#F7FAFD]">
                    Operational Branches ({selectableShops.filter((s) => !s.isConsolidated).length})
                  </div>

                  {selectableShops
                    .filter((s) => !s.isConsolidated)
                    .map((shop) => (
                      <button
                        key={shop.id}
                        onClick={() => {
                          setCurrentShopId(shop.id);
                          setShowShopDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-[#EAF4FC] flex items-center justify-between ${
                          currentShopId === shop.id ? 'font-semibold text-[#2878B9] bg-[#EAF4FC]/60' : 'text-[#202B38]'
                        }`}
                      >
                        <div>
                          <div className="font-medium">{shop.name}</div>
                          <div className="text-[10px] text-[#778493]">{shop.code} • {shop.location || 'Ethiopia'}</div>
                        </div>
                        {currentShopId === shop.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#2878B9]" />}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Reporting Month Selector */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E8EDF2] bg-[#F7FAFD] hover:bg-[#EAF4FC] text-xs font-medium text-[#202B38] transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-[#2878B9]" />
                <span>{currentMonthLabel}</span>
                <ChevronDown className="w-3 h-3 text-[#778493]" />
              </button>

              {showMonthDropdown && (
                <div className="absolute left-0 mt-1.5 w-44 bg-white border border-[#E8EDF2] rounded-lg shadow-lg py-1 z-50 text-xs">
                  <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-[#778493] font-semibold border-b border-[#E8EDF2]">
                    {t.reportingCycle}
                  </div>
                  {availableMonths.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => {
                        setCurrentMonthKey(m.key);
                        setShowMonthDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-[#EAF4FC] flex items-center justify-between ${
                        currentMonthKey === m.key ? 'font-semibold text-[#2878B9] bg-[#EAF4FC]/60' : 'text-[#202B38]'
                      }`}
                    >
                      <span>{m.label}</span>
                      {currentMonthKey === m.key && <CheckCircle2 className="w-3.5 h-3.5 text-[#2878B9]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                currentTab === 'dashboard'
                  ? 'bg-[#EAF4FC] text-[#2878B9] font-semibold'
                  : 'text-[#778493] hover:text-[#202B38] hover:bg-[#F7FAFD]'
              }`}
            >
              {t.dashboard}
            </button>

            <button
              onClick={() => setCurrentTab('spreadsheet')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                currentTab === 'spreadsheet'
                  ? 'bg-[#EAF4FC] text-[#2878B9] font-semibold'
                  : 'text-[#778493] hover:text-[#202B38] hover:bg-[#F7FAFD]'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>{t.spreadsheet}</span>
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => setCurrentTab('transfer')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  currentTab === 'transfer'
                    ? 'bg-[#EAF4FC] text-[#2878B9] font-semibold'
                    : 'text-[#778493] hover:text-[#202B38] hover:bg-[#F7FAFD]'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>{t.transferOut}</span>
              </button>
            )}

            <button
              onClick={() => setCurrentTab('audit')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                currentTab === 'audit'
                  ? 'bg-[#EAF4FC] text-[#2878B9] font-semibold'
                  : 'text-[#778493] hover:text-[#202B38] hover:bg-[#F7FAFD]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t.auditLog}</span>
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => setCurrentTab('admin')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  currentTab === 'admin'
                    ? 'bg-[#EAF4FC] text-[#2878B9] font-semibold'
                    : 'text-[#778493] hover:text-[#202B38] hover:bg-[#F7FAFD]'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{t.adminControl}</span>
              </button>
            )}
          </nav>

          {/* Right Action: Record Sale Button & User Menu */}
          <div className="flex items-center gap-3">
            {currentShopId !== 'adama_main' && (
              <button
                onClick={onOpenRecordSale}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2878B9] hover:bg-[#1e6197] text-white text-xs font-medium shadow-xs transition-all active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{t.recordSale}</span>
              </button>
            )}

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1 pl-2 rounded-lg border border-[#E8EDF2] hover:bg-[#F7FAFD] text-xs text-[#202B38]"
              >
                <div className="w-6 h-6 rounded-full bg-[#DCEEFF] flex items-center justify-center text-[#2878B9] font-semibold text-[10px]">
                  {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <ChevronDown className="w-3 h-3 text-[#778493]" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-1.5 w-60 bg-white border border-[#E8EDF2] rounded-lg shadow-lg py-2 z-50 text-xs">
                  <div className="px-3 pb-2 border-b border-[#E8EDF2]">
                    <div className="font-semibold text-[#202B38] truncate">{userProfile?.displayName}</div>
                    <div className="text-[#778493] text-[11px] truncate">{userProfile?.email}</div>
                    <div className="mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#EAF4FC] text-[#2878B9]">
                      Role: {userProfile?.role}
                    </div>
                  </div>

                  <div className="py-1">
                    {currentUser ? (
                      <button
                        onClick={() => {
                          signOut();
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-[#F7FAFD] text-red-600 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t.signOut}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          signInWithGoogle();
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-[#EAF4FC] text-[#2878B9] font-medium flex items-center gap-2"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{t.signInWithGoogle}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="lg:hidden flex items-center justify-between border-t border-[#E8EDF2] py-2 overflow-x-auto gap-1">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`px-3 py-1 rounded text-xs whitespace-nowrap ${
              currentTab === 'dashboard' ? 'bg-[#EAF4FC] text-[#2878B9] font-semibold' : 'text-[#778493]'
            }`}
          >
            {t.dashboard}
          </button>
          <button
            onClick={() => setCurrentTab('spreadsheet')}
            className={`px-3 py-1 rounded text-xs whitespace-nowrap ${
              currentTab === 'spreadsheet' ? 'bg-[#EAF4FC] text-[#2878B9] font-semibold' : 'text-[#778493]'
            }`}
          >
            {t.spreadsheet}
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setCurrentTab('transfer')}
              className={`px-3 py-1 rounded text-xs whitespace-nowrap ${
                currentTab === 'transfer' ? 'bg-[#EAF4FC] text-[#2878B9] font-semibold' : 'text-[#778493]'
              }`}
            >
              {t.transferOut}
            </button>
          )}
          <button
            onClick={() => setCurrentTab('audit')}
            className={`px-3 py-1 rounded text-xs whitespace-nowrap ${
              currentTab === 'audit' ? 'bg-[#EAF4FC] text-[#2878B9] font-semibold' : 'text-[#778493]'
            }`}
          >
            {t.auditLog}
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`px-3 py-1 rounded text-xs whitespace-nowrap ${
                currentTab === 'admin' ? 'bg-[#EAF4FC] text-[#2878B9] font-semibold' : 'text-[#778493]'
              }`}
            >
              {t.adminControl}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
