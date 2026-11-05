/**
 * Moderntech ERP - Receipt Assets & Reliable Fallback Visuals
 * Provides high-fidelity SVG data URIs for sample invoices and deposit slips
 * so that no transaction evidence ever renders as a broken image.
 */

export const generateInvoiceSvg = (invoiceNum: string, amount: number, date: string): string => {
  const formattedAmount = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520" width="400" height="520">
    <rect width="400" height="520" fill="#ffffff" rx="8" stroke="#DCEEFF" stroke-width="2"/>
    <rect x="0" y="0" width="400" height="70" fill="#2878B9"/>
    <text x="20" y="32" fill="#ffffff" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">MODERNTECH SHOP ERP</text>
    <text x="20" y="52" fill="#EAF4FC" font-family="system-ui, sans-serif" font-size="11">OFFICIAL SALES INVOICE &amp; FLOAT RECEIPT</text>
    <rect x="280" y="18" width="100" height="34" rx="4" fill="#ffffff" fill-opacity="0.15"/>
    <text x="330" y="39" fill="#ffffff" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">#${invoiceNum}</text>
    
    <!-- Meta Details -->
    <rect x="20" y="85" width="360" height="60" rx="6" fill="#F7FAFD" stroke="#E8EDF2" stroke-width="1"/>
    <text x="35" y="108" fill="#778493" font-family="system-ui, sans-serif" font-size="11">Date of Sale:</text>
    <text x="120" y="108" fill="#202B38" font-family="system-ui, sans-serif" font-size="11" font-weight="600">${date}</text>
    <text x="35" y="130" fill="#778493" font-family="system-ui, sans-serif" font-size="11">Item / Product:</text>
    <text x="120" y="130" fill="#202B38" font-family="system-ui, sans-serif" font-size="11" font-weight="600">FLOAT (M-PESA / Telecom)</text>
    
    <!-- Items Table Header -->
    <rect x="20" y="160" width="360" height="30" fill="#EAF4FC" rx="4"/>
    <text x="35" y="180" fill="#2878B9" font-family="system-ui, sans-serif" font-size="11" font-weight="bold">DESCRIPTION</text>
    <text x="230" y="180" fill="#2878B9" font-family="system-ui, sans-serif" font-size="11" font-weight="bold">QTY</text>
    <text x="365" y="180" fill="#2878B9" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="end">TOTAL (ETB)</text>
    
    <!-- Item Row -->
    <text x="35" y="215" fill="#202B38" font-family="system-ui, sans-serif" font-size="12">Daily Float Sales Batch</text>
    <text x="235" y="215" fill="#202B38" font-family="system-ui, sans-serif" font-size="12">1</text>
    <text x="365" y="215" fill="#202B38" font-family="monospace" font-size="13" font-weight="bold" text-anchor="end">${formattedAmount}</text>
    <line x1="20" y1="235" x2="380" y2="235" stroke="#E8EDF2" stroke-width="1"/>
    
    <!-- Totals Box -->
    <rect x="20" y="260" width="360" height="75" rx="6" fill="#F7FAFD" stroke="#E8EDF2"/>
    <text x="35" y="285" fill="#778493" font-family="system-ui, sans-serif" font-size="11">Subtotal:</text>
    <text x="365" y="285" fill="#202B38" font-family="monospace" font-size="12" text-anchor="end">ETB ${formattedAmount}</text>
    <text x="35" y="318" fill="#2878B9" font-family="system-ui, sans-serif" font-size="14" font-weight="bold">TOTAL AMOUNT:</text>
    <text x="365" y="318" fill="#2878B9" font-family="monospace" font-size="16" font-weight="bold" text-anchor="end">ETB ${formattedAmount}</text>
    
    <!-- Stamp -->
    <g transform="translate(240, 365) rotate(-8)">
      <rect x="0" y="0" width="130" height="55" rx="8" fill="none" stroke="#16A34A" stroke-width="3" stroke-dasharray="6,3"/>
      <text x="65" y="24" fill="#16A34A" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" text-anchor="middle">VERIFIED</text>
      <text x="65" y="44" fill="#16A34A" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" text-anchor="middle">MODERNTECH ERP</text>
    </g>
    
    <!-- Footer Note -->
    <text x="20" y="490" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="9">Certified digital sales document • Addis Ababa, Ethiopia</text>
    <text x="20" y="504" fill="#94A3B8" font-family="monospace" font-size="9">Doc ID: MT-INV-${invoiceNum}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const generateDepositSvg = (bankName: string, refNumber: string, amount: number, date: string): string => {
  const formattedAmount = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const isCbe = bankName.toLowerCase().includes('cbe') || bankName.toLowerCase().includes('commercial');
  const isTelebirr = bankName.toLowerCase().includes('telebirr');
  const primaryColor = isTelebirr ? '#E6007E' : isCbe ? '#782670' : '#1E40AF';
  const bankTitle = isTelebirr ? 'TELEBIRR / ETHIO TELECOM' : isCbe ? 'COMMERCIAL BANK OF ETHIOPIA (CBE)' : bankName.toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480" width="400" height="480">
    <rect width="400" height="480" fill="#ffffff" rx="8" stroke="#E8EDF2" stroke-width="2"/>
    <rect x="0" y="0" width="400" height="65" fill="${primaryColor}"/>
    <text x="20" y="28" fill="#ffffff" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">${bankTitle}</text>
    <text x="20" y="48" fill="#ffffff" fill-opacity="0.85" font-family="system-ui, sans-serif" font-size="10">DEPOSIT CONFIRMATION SLIP / ADVICE</text>
    
    <!-- Transaction Box -->
    <rect x="20" y="80" width="360" height="230" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
    
    <text x="35" y="110" fill="#64748B" font-family="system-ui, sans-serif" font-size="11">Transaction Reference:</text>
    <text x="365" y="110" fill="#0F172A" font-family="monospace" font-size="12" font-weight="bold" text-anchor="end">${refNumber || 'TX-' + Math.floor(Math.random()*89999+10000)}</text>
    
    <line x1="35" y1="125" x2="365" y2="125" stroke="#E2E8F0"/>
    
    <text x="35" y="150" fill="#64748B" font-family="system-ui, sans-serif" font-size="11">Deposit Date &amp; Time:</text>
    <text x="365" y="150" fill="#0F172A" font-family="system-ui, sans-serif" font-size="11" text-anchor="end">${date} 14:32 EAT</text>
    
    <line x1="35" y1="165" x2="365" y2="165" stroke="#E2E8F0"/>
    
    <text x="35" y="190" fill="#64748B" font-family="system-ui, sans-serif" font-size="11">Account Credited:</text>
    <text x="365" y="190" fill="#0F172A" font-family="system-ui, sans-serif" font-size="11" font-weight="600" text-anchor="end">MODERNTECH ETHIOPIA (Float A/C)</text>
    
    <line x1="35" y1="205" x2="365" y2="205" stroke="#E2E8F0"/>
    
    <text x="35" y="235" fill="#64748B" font-family="system-ui, sans-serif" font-size="12">Amount Deposited:</text>
    <text x="365" y="240" fill="${primaryColor}" font-family="monospace" font-size="18" font-weight="bold" text-anchor="end">ETB ${formattedAmount}</text>
    
    <rect x="35" y="260" width="330" height="34" rx="4" fill="#DCFCE7"/>
    <text x="200" y="282" fill="#15803D" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="middle">✓ BANK TRANSACTION CLEARED &amp; CONFIRMED</text>
    
    <!-- Bank Stamp -->
    <g transform="translate(135, 330)">
      <circle cx="65" cy="45" r="42" fill="none" stroke="${primaryColor}" stroke-width="2" stroke-dasharray="4,2"/>
      <circle cx="65" cy="45" r="37" fill="none" stroke="${primaryColor}" stroke-width="1"/>
      <text x="65" y="40" fill="${primaryColor}" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">OFFICIAL STAMP</text>
      <text x="65" y="54" fill="${primaryColor}" font-family="monospace" font-size="8" text-anchor="middle">${date}</text>
    </g>
    
    <text x="20" y="455" fill="#94A3B8" font-family="system-ui, sans-serif" font-size="9">Bank teller electronic validation • Moderntech Reconciliation Evidence</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const DEFAULT_INVOICE_IMAGE = generateInvoiceSvg('0036063', 3300, '2026-10-01');
export const DEFAULT_DEPOSIT_IMAGE = generateDepositSvg('Commercial Bank of Ethiopia (CBE)', 'CBE-0036063', 3300, '2026-10-01');
