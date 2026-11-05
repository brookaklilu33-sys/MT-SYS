# Moderntech Shop ERP

**Moderntech Shop & Multi-Branch Sales Recording and Float Reconciliation System**

A web-based Enterprise Resource Planning (ERP) platform built for **Moderntech** to manage shop sales recordings, Float allocations, sales receipt evidence, multi-deposit bank slips, monthly reporting cycles, inventory balances (SOH), and centralized multi-branch auditing.

---

## 1. Core Architecture & Key Features

- **Strict Account Isolation & RBAC**:
  - Independent accounts for **Adama**, **Chiro**, and **Jemo**, plus dynamic creation of expansion branches.
  - Granular sub-district management (e.g. Adama District 1, 2, 3, 4).
  - Role-based permissions (`superadmin`, `shop_manager`, `recorder`, `auditor`).
  - Users assigned to Jemo cannot see or query Adama or Chiro data. Deny-by-default Firestore rules enforce isolation server-side.
- **Mobile-First Sales Encoding & Document Evidence**:
  - Sequential, fast recording flow designed for 1-minute mobile data entry.
  - Camera & photo gallery capture for multi-page sales invoices.
  - Unlimited bank deposit receipts per sales invoice, each with bank channel (CBE, Telebirr, Awash, Dashen), deposit date, reference number, and deposit amount.
  - Instant client-side reconciliation difference calculation (`Sales Amount - Total Deposited`).
- **Mathematical Float Reconciliation Engine**:
  - **Closing Float Balance (SOH)** = `Opening Balance (BBF) + Total Transfer Out − Total Sales`
  - **1% Up Front Commission** = `Commission Rate (1%) × Total Transfer Out`
  - **Difference** = `Closing Float Balance − 1% Up Front`
  - Official October 2026 reference test validation reproduced:
    - BBF: `-1,021`
    - Transfer Out: `2,576,071`
    - Total Sales: `2,549,410`
    - Closing Balance (SOH): `25,640`
    - 1% Up Front: `25,761`
    - Difference: `-121` (Overage)
- **Transfer Out Management (Superadmin Only)**:
  - Strictly restricted to Moderntech HQ superadmins.
  - Month-by-month allocations that reset to 0 at the start of each month while archiving past months.
- **Monthly Cycles & Automated Rollover**:
  - Month-end closing process carries forward closing SOH as the next month's opening balance (BBF).
  - Historical archive preservation for prior periods (October 2026, November 2026, December 2026, etc.).
- **Live Spreadsheet & Telegram Replacement**:
  - Directly replaces the manual Telegram spreadsheet sharing workflow.
  - Search, date filter, district filter, status filter, sorting, and CSV export.
  - Print-friendly layout for physical monthly reports.
- **Append-Only Audit Trail**:
  - Mandatory audit reason for any correction made to financial entries.

---

## 2. White & Light Blue Minimalist Design System

Adheres strictly to the 80% white + 20% light blue enterprise palette:
- **Main Background**: `#FFFFFF`
- **Secondary Background**: `#F7FAFD`
- **Light Blue Surfaces**: `#EAF4FC`
- **Soft Blue Highlights**: `#DCEEFF`
- **Primary Blue Accent**: `#2878B9`
- **Text Primary**: `#202B38`
- **Text Secondary**: `#778493`
- **Borders**: `#E8EDF2`

---

## 3. Security Rules & Deployment

Firestore security rules (`firestore.rules`) enforce:
1. `match /{document=**} { allow read, write: if false; }` default-deny.
2. `isAuthorizedForShop(shopId)` ABAC check preventing cross-tenant document queries.
3. Superadmin privilege checks for `transferOuts`, `shops`, `districts`, and `products`.
4. Append-only immutable rules on `auditLogs`.

---

## 4. Initial Superadmin Access

- Initial superadmin: `brookaklilu33@gmail.com`
- Top bar quick-switch tester allows instant evaluation of security isolation between:
  - **Superadmin (Global)**
  - **Jemo Shop Manager (Jemo Only)**
  - **Adama Shop Manager (Adama & Districts 1-4)**
  - **Chiro Shop Manager (Chiro Only)**
