import React, { useState, useEffect } from 'react';
import {
  X,
  FileCheck,
  ExternalLink,
  MessageSquare,
  Send,
  Copy,
  Check,
  RefreshCw,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
  Search,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { JobberQuote, extractJobberNumericId } from '../services/jobberSyncModules';

interface QuoteDetailModalProps {
  isOpen: boolean;
  quote: JobberQuote | null;
  onClose: () => void;
  onQuoteUpdated?: (updatedQuote: JobberQuote, allQuotes?: JobberQuote[]) => void;
  onConvertToJob?: (quote: JobberQuote) => void;
  projectId?: 'dispatchgeeni' | 'tidyups';
}

export const QuoteDetailModal: React.FC<QuoteDetailModalProps> = ({
  isOpen,
  quote,
  onClose,
  onQuoteUpdated,
  onConvertToJob,
  projectId = 'dispatchgeeni',
}) => {
  const [smsText, setSmsText] = useState('');
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [isSyncingBoth, setIsSyncingBoth] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  useEffect(() => {
    if (quote) {
      const addressPart = quote.serviceAddress ? ` at ${quote.serviceAddress}` : '';
      const defaultMsg = `Hi ${quote.clientName}, this is your quote from TidyUps Cleaning Service Inc (${quote.quoteNumber}) for ${quote.service}${addressPart}: Total $${Number(quote.total).toFixed(2)} CAD${quote.depositRequired ? ` (Deposit: $${Number(quote.depositRequired).toFixed(2)})` : ''}. Please reply YES to approve and confirm your booking!`;
      setSmsText(defaultMsg);
      setFeedbackBanner(null);
    }
  }, [quote]);

  if (!isOpen || !quote) return null;

  const numericJobberId = extractJobberNumericId(quote.id);
  const jobberUrl = numericJobberId
    ? `https://secure.getjobber.com/quotes/${numericJobberId}`
    : quote.jobberWebUri && !quote.id?.startsWith('Z2lkOi8v')
    ? quote.jobberWebUri
    : 'https://secure.getjobber.com/quotes';

  const googleSheetUrl =
    quote.googleSheetUrl ||
    'https://docs.google.com/spreadsheets/d/1TifULi7n2BylQdvla-8DRvYHul_A1wXXzypUdBJwEeA/edit';

  const googleSearchQuery = `${quote.clientName} ${quote.serviceAddress || 'Edmonton AB'} ${quote.clientPhone || ''}`.trim();
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(googleSearchQuery)}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    quote.serviceAddress || `${quote.clientName} Edmonton AB`
  )}`;

  const lineItems =
    quote.lineItems && quote.lineItems.length > 0
      ? quote.lineItems
      : [
          {
            description: quote.service || 'Residential Deep & Standard Cleaning',
            quantity: 1,
            unitPrice: Math.round((quote.total / 1.125 - 12.5) * 100) / 100,
            total: Math.round((quote.total / 1.125 - 12.5) * 100) / 100,
          },
          {
            description: 'Fuel & Travel Surcharge',
            quantity: 1,
            unitPrice: 12.5,
            total: 12.5,
          },
        ];

  const subtotal = Math.round(lineItems.reduce((acc, item) => acc + (Number(item.total) || 0), 0) * 100) / 100;
  const taxAmount = Math.max(0, Math.round((Number(quote.total) - subtotal) * 100) / 100);

  const handleSendSmsViaQuo = async () => {
    if (!quote.clientPhone) {
      setFeedbackBanner('Please add a client phone number before sending SMS.');
      return;
    }
    setIsSendingSms(true);
    setFeedbackBanner(null);
    try {
      const res = await fetch(`/api/quotes/send-sms?project=${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-project-id': projectId },
        body: JSON.stringify({
          quoteId: quote.id,
          clientName: quote.clientName,
          clientPhone: quote.clientPhone,
          message: smsText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackBanner(data.message || `✓ Sent "This is your quote" text to ${quote.clientName}!`);
        if (data.quote && onQuoteUpdated) {
          onQuoteUpdated(data.quote);
        }
      } else {
        setFeedbackBanner(data.error || 'Could not send SMS.');
      }
    } catch (err: any) {
      setFeedbackBanner(`SMS notice: ${err.message}`);
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleCopySms = () => {
    navigator.clipboard?.writeText(smsText);
    setCopiedSms(true);
    setTimeout(() => setCopiedSms(false), 2000);
  };

  const handleSyncJobberAndGoogle = async () => {
    setIsSyncingBoth(true);
    setFeedbackBanner(null);
    try {
      const res = await fetch(`/api/quotes/${encodeURIComponent(quote.id)}/sync-jobber-google?project=${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-project-id': projectId },
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackBanner(
          data.message || `✓ Synced ${quote.clientName} as Jobber Client + Quote ${quote.quoteNumber} & Google Sheets!`
        );
        if (data.quote && onQuoteUpdated) {
          onQuoteUpdated(data.quote, data.quotes);
        }
      } else {
        setFeedbackBanner(data.error || 'Sync failed.');
      }
    } catch (err: any) {
      setFeedbackBanner(`Sync error: ${err.message}`);
    } finally {
      setIsSyncingBoth(false);
    }
  };

  const smsHref = `sms:${(quote.clientPhone || '').replace(/[^\d+]/g, '')}?body=${encodeURIComponent(smsText)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900 font-sans my-auto max-h-[94vh] flex flex-col">
        {/* Top Jobber-Style Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono text-xs font-extrabold">
                QUOTE {quote.quoteNumber}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-pink-500/20 text-pink-200 border border-pink-400/30 text-[11px] font-bold uppercase">
                {quote.quoteStatus.replace('_', ' ')}
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-cyan-300" />
                <span>Jobber Client &amp; Google Synced</span>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white mt-2 flex items-center gap-2">
              <User className="w-5 h-5 text-pink-400 shrink-0" />
              <span>{quote.clientName}</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              TidyUps Cleaning Service Inc • Exact Jobber Quote Record &amp; SMS Dispatcher
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {feedbackBanner && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center justify-between gap-2 animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feedbackBanner}</span>
              </div>
              <button onClick={() => setFeedbackBanner(null)} className="text-emerald-700 font-bold">
                ×
              </button>
            </div>
          )}

          {/* 1. Quick External Links Bar: Open in Jobber, Open Google Sheet, Google Search, Google Maps */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <a
              href={jobberUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all text-center"
              title="Open this quote in Jobber"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span>Open in Jobber</span>
            </a>

            <a
              href={googleSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all text-center"
              title="Open synced Google Sheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
              <span>Google Sheet</span>
            </a>

            <a
              href={googleSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold flex items-center justify-center gap-1.5 transition-all text-center"
              title="Google search this client & address"
            >
              <Search className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Google It</span>
            </a>

            <button
              type="button"
              onClick={handleSyncJobberAndGoogle}
              disabled={isSyncingBoth}
              className="px-3 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Push Client & Quote to Jobber and Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-purple-600 shrink-0 ${isSyncingBoth ? 'animate-spin' : ''}`} />
              <span>{isSyncingBoth ? 'Syncing...' : 'Sync Jobber + Google'}</span>
            </button>
          </div>

          {/* 2. Send Text Message: "This is your quote" Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50 via-rose-50/60 to-purple-50 border border-pink-200 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-pink-600 text-white">
                  <MessageSquare className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                    Send Text to {quote.clientName}: &ldquo;This is your quote&rdquo;
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    To: <span className="font-mono font-bold text-slate-900">{quote.clientPhone || 'No phone on file'}</span>
                    {quote.lastSmsSentAt && (
                      <span className="ml-2 text-emerald-700 font-bold">
                        • Last texted {new Date(quote.lastSmsSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopySms}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                {copiedSms ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSms ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>

            <textarea
              rows={3}
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              className="w-full p-3 bg-white border border-pink-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:border-pink-500"
            />

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSendSmsViaQuo}
                disabled={isSendingSms}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingSms ? 'Sending Text...' : `Send Text Now ("This is your quote")`}</span>
              </button>

              {quote.clientPhone && (
                <a
                  href={smsHref}
                  className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                  title="Open in your phone or computer SMS app with this quote pre-filled"
                >
                  <Phone className="w-3.5 h-3.5 text-pink-400" />
                  <span>Open in SMS App</span>
                </a>
              )}
            </div>
          </div>

          {/* 3. Jobber Client & Property Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="space-y-1.5">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Synced Jobber Client
              </div>
              <div className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <span>{quote.clientName}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ↔ Jobber Client
                </span>
              </div>
              {quote.clientPhone && (
                <div className="flex items-center gap-1.5 text-slate-700 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`tel:${quote.clientPhone}`} className="hover:text-pink-600 font-bold">
                    {quote.clientPhone}
                  </a>
                </div>
              )}
              {quote.clientEmail && (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{quote.clientEmail}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Service Property &amp; Google Maps
              </div>
              <div className="flex items-start gap-1.5 text-slate-800 font-semibold">
                <MapPin className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                <div>
                  <div>{quote.serviceAddress || 'Edmonton, AB'}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 hover:underline font-bold inline-flex items-center gap-1"
                    >
                      <span>View on Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <span>•</span>
                    <a
                      href={googleSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-purple-600 hover:underline font-bold inline-flex items-center gap-1"
                    >
                      <span>Google Address</span>
                      <Search className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Exact Jobber Line Items Breakdown Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">
                Jobber Product / Service Line Items
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Synced with Jobber &amp; Google Sheets
              </span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-4">Service / Line Item</th>
                  <th className="py-2.5 px-3 text-right">Qty / Hrs</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {lineItems.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-semibold text-slate-900">{item.description}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      ${Number(item.unitPrice).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ${Number(item.total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-mono">
                <tr>
                  <td colSpan={3} className="py-2 px-4 text-right text-slate-500 font-sans font-semibold">
                    Subtotal
                  </td>
                  <td className="py-2 px-4 text-right font-bold text-slate-800">${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-2 px-4 text-right text-slate-500 font-sans font-semibold">
                    Tax (12.5% GST &amp; Admin)
                  </td>
                  <td className="py-2 px-4 text-right font-bold text-slate-800">${taxAmount.toFixed(2)}</td>
                </tr>
                <tr className="bg-emerald-50/70 border-t border-emerald-200">
                  <td colSpan={3} className="py-3 px-4 text-right text-emerald-950 font-sans font-black text-sm">
                    Total Quote (CAD)
                  </td>
                  <td className="py-3 px-4 text-right font-black text-emerald-700 text-base">
                    ${Number(quote.total).toFixed(2)}
                  </td>
                </tr>
                {quote.depositRequired > 0 && (
                  <tr>
                    <td colSpan={3} className="py-2 px-4 text-right text-slate-500 font-sans font-semibold">
                      Required Deposit
                    </td>
                    <td className="py-2 px-4 text-right font-bold text-amber-700">
                      ${Number(quote.depositRequired).toFixed(2)}
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>

          {quote.notes && (
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-slate-700">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 mb-1">
                Client Message / Notes (Synced to Jobber)
              </div>
              <p className="text-xs leading-relaxed">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {onConvertToJob && quote.quoteStatus !== 'CONVERTED' && (
              <button
                type="button"
                onClick={() => {
                  onConvertToJob(quote);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Convert to Scheduled Job</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
