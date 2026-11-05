import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { useAuth } from './AuthContext';
import {
  AppSetting,
  AuditLog,
  District,
  FloatReconciliationSummary,
  Product,
  ReportingPeriod,
  Sale,
  Shop,
  TransferOut,
  UserProfile
} from '../types';
import {
  INITIAL_DISTRICTS,
  INITIAL_PERIODS,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_SHOPS,
  INITIAL_TRANSFERS,
  INITIAL_USERS
} from '../services/seedData';
import { calculateReconciliation } from '../services/calculations';

interface ShopContextType {
  // Master lists
  shops: Shop[];
  districts: District[];
  products: Product[];
  sales: Sale[];
  transferOuts: TransferOut[];
  reportingPeriods: ReportingPeriod[];
  auditLogs: AuditLog[];
  allUsers: UserProfile[];
  appSetting: AppSetting;

  // Selected filters
  currentShopId: string;
  setCurrentShopId: (shopId: string) => void;
  currentMonthKey: string;
  setCurrentMonthKey: (month: string) => void;
  currentShop: Shop | undefined;
  activeDistricts: District[];
  currentPeriod: ReportingPeriod | undefined;

  // Real-time calculated summaries
  summary: FloatReconciliationSummary;
  filteredSales: Sale[];
  filteredTransfers: TransferOut[];
  adamaMainBreakdown: {
    shop: Shop;
    salesTotal: number;
    invoiceCount: number;
    deposited: number;
  }[];

