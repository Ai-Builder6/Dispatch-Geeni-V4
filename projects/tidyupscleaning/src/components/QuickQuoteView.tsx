import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Sparkles, 
  Phone, 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Tag, 
  Copy, 
  Check, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  FileText, 
  Send, 
  MessageSquare,
  ShieldCheck,
  Percent,
  Plus,
  Flame,
  Search,
  ExternalLink
} from 'lucide-react';
import { getCustomerIntelligence } from '../services/customerIntelligenceService';
import { CustomerIntelligenceBadge } from './CustomerIntelligenceBadge';
import { AdLeadItem } from '../types/lead';

interface QuickQuoteViewProps {
  initialLead?: AdLeadItem | null;
  onVisitCreated?: (visit: any) => void;
  onQuoteCreated?: (quote: any) => void;
  calls?: any[];
  visits?: any[];
  clients?: any[];
  quotes?: any[];
  projectId?: 'dispatchgeeni' | 'tidyups';
}

export const QuickQuoteView: React.FC<QuickQuoteViewProps> = ({
  initialLead,
  onVisitCreated,
  onQuoteCreated,
  calls = [],
  visits = [],
  clients = [],
  quotes = [],
  projectId = 'dispatchgeeni',
}) => {
  // Hours & Crew Calculator
  const [hours, setHours] = useState<number>(3);
  const [crewSelection, setCrewSelection] = useState<'1_CLEANER' | '2_CLEANERS' | 'CUSTOM'>('1_CLEANER');
  const [customHourlyRate, setCustomHourlyRate] = useState<number>(55);
  const [selectedSource, setSelectedSource] = useState<string>('Google');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [fuelSurcharge, setFuelSurcharge] = useState<number>(12.50);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [applyTax, setApplyTax] = useState<boolean>(true);
  const taxRate = 0.125; // 12.5% tax per Rolldapp setup

  // Customer Contact Fields for fast phone quoting
  const [customerName, setCustomerName] = useState<string>(initialLead?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState<string>(initialLead?.phone || '');
  const [customerEmail, setCustomerEmail] = useState<string>(initialLead?.email || '');
  const [serviceAddress, setServiceAddress] = useState<string>(initialLead?.address || '');
  const [serviceType, setServiceType] = useState<string>(initialLead?.serviceRequested || 'Residential Standard Cleaning');
  const [scheduledDate, setScheduledDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [scheduledTime, setScheduledTime] = useState<string>('10:00');
  const [assignedCleaner, setAssignedCleaner] = useState<string>('Cindy Guay');
  const [quoteNotes, setQuoteNotes] = useState<string>(initialLead?.notes || '');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copiedBreakdown, setCopiedBreakdown] = useState<boolean>(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Hourly Rate resolution
  const hourlyRate = useMemo(() => {
    if (crewSelection === '1_CLEANER') return 52.50;
    if (crewSelection === '2_CLEANERS') return 105.00;
    return customHourlyRate;
  }, [crewSelection, customHourlyRate]);

  // Calculations: Labor, Fuel, Discount, Tax, Total
  const calculations = useMemo(() => {
    const labor = Math.round(hours * hourlyRate * 100) / 100;
    const subtotalBeforeDiscount = labor + Number(fuelSurcharge);
    const subtotal = Math.max(0, subtotalBeforeDiscount - Number(discountAmount));
    const tax = applyTax ? Math.round(subtotal * taxRate * 100) / 100 : 0;
    const total = Math.round((subtotal + tax) * 100) / 100;

    return {
      labor,
      subtotal,
      tax,
      total,
    };
  }, [hours, hourlyRate, fuelSurcharge, discountAmount, applyTax, taxRate]);

  // Real-time Customer Intelligence lookup as dispatcher types phone/name
  const intelligence = useMemo(() => {
    return getCustomerIntelligence(customerPhone, customerName, { calls, visits, clients, quotes });
  }, [customerPhone, customerName, calls, visits, clients, quotes]);

  // Auto-apply loyalty discount
  const handleApplyLoyaltyDiscount = (percent: number) => {
    const labor = hours * hourlyRate;
    const val = Math.round(labor * (percent / 100));
    setDiscountAmount(val);
    setQuoteNotes((prev) => `${prev ? prev + ' ' : ''}[Applied ${percent}% Repeat Customer Loyalty Discount (-$${val})]`);
  };

  // Copy SMS / Phone ready breakdown
  const handleCopyBreakdown = () => {
    const text = `TidyUps Cleaning Estimate for ${customerName || 'Customer'}:
• Service: ${serviceType}
• Time: ${hours} hours (${crewSelection === '1_CLEANER' ? '1 Cleaner @ $52.50/hr' : crewSelection === '2_CLEANERS' ? '2 Cleaners @ $105/hr' : `Custom @ $${hourlyRate}/hr`})
• Labor: $${calculations.labor.toFixed(2)}
• Fuel Surcharge: $${Number(fuelSurcharge).toFixed(2)}
${discountAmount > 0 ? `• Discount: -$${Number(discountAmount).toFixed(2)}\n` : ''}• Subtotal: $${calculations.subtotal.toFixed(2)}
• Tax (12.5%): $${calculations.tax.toFixed(2)}
• TOTAL QUOTED: $${calculations.total.toFixed(2)} CAD
${depositAmount > 0 ? `• Deposit: $${Number(depositAmount).toFixed(2)}\n` : ''}${quoteNotes ? `• Notes: ${quoteNotes}` : ''}`;

    navigator.clipboard.writeText(text);
    setCopiedBreakdown(true);
    setTimeout(() => setCopiedBreakdown(false), 2500);
  };

  // 1-Click Convert to Dispatched Job Visit
  const handleConvertToDispatchedJob = async () => {
    setIsSubmitting(true);
    setFeedbackNotice(null);
    try {
      const res = await fetch(`/api/quo/calls/convert-to-job?project=${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-project-id': projectId },
        body: JSON.stringify({
          callerName: customerName || 'Phone Lead',
          callerPhone: customerPhone || '(780) 555-0199',
          serviceAddress: serviceAddress || 'Edmonton, AB',
          serviceType: `${serviceType} (${hours} hrs)`,
          scheduledDate,
          scheduledTime,
          assignedCleaners: [assignedCleaner],
          totalAmount: calculations.total,
          notes: `Quick Quoted: ${hours} hrs @ $${hourlyRate}/hr + $${fuelSurcharge} fuel. Source: ${selectedSource}. ${quoteNotes}`,
        }),
      });
      const data = await res.json();
      if (data.success && data.newVisit) {
        setFeedbackNotice(`🎉 Successfully Dispatched Job #${data.newVisit.visitNumber || 'VISIT'} to ${assignedCleaner}!`);
        if (onVisitCreated) onVisitCreated(data.newVisit);
      } else {
        setFeedbackNotice(data.error || 'Failed to dispatch job.');
      }
    } catch (err: any) {
      setFeedbackNotice(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create official Jobber Quote
  const handleSaveJobberQuote = async () => {
    setIsSubmitting(true);
    setFeedbackNotice(null);
    try {
      const res = await fetch(`/api/database/quotes?project=${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-project-id': projectId },
        body: JSON.stringify({
          clientName: customerName || 'Phone Lead',
          clientPhone: customerPhone || '(780) 555-0199',
          clientEmail: customerEmail,
          service: `${serviceType} (${hours} hrs)`,
          total: calculations.total,
          depositRequired: depositAmount,
          notes: `Quick Quoted: ${hours} hrs @ $${hourlyRate}/hr + $${fuelSurcharge} fuel. Source: ${selectedSource}. ${quoteNotes}`,
        }),
      });
      const data = await res.json();
      if (data.success && data.quote) {
        setFeedbackNotice(`✓ Jobber Quote #${data.quote.quoteNumber} created and staged for Jobber sync!`);
        if (onQuoteCreated) onQuoteCreated(data.quote);
      } else {
        setFeedbackNotice(data.error || 'Failed to create quote.');
      }
    } catch (err: any) {
      setFeedbackNotice(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setServiceAddress('');
    setQuoteNotes('');
    setDiscountAmount(0);
    setDepositAmount(0);
    setFeedbackNotice(null);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0d0f17] text-slate-100 font-sans p-4 sm:p-6 lg:p-8 space-y-6 animate-fadeIn min-h-[calc(100vh-4rem)]">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-500 text-white shadow-lg">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Quick Quotes &amp; Phone Intake
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Fast on-the-phone pricing: Pick hours and crew, check repeat caller status, and dispatch or sync to Jobber &amp; Google in seconds.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleReset}
            className="px-3 py-2 bg-[#1b1e2b] hover:bg-[#252a3d] text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700/80 cursor-pointer"
          >
            Clear / New Call
          </button>
          <button
            onClick={handleCopyBreakdown}
            className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            {copiedBreakdown ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedBreakdown ? 'Copied to Clipboard!' : 'Copy SMS Breakdown'}</span>
          </button>
        </div>
      </div>

      {feedbackNotice && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-200 text-sm flex items-center gap-3 font-bold shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* Main Grid: Left Column = Calculator & Pricing; Right Column = Customer Intake & Dispatch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Fast Pricing Calculator (Screenshot 2 workflow) */}
        <div className="lg:col-span-5 bg-[#141218] border border-[#2b2533] rounded-3xl p-5 sm:p-6 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#2b2533]">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-500"></span>
              <span>Quoted Price Calculator</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">12.5% Tax + $12.50 Fuel</span>
          </div>

          {/* 1. Hours Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Hours needed:</span>
              <span className="font-mono font-bold text-pink-400 text-base">{hours} {hours === 1 ? 'hour' : 'hours'}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[1, 2, 3, 4, 5, 6].map((h) => {
                const isSelected = hours === h;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHours(h)}
                    className={`w-11 h-11 rounded-full font-extrabold text-sm transition-all cursor-pointer flex items-center justify-center border ${
                      isSelected
                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-500 shadow-lg scale-105'
                        : 'bg-[#221d2b] text-slate-300 border-[#322c3e] hover:bg-[#2b2537]'
                    }`}
                  >
                    {h}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setHours((prev) => Math.min(16, prev + 1))}
                className="px-3.5 h-11 rounded-full bg-[#221d2b] hover:bg-[#2b2537] text-slate-200 border border-[#322c3e] font-bold text-xs transition-colors cursor-pointer"
                title="Add 1 hour"
              >
                +1 hr
              </button>
              <button
                type="button"
                onClick={() => setHours((prev) => prev + 0.5)}
                className="px-3.5 h-11 rounded-full bg-[#221d2b] hover:bg-[#2b2537] text-slate-200 border border-[#322c3e] font-bold text-xs transition-colors cursor-pointer"
                title="Add half hour"
              >
                +½ hr
              </button>
            </div>
          </div>

          {/* 2. Cleaner Crew Selection */}
          <div className="space-y-2.5">
            <span className="block font-semibold text-slate-300 text-xs">Cleaners &amp; Hourly Rate:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCrewSelection('1_CLEANER')}
                className={`p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer border text-center ${
                  crewSelection === '1_CLEANER'
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-500 shadow-md'
                    : 'bg-[#221d2b] text-slate-300 border-[#322c3e] hover:bg-[#2b2537]'
                }`}
              >
                <div className="font-extrabold">1 cleaner</div>
                <div className="text-[11px] font-mono mt-0.5 opacity-90">$52.50/hr</div>
              </button>
              <button
                type="button"
                onClick={() => setCrewSelection('2_CLEANERS')}
                className={`p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer border text-center ${
                  crewSelection === '2_CLEANERS'
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-500 shadow-md'
                    : 'bg-[#221d2b] text-slate-300 border-[#322c3e] hover:bg-[#2b2537]'
                }`}
              >
                <div className="font-extrabold">2 cleaners</div>
                <div className="text-[11px] font-mono mt-0.5 opacity-90">$105.00/hr</div>
              </button>
              <button
                type="button"
                onClick={() => setCrewSelection('CUSTOM')}
                className={`p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer border text-center col-span-2 sm:col-span-1 ${
                  crewSelection === 'CUSTOM'
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-500 shadow-md'
                    : 'bg-[#221d2b] text-slate-300 border-[#322c3e] hover:bg-[#2b2537]'
                }`}
              >
                <div className="font-extrabold">Custom Rate</div>
                <div className="text-[11px] font-mono mt-0.5 opacity-90">${customHourlyRate}/hr</div>
              </button>
            </div>

            {crewSelection === 'CUSTOM' && (
              <div className="flex items-center gap-2 p-2.5 bg-[#1c1824] rounded-xl border border-[#322c3e] animate-fadeIn">
                <span className="text-xs text-slate-300 font-medium">Set Custom Rate: $</span>
                <input
                  type="number"
                  min="20"
                  step="1"
                  value={customHourlyRate}
                  onChange={(e) => setCustomHourlyRate(Number(e.target.value) || 55)}
                  className="w-24 px-2 py-1 bg-[#252030] border border-slate-700 rounded-lg text-white font-mono font-bold text-xs focus:outline-none focus:border-pink-500"
                />
                <span className="text-xs text-slate-400">CAD / hour</span>
              </div>
            )}
          </div>

          {/* 3. Big Calculated Price Box */}
          <div className="p-5 bg-gradient-to-b from-[#1b1724] to-[#16131d] border border-[#322c3e] rounded-3xl shadow-xl">
            <span className="text-[10px] text-pink-400 uppercase tracking-widest font-black block">Total Quoted Price</span>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight flex items-baseline gap-1">
                <span className="text-pink-500 text-2xl">$</span>
                <span>{calculations.total.toFixed(2)}</span>
                <span className="text-xs text-slate-400 font-sans font-medium ml-1">CAD</span>
              </div>
              <div className="text-right text-xs text-slate-400 font-mono space-y-0.5">
                <div>Labor: <span className="text-slate-200 font-bold">${calculations.labor.toFixed(2)}</span></div>
                <div>Fuel: <span className="text-slate-200 font-bold">+${Number(fuelSurcharge).toFixed(2)}</span></div>
                {discountAmount > 0 && (
                  <div className="text-emerald-400 font-bold">Discount: -${Number(discountAmount).toFixed(2)}</div>
                )}
                <div>Tax (12.5%): <span className="text-slate-200 font-bold">+{applyTax ? `$${calculations.tax.toFixed(2)}` : '$0'}</span></div>
              </div>
            </div>
          </div>

          {/* 4. Quick Discounts & Loyalty Perks */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-semibold text-xs">Fast Discounts &amp; Repeat Perks:</label>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setDiscountAmount(10)}
                className={`py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  discountAmount === 10
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'bg-[#221d2b] text-slate-300 border-[#322c3e] hover:bg-[#2b2537]'
                }`}
              >
                -$10 off
              </button>
              <button
                type="button"
                onClick={() => setDiscountAmount(20)}
                className={`py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  discountAmount === 20
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'bg-[#221d2b] text-slate-300 border-[#322c3e] hover:bg-[#2b2537]'
                }`}
              >
                -$20 off
              </button>
              {intelligence.loyaltyDiscountEligible && (
                <button
                  type="button"
                  onClick={() => handleApplyLoyaltyDiscount(intelligence.loyaltyDiscountPercent)}
                  className="py-1.5 px-3 rounded-full text-xs font-extrabold bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white border border-pink-400 shadow-md flex items-center gap-1 cursor-pointer animate-pulse"
                >
                  <Tag className="w-3 h-3" />
                  <span>Apply {intelligence.loyaltyDiscountPercent}% Repeat Client Perk</span>
                </button>
              )}
              {discountAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setDiscountAmount(0)}
                  className="py-1.5 px-2 text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Clear discount
                </button>
              )}
            </div>
          </div>

          {/* 5. Fuel Surcharge & Tax Toggle */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-[#1b1723] rounded-xl border border-[#2b2537]">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Fuel Surcharge</span>
              <div className="flex items-center gap-1 mt-1 font-mono">
                <span className="text-slate-400">$</span>
                <input
                  type="number"
                  step="0.5"
                  value={fuelSurcharge}
                  onChange={(e) => setFuelSurcharge(Number(e.target.value) || 0)}
                  className="w-full bg-transparent text-white font-bold focus:outline-none"
                />
              </div>
            </div>

            <div className="p-2.5 bg-[#1b1723] rounded-xl border border-[#2b2537] flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">12.5% Tax</span>
                <span className="text-slate-200 font-bold">${calculations.tax.toFixed(2)}</span>
              </div>
              <button
                type="button"
                onClick={() => setApplyTax(!applyTax)}
                className={`px-2 py-1 rounded-lg font-bold text-[10px] cursor-pointer ${
                  applyTax ? 'bg-pink-600 text-white' : 'bg-slate-700 text-slate-400'
                }`}
              >
                {applyTax ? 'APPLIED' : 'EXEMPT'}
              </button>
            </div>
          </div>

          {/* 6. Lead Source ("How did they hear about us?") */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-semibold text-xs">Lead Source / Referral:</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {['Google', 'Facebook', 'Instagram', 'TikTok', 'Referral', 'Website form'].map((src) => {
                const isSelected = selectedSource === src;
                return (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setSelectedSource(src)}
                    className={`py-1 px-2.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-500 shadow-sm'
                        : 'bg-[#221d2b] text-slate-300 border-[#322c3e] hover:bg-[#2b2537]'
                    }`}
                  >
                    {src}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Intake & Instant Dispatch */}
        <div className="lg:col-span-7 bg-[#121520] border border-slate-800/80 rounded-3xl p-5 sm:p-6 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-pink-500" />
              <span>Caller &amp; Booking Details</span>
            </h2>
            <span className="text-xs text-slate-400">Fill while customer is on the line</span>
          </div>

          {/* Caller Intelligence Banner */}
          {customerPhone.trim().length > 3 && (
            <div className="animate-fadeIn">
              <CustomerIntelligenceBadge
                intelligence={intelligence}
                showDiscountPrompt={intelligence.loyaltyDiscountEligible && discountAmount === 0}
                onApplyDiscount={(percent) => handleApplyLoyaltyDiscount(percent)}
              />
            </div>
          )}

          {/* Contact Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Customer Name <span className="text-pink-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. Marcus Vance"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#171b29] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Phone Number <span className="text-pink-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="(780) 555-0199"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#171b29] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="customer@gmail.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#171b29] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Service Type
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-3 py-2 bg-[#171b29] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                <option value="Residential Standard Cleaning">Residential Standard Cleaning</option>
                <option value="Deep Cleaning & Baseboards">Deep Cleaning &amp; Baseboards</option>
                <option value="Move-Out / Turnover Vacate Cleaning">Move-Out / Turnover Vacate Cleaning</option>
                <option value="Move-In Detailed Sanitization">Move-In Detailed Sanitization</option>
                <option value="Post-Renovation HEPA Vacuum & Scrub">Post-Renovation HEPA Vacuum &amp; Scrub</option>
                <option value="Commercial Office Cleaning">Commercial Office Cleaning</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Service Address (Edmonton / St. Albert / Sherwood Park)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. 10423 124 St NW, Edmonton, AB"
                  value={serviceAddress}
                  onChange={(e) => setServiceAddress(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#171b29] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Scheduled Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#171b29] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Start Time
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#171b29] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Assigned Cleaner
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={assignedCleaner}
                  onChange={(e) => setAssignedCleaner(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#171b29] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500 cursor-pointer"
                >
                  <option value="Cindy Guay">Cindy Guay (Senior Tech)</option>
                  <option value="Melissa Clarke">Melissa Clarke</option>
                  <option value="Robyn Adele">Robyn Adele</option>
                  <option value="Joel Mbatchou">Joel Mbatchou</option>
                  <option value="Unassigned">Unassigned (Hold in Queue)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Deposit Requirement
              </label>
              <div className="flex items-center gap-1.5">
                {[0, 50, 100].map((dep) => (
                  <button
                    key={dep}
                    type="button"
                    onClick={() => setDepositAmount(dep)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold border cursor-pointer ${
                      depositAmount === dep
                        ? 'bg-pink-600 text-white border-pink-500'
                        : 'bg-[#171b29] text-slate-300 border-slate-700'
                    }`}
                  >
                    {dep === 0 ? 'No Deposit' : `$${dep}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Notes / Gate Code / Special Requests
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Has pets, lockbox code 1984, focus on kitchen and oven add-on."
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                className="w-full px-3 py-2 bg-[#171b29] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              onClick={handleSaveJobberQuote}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#1e2336] hover:bg-[#282f49] text-white border border-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-purple-400" />
              <span>Create Jobber Quote (${calculations.total.toFixed(2)})</span>
            </button>

            <button
              onClick={handleConvertToDispatchedJob}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-xs font-extrabold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Calendar className="w-4 h-4" />
              <span>{isSubmitting ? 'Dispatching...' : 'Save & Dispatch to Calendar →'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