  // Mutations
  addSale: (saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'totalDeposited' | 'depositDifference' | 'status'>) => Promise<Sale>;
  updateSale: (saleId: string, updates: Partial<Sale>, correctionReason: string) => Promise<void>;
  addTransferOut: (transferData: Omit<TransferOut, 'id' | 'createdAt'>) => Promise<void>;
  updateTransferOut: (transferId: string, updates: Partial<TransferOut>, reason: string) => Promise<void>;
  addShop: (shop: Omit<Shop, 'id' | 'createdAt'>) => Promise<void>;
  updateShop: (shopId: string, updates: Partial<Shop>) => Promise<void>;
  addDistrict: (district: Omit<District, 'id' | 'createdAt'>) => Promise<void>;
  updateDistrict: (districtId: string, updates: Partial<District>) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
  addUser: (user: Omit<UserProfile, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (userId: string, updates: Partial<UserProfile>) => Promise<void>;
  closeReportingPeriod: (shopId: string, monthKey: string) => Promise<void>;
  reopenReportingPeriod: (shopId: string, monthKey: string, reason: string) => Promise<void>;
  updateOpeningBalance: (shopId: string, monthKey: string, amount: number, reason: string) => Promise<void>;
  updateCommissionSettings: (rate: number, basis: 'transfer_out' | 'total_sales', effectiveMonthKey: string, reason?: string) => Promise<void>;
  updateAppSetting: (settings: Partial<AppSetting>) => Promise<void>;
}

const DEFAULT_SETTING: AppSetting = {
  id: 'global',
  defaultCommissionRate: 0.01,
  calculationBasis: 'transfer_out',
  currency: 'ETB',
  timezone: 'Africa/Addis_Ababa',
  effectiveMonthKey: '2026-10',
  updatedAt: new Date().toISOString(),
  history: [
    {
      rate: 0.01,
      basis: 'transfer_out',
      effectiveMonthKey: '2026-10',
      updatedBy: 'System Default',
      updatedAt: '2026-10-01T00:00:00Z',
      reason: 'Initial Moderntech 1% Up Front Commission rate'
    }
  ]
};

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile, isSuperAdmin, currentUser } = useAuth();

  const [shops, setShops] = useState<Shop[]>(INITIAL_SHOPS);
  const [districts, setDistricts] = useState<District[]>(INITIAL_DISTRICTS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [transferOuts, setTransferOuts] = useState<TransferOut[]>(INITIAL_TRANSFERS);
  const [reportingPeriods, setReportingPeriods] = useState<ReportingPeriod[]>(INITIAL_PERIODS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [appSetting, setAppSetting] = useState<AppSetting>(DEFAULT_SETTING);

  // Active view filters
  const [currentMonthKey, setCurrentMonthKey] = useState<string>('2026-10');
  const [currentShopId, setCurrentShopIdState] = useState<string>('jemo');

  // Enforce account isolation for currentShopId
  useEffect(() => {
    if (!userProfile) return;
    if (userProfile.role !== 'superadmin') {
      const allowed = userProfile.shopIds || ['jemo'];
      if (!allowed.includes(currentShopId)) {
        setCurrentShopIdState(allowed[0] || 'jemo');
      }
    }
  }, [userProfile, currentShopId]);

  const setCurrentShopId = (newShopId: string) => {
    if (!isSuperAdmin && (newShopId === 'all' || newShopId === 'adama_main')) return;
    if (!isSuperAdmin && userProfile && !userProfile.shopIds.includes(newShopId)) {
      console.warn('Unauthorized shop access attempt blocked:', newShopId);
      return;
    }
    setCurrentShopIdState(newShopId);
  };

  // Safe Firestore Synchronization:
  // Only subscribe to listeners when authenticated, and isolate superadmin streams
  useEffect(() => {
    // Read-only catalog listeners (safe even unauthenticated)
    let unsubShops: (() => void) | undefined;
    let unsubDistricts: (() => void) | undefined;
    let unsubProducts: (() => void) | undefined;
    let unsubSettings: (() => void) | undefined;

    try {
      unsubShops = onSnapshot(
        collection(db, 'shops'),
        (snapshot) => {
          if (!snapshot.empty) {
            const loaded: Shop[] = [];
            snapshot.forEach((doc) => loaded.push({ id: doc.id, ...doc.data() } as Shop));
            setShops(loaded);
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'shops')
      );

      unsubDistricts = onSnapshot(
        collection(db, 'districts'),
        (snapshot) => {
          if (!snapshot.empty) {
            const loaded: District[] = [];
            snapshot.forEach((doc) => loaded.push({ id: doc.id, ...doc.data() } as District));
            setDistricts(loaded);
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'districts')
      );

      unsubProducts = onSnapshot(
        collection(db, 'products'),
        (snapshot) => {
          if (!snapshot.empty) {
            const loaded: Product[] = [];
            snapshot.forEach((doc) => loaded.push({ id: doc.id, ...doc.data() } as Product));
            setProducts(loaded);
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'products')
      );

      unsubSettings = onSnapshot(
        collection(db, 'settings'),
        (snapshot) => {
          snapshot.forEach((doc) => {
            if (doc.id === 'global') {
              setAppSetting(doc.data() as AppSetting);
            }
          });
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'settings')
      );
    } catch (e) {
      console.warn('Catalog listener initialization notice:', e);
    }

    // Authenticated data listeners
    let unsubSales: (() => void) | undefined;
    let unsubTransfers: (() => void) | undefined;
    let unsubPeriods: (() => void) | undefined;
    let unsubLogs: (() => void) | undefined;
    let unsubUsers: (() => void) | undefined;

    if (currentUser) {
      try {
        unsubSales = onSnapshot(
          collection(db, 'sales'),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded: Sale[] = [];
              snapshot.forEach((doc) => loaded.push({ id: doc.id, ...doc.data() } as Sale));
              setSales(loaded);
            }
          },
          (error) => handleFirestoreError(error, OperationType.GET, 'sales')
        );

        unsubTransfers = onSnapshot(
          collection(db, 'transferOuts'),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded: TransferOut[] = [];
              snapshot.forEach((doc) => loaded.push({ id: doc.id, ...doc.data() } as TransferOut));
              setTransferOuts(loaded);
            }
          },
          (error) => handleFirestoreError(error, OperationType.GET, 'transferOuts')
        );

        unsubPeriods = onSnapshot(
          collection(db, 'reportingPeriods'),
          (snapshot) => {
            if (!snapshot.empty) {
              const loaded: ReportingPeriod[] = [];
              snapshot.forEach((doc) => loaded.push({ id: doc.id, ...doc.data() } as ReportingPeriod));
              setReportingPeriods(loaded);
            }
          },
          (error) => handleFirestoreError(error, OperationType.GET, 'reportingPeriods')
        );

        // Superadmin-only listeners
        if (isSuperAdmin) {
          unsubLogs = onSnapshot(
            collection(db, 'auditLogs'),
            (snapshot) => {
              if (!snapshot.empty) {
                const loaded: AuditLog[] = [];
                snapshot.forEach((doc) => loaded.push({ id: doc.id, ...doc.data() } as AuditLog));
                loaded.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setAuditLogs(loaded);
              }
            },
            (error) => handleFirestoreError(error, OperationType.GET, 'auditLogs')
          );

          unsubUsers = onSnapshot(
            collection(db, 'users'),
            (snapshot) => {
              if (!snapshot.empty) {
                const loaded: UserProfile[] = [];
                snapshot.forEach((doc) => loaded.push({ id: doc.id, ...doc.data() } as UserProfile));
                setAllUsers(loaded);
              }
            },
            (error) => handleFirestoreError(error, OperationType.GET, 'users')
          );
        }
      } catch (err) {
        console.warn('Authenticated listener initialization notice:', err);
      }
    }

    return () => {
      unsubShops?.();
      unsubDistricts?.();
      unsubProducts?.();
      unsubSettings?.();
      unsubSales?.();
      unsubTransfers?.();
      unsubPeriods?.();
      unsubLogs?.();
      unsubUsers?.();
    };
  }, [currentUser, isSuperAdmin]);

  // Helper to record audit log
  const recordAudit = async (log: Omit<AuditLog, 'id' | 'timestamp' | 'performedBy' | 'performedByEmail'>) => {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      performedBy: userProfile?.displayName || 'Superadmin',
      performedByEmail: userProfile?.email || 'admin@moderntech.com',
      ...log
    };

    setAuditLogs((prev) => [newLog, ...prev]);
    if (currentUser) {
      try {
        await setDoc(doc(db, 'auditLogs', newLog.id), newLog);
      } catch (e) {
        console.warn('Audit log write notice:', e);
      }
    }
  };

  const currentShop = useMemo(() => {
    return shops.find((s) => s.id === currentShopId);
  }, [shops, currentShopId]);

  const activeDistricts = useMemo(() => {
    if (currentShopId === 'all' || currentShopId === 'adama_main') return districts;
    return districts.filter((d) => d.shopId === currentShopId && d.status === 'active');
  }, [districts, currentShopId]);

  const currentPeriod = useMemo(() => {
    if (currentShopId === 'all') return undefined;
    return reportingPeriods.find(
      (p) => p.shopId === currentShopId && p.monthKey === currentMonthKey
    );
  }, [reportingPeriods, currentShopId, currentMonthKey]);

  // Designated 5 shops for ADAMA MAIN consolidation
  const ADAMA_MAIN_CONSOLIDATED_SHOPS = useMemo(() => ['adama', 'hawassa', 'borena', 'bale', 'assela'], []);

  // Filtered sales: handles individual shops, Adama Main consolidation, and 'all'
  const filteredSales = useMemo(() => {
    return sales
      .filter((s) => {
        // Strict Account Isolation: non-superadmin users can ONLY see their assigned shops
        if (!isSuperAdmin && userProfile && !userProfile.shopIds.includes(s.shopId)) {
          return false;
        }

        const matchMonth = currentMonthKey ? s.monthKey === currentMonthKey : true;
        if (!matchMonth) return false;

        if (currentShopId === 'all') {
          return true;
        }

        // ADAMA MAIN CONSOLIDATION:
        // Dynamically aggregates sales from the 5 assigned shops: Adama, Hawassa, Borena, Bale, Assela.
        // Explicitly excludes Jemo, Chiro, and Shashemene!
        if (currentShopId === 'adama_main') {
          return ADAMA_MAIN_CONSOLIDATED_SHOPS.includes(s.shopId);
        }

        // Standard operational shop
        return s.shopId === currentShopId;
      })
      .sort((a, b) => new Date(a.salesDate).getTime() - new Date(b.salesDate).getTime());
  }, [sales, currentShopId, currentMonthKey, isSuperAdmin, userProfile, ADAMA_MAIN_CONSOLIDATED_SHOPS]);

  // Breakdown of Adama Main's 5 operational shops
  const adamaMainBreakdown = useMemo(() => {
    if (currentShopId !== 'adama_main') return [];
    return ADAMA_MAIN_CONSOLIDATED_SHOPS.map((shopId) => {
      const sh = shops.find((s) => s.id === shopId) || { id: shopId, name: shopId, code: shopId.toUpperCase(), status: 'active', createdAt: '' };
      const sSales = sales.filter((s) => s.shopId === shopId && s.monthKey === currentMonthKey);
      const salesTotal = sSales.reduce((sum, s) => sum + s.salesAmount, 0);
      const deposited = sSales.reduce((sum, s) => sum + s.totalDeposited, 0);
      return {
        shop: sh,
        salesTotal,
        invoiceCount: sSales.length,
        deposited
      };
    });
  }, [currentShopId, ADAMA_MAIN_CONSOLIDATED_SHOPS, shops, sales, currentMonthKey]);

  // Filtered Transfer Out:
  const filteredTransfers = useMemo(() => {
    return transferOuts
      .filter((t) => {
        if (!isSuperAdmin && userProfile && !userProfile.shopIds.includes(t.shopId)) {
          return false;
        }
        const matchMonth = currentMonthKey ? t.monthKey === currentMonthKey : true;
        if (!matchMonth) return false;

        if (currentShopId === 'all') return true;
        if (currentShopId === 'adama_main') {
          return t.shopId === 'adama_main';
        }
        return t.shopId === currentShopId;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transferOuts, currentShopId, currentMonthKey, isSuperAdmin, userProfile]);

  // Float Reconciliation Summary Calculation:
  const summary = useMemo(() => {
    let openingBal = 0;
    if (currentPeriod) {
      openingBal = currentPeriod.openingBalance;
    } else if (currentShopId === 'jemo' && currentMonthKey === '2026-10') {
      openingBal = -1021;
    }

    return calculateReconciliation(openingBal, filteredTransfers, filteredSales, {
      commissionRate: appSetting.defaultCommissionRate,
      calculationBasis: appSetting.calculationBasis
    });
  }, [currentPeriod, filteredTransfers, filteredSales, appSetting, currentShopId, currentMonthKey]);

  // Actions
  const addSale = async (
    saleData: Omit<Sale, 'id' | 'createdAt' | 'updatedAt' | 'totalDeposited' | 'depositDifference' | 'status'>
  ): Promise<Sale> => {
    if (!isSuperAdmin && userProfile && !userProfile.shopIds.includes(saleData.shopId)) {
      throw new Error('Access denied: cannot record sales for an unauthorized shop.');
    }

    // Do not record sales directly into adama_main consolidation wrapper
    if (saleData.shopId === 'adama_main') {
      throw new Error('Adama Main is a consolidation account. Please select an operational branch (Adama, Hawassa, Borena, Bale, Assela) to record the sale.');
    }

    const totalDeposited = (saleData.bankDeposits || []).reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const depositDifference = saleData.salesAmount - totalDeposited;
    let status: Sale['status'] = 'unreconciled';
    if (totalDeposited === 0 && (!saleData.invoiceImages || saleData.invoiceImages.length === 0)) {
      status = 'evidence_pending';
    } else if (totalDeposited === 0) {
      status = 'unreconciled';
    } else if (totalDeposited === saleData.salesAmount) {
      status = 'reconciled';
    } else if (totalDeposited < saleData.salesAmount) {
      status = 'partial';
    } else {
      status = 'over_deposited';
    }

    const now = new Date().toISOString();
    const id = `sale-${saleData.shopId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const shop = shops.find((s) => s.id === saleData.shopId);
    const district = districts.find((d) => d.id === saleData.districtId);
    const product = products.find((p) => p.id === saleData.productId);

    const newSale: Sale = {
      ...saleData,
      id,
      shopName: shop?.name || saleData.shopId,
      districtName: district?.name,
      productName: product?.name || 'FLOAT',
      totalDeposited,
      depositDifference,
      status,
      createdAt: now,
      updatedAt: now
    };

    setSales((prev) => [newSale, ...prev]);

    if (currentUser) {
      try {
        await setDoc(doc(db, 'sales', id), newSale);
      } catch (err) {
        console.warn('Firestore sale sync notice:', err);
      }
    }

    await recordAudit({
      shopId: newSale.shopId,
      shopName: newSale.shopName,
      action: 'CREATE_SALE',
      entityType: 'sale',
      entityId: id,
      details: `Recorded invoice #${newSale.invoiceNumber} for ETB ${newSale.salesAmount.toLocaleString()} in ${newSale.shopName}`,
      newValues: newSale
    });

    return newSale;
  };

  const updateSale = async (saleId: string, updates: Partial<Sale>, correctionReason: string) => {
    const existingIndex = sales.findIndex((s) => s.id === saleId);
    if (existingIndex === -1) throw new Error('Sale not found');
    const existing = sales[existingIndex];

    if (!isSuperAdmin && userProfile && !userProfile.shopIds.includes(existing.shopId)) {
      throw new Error('Access denied: cannot edit sales for an unauthorized shop.');
    }

    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    const totalDeposited = (merged.bankDeposits || []).reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    merged.totalDeposited = totalDeposited;
    merged.depositDifference = merged.salesAmount - totalDeposited;

    if (totalDeposited === merged.salesAmount) {
      merged.status = 'reconciled';
    } else if (totalDeposited > merged.salesAmount) {
      merged.status = 'over_deposited';
    } else if (totalDeposited > 0) {
      merged.status = 'partial';
    } else if (!merged.invoiceImages?.length && !merged.bankDeposits?.length) {
      merged.status = 'evidence_pending';
    } else {
      merged.status = 'unreconciled';
    }

    merged.correctionReason = correctionReason;
    merged.updatedBy = userProfile?.email || 'user';

    const updatedList = [...sales];
    updatedList[existingIndex] = merged;
    setSales(updatedList);

    if (currentUser) {
      try {
        await updateDoc(doc(db, 'sales', saleId), merged);
      } catch (err) {
        console.warn('Firestore sale update notice:', err);
      }
    }

    await recordAudit({
      shopId: existing.shopId,
      shopName: existing.shopName,
      action: 'CORRECTION_SALE',
      entityType: 'sale',
      entityId: saleId,
      details: `Corrected invoice #${merged.invoiceNumber}: ${correctionReason}`,
      previousValues: existing,
      newValues: merged,
      reason: correctionReason
    });
  };

  const addTransferOut = async (transferData: Omit<TransferOut, 'id' | 'createdAt'>) => {
    if (!isSuperAdmin) {
      throw new Error('SECURITY VIOLATION: Only superadmins can record Transfer Out.');
    }

    const id = `to-${transferData.shopId}-${Date.now()}`;
    const shop = shops.find((s) => s.id === transferData.shopId);
    const newTO: TransferOut = {
      ...transferData,
      id,
      shopName: shop?.name || transferData.shopId,
      createdAt: new Date().toISOString()
    };

    setTransferOuts((prev) => [newTO, ...prev]);

    if (currentUser) {
      try {
        await setDoc(doc(db, 'transferOuts', id), newTO);
      } catch (err) {
        console.warn('Firestore transfer sync notice:', err);
      }
    }

    await recordAudit({
      shopId: newTO.shopId,
      shopName: newTO.shopName,
      action: 'CREATE_TRANSFER_OUT',
      entityType: 'transfer_out',
      entityId: id,
      details: `Transferred Out ETB ${newTO.amount.toLocaleString()} for ref #${newTO.refNumber} to ${newTO.shopName}`,
      newValues: newTO
    });
  };

  const updateTransferOut = async (transferId: string, updates: Partial<TransferOut>, reason: string) => {
    if (!isSuperAdmin) {
      throw new Error('SECURITY VIOLATION: Only superadmins can update Transfer Out.');
    }

    const existing = transferOuts.find((t) => t.id === transferId);
    if (!existing) return;

    const merged = { ...existing, ...updates };
    setTransferOuts((prev) => prev.map((t) => (t.id === transferId ? merged : t)));

    if (currentUser) {
      try {
        await updateDoc(doc(db, 'transferOuts', transferId), merged);
      } catch (err) {
        console.warn('Firestore transfer update notice:', err);
      }
    }

    await recordAudit({
      shopId: existing.shopId,
      shopName: existing.shopName,
      action: 'UPDATE_TRANSFER_OUT',
      entityType: 'transfer_out',
      entityId: transferId,
      details: `Updated Transfer Out #${merged.refNumber}: ${reason}`,
      previousValues: existing,
      newValues: merged,
      reason
    });
  };

  const addShop = async (shopData: Omit<Shop, 'id' | 'createdAt'>) => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    const id = shopData.code.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newShop: Shop = {
      ...shopData,
      id,
      createdAt: new Date().toISOString()
    };

    setShops((prev) => [...prev, newShop]);
    if (currentUser) {
      try {
        await setDoc(doc(db, 'shops', id), newShop);
      } catch (e) {
        console.warn(e);
      }
    }

    await recordAudit({
      shopId: id,
      shopName: newShop.name,
      action: 'CREATE_SHOP',
      entityType: 'shop',
      entityId: id,
      details: `Created new shop: ${newShop.name} (${newShop.code})`,
      newValues: newShop
    });
  };

  const updateShop = async (shopId: string, updates: Partial<Shop>) => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    setShops((prev) => prev.map((s) => (s.id === shopId ? { ...s, ...updates } : s)));
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'shops', shopId), updates);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const addDistrict = async (dist: Omit<District, 'id' | 'createdAt'>) => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    const id = `${dist.shopId}-${Date.now().toString(36)}`;
    const newDist: District = { ...dist, id, createdAt: new Date().toISOString() };
    setDistricts((prev) => [...prev, newDist]);
    if (currentUser) {
      try {
        await setDoc(doc(db, 'districts', id), newDist);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const updateDistrict = async (districtId: string, updates: Partial<District>) => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    setDistricts((prev) => prev.map((d) => (d.id === districtId ? { ...d, ...updates } : d)));
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'districts', districtId), updates);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const addProduct = async (prod: Omit<Product, 'id' | 'createdAt'>) => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    const id = prod.code.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newProduct: Product = { ...prod, id, createdAt: new Date().toISOString() };
    setProducts((prev) => [...prev, newProduct]);
    if (currentUser) {
      try {
        await setDoc(doc(db, 'products', id), newProduct);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, ...updates } : p)));
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'products', productId), updates);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const addUser = async (userData: Omit<UserProfile, 'id' | 'createdAt'>) => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    const id = `user-${Date.now()}`;
    const newUser: UserProfile = { ...userData, id, createdAt: new Date().toISOString() };
    setAllUsers((prev) => [...prev, newUser]);
    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', id), newUser);
      } catch (e) {
        console.warn(e);
      }
    }
    await recordAudit({
      action: 'INVITE_USER',
      entityType: 'user',
      entityId: id,
      details: `Added user ${newUser.email} with role ${newUser.role}`
    });
  };

  const updateUser = async (userId: string, updates: Partial<UserProfile>) => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    setAllUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updates } : u)));
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', userId), updates);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const closeReportingPeriod = async (shopId: string, monthKey: string) => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    const periodId = `${shopId}-${monthKey}`;
    const now = new Date().toISOString();

    const existingPeriod = reportingPeriods.find((p) => p.shopId === shopId && p.monthKey === monthKey);
    const updated: ReportingPeriod = {
      id: periodId,
      shopId,
      monthKey,
      monthName: existingPeriod?.monthName || monthKey,
      openingBalance: existingPeriod?.openingBalance || 0,
      status: 'closed',
      closedAt: now,
      closedBy: userProfile?.email || 'admin',
      createdAt: existingPeriod?.createdAt || now
    };

    setReportingPeriods((prev) => [...prev.filter((p) => p.id !== periodId), updated]);

    // Carry forward closing SOH to next month
    const closingSOH = summary.closingBalance;
    const [yearStr, monthStr] = monthKey.split('-');
    let nextYear = parseInt(yearStr);
    let nextMonth = parseInt(monthStr) + 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    const nextMonthKey = `${nextYear}-${nextMonth.toString().padStart(2, '0')}`;
    const nextPeriodId = `${shopId}-${nextMonthKey}`;

    const nextPeriod: ReportingPeriod = {
      id: nextPeriodId,
      shopId,
      monthKey: nextMonthKey,
      monthName: new Date(nextYear, nextMonth - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      openingBalance: closingSOH,
      status: 'open',
      createdAt: now
    };

    setReportingPeriods((prev) => [...prev.filter((p) => p.id !== nextPeriodId), nextPeriod]);

    if (currentUser) {
      try {
        await setDoc(doc(db, 'reportingPeriods', periodId), updated);
        await setDoc(doc(db, 'reportingPeriods', nextPeriodId), nextPeriod);
      } catch (e) {
        console.warn(e);
      }
    }

    await recordAudit({
      shopId,
      action: 'CLOSE_PERIOD',
      entityType: 'period',
      entityId: periodId,
      details: `Closed month ${monthKey}. Carried forward SOH ETB ${closingSOH.toLocaleString()} as opening balance for ${nextMonthKey}`
    });
  };

  const reopenReportingPeriod = async (shopId: string, monthKey: string, reason: string) => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    const periodId = `${shopId}-${monthKey}`;
    const existing = reportingPeriods.find((p) => p.id === periodId);
    if (!existing) return;

    const updated: ReportingPeriod = {
      ...existing,
      status: 'open',
      reopenReason: reason
    };

    setReportingPeriods((prev) => prev.map((p) => (p.id === periodId ? updated : p)));
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'reportingPeriods', periodId), updated);
      } catch (e) {
        console.warn(e);
      }
    }

    await recordAudit({
      shopId,
      action: 'REOPEN_PERIOD',
      entityType: 'period',
      entityId: periodId,
      details: `Reopened month ${monthKey}: ${reason}`,
      reason
    });
  };

  // Superadmin BBF Editing with Full Audit History
  const updateOpeningBalance = async (shopId: string, monthKey: string, amount: number, reason: string) => {
    if (!isSuperAdmin) throw new Error('Unauthorized: only superadmins can edit BBF.');
    const periodId = `${shopId}-${monthKey}`;
    const existing = reportingPeriods.find((p) => p.id === periodId);
    const prevAmount = existing?.openingBalance ?? 0;
    const now = new Date().toISOString();

    const newAdjustment = {
      previousBBF: prevAmount,
      newBBF: amount,
      adjustedBy: userProfile?.displayName || userProfile?.email || 'Superadmin',
      adjustedAt: now,
      reason
    };

    const updated: ReportingPeriod = {
      id: periodId,
      shopId,
      monthKey,
      monthName: existing?.monthName || monthKey,
      openingBalance: amount,
      status: existing?.status || 'open',
      createdAt: existing?.createdAt || now,
      bbfAdjustments: [...(existing?.bbfAdjustments || []), newAdjustment]
    };

    setReportingPeriods((prev) => [...prev.filter((p) => p.id !== periodId), updated]);
    if (currentUser) {
      try {
        await setDoc(doc(db, 'reportingPeriods', periodId), updated);
      } catch (e) {
        console.warn(e);
      }
    }

    await recordAudit({
      shopId,
      action: 'ADJUST_BBF',
      entityType: 'bbf',
      entityId: periodId,
      details: `Adjusted BBF for ${shopId} (${monthKey}) from ETB ${prevAmount.toLocaleString()} to ETB ${amount.toLocaleString()}: ${reason}`,
      previousValues: { openingBalance: prevAmount },
      newValues: { openingBalance: amount },
      reason
    });
  };

  // Superadmin Commission Settings
  const updateCommissionSettings = async (
    rate: number,
    basis: 'transfer_out' | 'total_sales',
    effectiveMonthKey: string,
    reason?: string
  ) => {
    if (!isSuperAdmin) throw new Error('Unauthorized: only superadmins can configure commission.');
    const now = new Date().toISOString();

    const newHistoryEntry = {
      rate,
      basis,
      effectiveMonthKey,
      updatedBy: userProfile?.displayName || userProfile?.email || 'Superadmin',
      updatedAt: now,
      reason: reason || 'Updated commission configuration'
    };

    const updated: AppSetting = {
      ...appSetting,
      defaultCommissionRate: rate,
      calculationBasis: basis,
      effectiveMonthKey,
      updatedAt: now,
      history: [...(appSetting.history || []), newHistoryEntry]
    };

    setAppSetting(updated);
    if (currentUser) {
      try {
        await setDoc(doc(db, 'settings', 'global'), updated);
      } catch (e) {
        console.warn(e);
      }
    }

    await recordAudit({
      action: 'UPDATE_COMMISSION_SETTINGS',
      entityType: 'setting',
      entityId: 'global',
      details: `Configured Up Front Commission rate to ${(rate * 100).toFixed(2)}% on ${basis} effective ${effectiveMonthKey}`,
      previousValues: { rate: appSetting.defaultCommissionRate, basis: appSetting.calculationBasis },
      newValues: { rate, basis, effectiveMonthKey },
      reason
    });
  };

  const updateAppSetting = async (updates: Partial<AppSetting>) => {
    if (!isSuperAdmin) throw new Error('Unauthorized');
    const updated = { ...appSetting, ...updates, updatedAt: new Date().toISOString() };
    setAppSetting(updated);
    if (currentUser) {
      try {
        await setDoc(doc(db, 'settings', 'global'), updated);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  return (
    <ShopContext.Provider
      value={{
        shops,
        districts,
        products,
        sales,
        transferOuts,
        reportingPeriods,
        auditLogs,
        allUsers,
        appSetting,
        currentShopId,
        setCurrentShopId,
        currentMonthKey,
        setCurrentMonthKey,
        currentShop,
        activeDistricts,
        currentPeriod,
        summary,
        filteredSales,
        filteredTransfers,
        adamaMainBreakdown,
        addSale,
        updateSale,
        addTransferOut,
        updateTransferOut,
        addShop,
        updateShop,
        addDistrict,
        updateDistrict,
        addProduct,
        updateProduct,
        addUser,
        updateUser,
        closeReportingPeriod,
        reopenReportingPeriod,
        updateOpeningBalance,
        updateCommissionSettings,
        updateAppSetting
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
