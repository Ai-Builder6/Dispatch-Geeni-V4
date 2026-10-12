import React, { useState } from 'react';
import { 
  FileCheck, 
  ExternalLink, 
  Search, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { JobberQuote } from '../services/jobberSyncModules';

interface QuotesViewProps {
  quotes: JobberQuote[];
  onRefreshQuotes?: () => void;
  onBackToManagement?: () => void;
}

export const QuotesView: React.FC<QuotesViewProps> = ({
  quotes,
  onRefreshQuotes,
  onBackToManagement,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [monthFilter, setMonthFilter] = useState<'ALL' | '2026-09' | '2026-10'>('ALL');

  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.clientName.toLowerCase().includes(search.toLowerCase()) ||
      q.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.service.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || q.quoteStatus === statusFilter;
    const matchesMonth = monthFilter === 'ALL' || (q.createdAt && q.createdAt.startsWith(monthFilter));

    return matchesSearch && matchesStatus && matchesMonth;
  });

  const totalValue = filteredQuotes.reduce((acc, q) => acc + q.total, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'CONVERTED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'AWAITING_RESPONSE':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'CHANGES_REQUESTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-slate-50/70 font-sans p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
              <FileCheck className="w-4 h-4 text-white" />
            </span>
            <span>Jobber Quotes Pipeline ({filteredQuotes.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Standard, Deep, and Move-Out cleaning proposals synced live with Jobber API
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3.5 py-1.5 bg-gradient-to-r from-pink-50 to-purple-50 text-purple-900 border border-purple-200/80 rounded-xl font-mono text-xs font-bold shadow-2xs">
            Total Pipeline: <span className="text-pink-600 font-extrabold">${totalValue.toLocaleString()}</span>
          </div>
          {onBackToManagement && (
            <button
              onClick={onBackToManagement}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200 cursor-pointer"
            >
              ← Management
            </button>
          )}
          {onRefreshQuotes && (
            <button
              onClick={onRefreshQuotes}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-95 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            >
              Sync Quotes
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-2.5 mb-4">
        {/* Month Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            <span>Jobber Month:</span>
          </span>
          <button
            onClick={() => setMonthFilter('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              monthFilter === 'ALL'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            All Quotes ({quotes.length})
          </button>
          <button
            onClick={() => setMonthFilter('2026-09')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              monthFilter === '2026-09'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            September 2026 ({quotes.filter((q) => q.createdAt?.startsWith('2026-09')).length})
          </button>
          <button
            onClick={() => setMonthFilter('2026-10')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              monthFilter === '2026-10'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            October 2026 ({quotes.filter((q) => q.createdAt?.startsWith('2026-10')).length})
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by client or quote number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 focus:outline-none shadow-2xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="AWAITING_RESPONSE">Awaiting Response</option>
              <option value="CONVERTED">Converted to Job</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quotes Cards Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredQuotes.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-dashed border-slate-200">
            <FileCheck className="w-10 h-10 text-slate-300 mb-2" />
            <p className="font-bold text-slate-700 text-sm">No Quotes Found</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Your quotes will appear here once synchronized with your live Jobber account.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredQuotes.map((q) => (
              <div
                key={q.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {q.quoteNumber}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getStatusBadge(q.quoteStatus)}`}>
                      {q.quoteStatus.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 leading-snug mb-1">{q.clientName}</h3>
                  <p className="text-xs text-slate-500 mb-3">{q.service}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total</span>
                    <span className="font-extrabold text-slate-900 text-sm font-mono">${q.total}</span>
                  </div>

                  {q.depositRequired > 0 && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">Deposit</span>
                      <span className="font-semibold text-emerald-700 font-mono">${q.depositRequired}</span>
                    </div>
                  )}

                  <a
                    href={q.jobberWebUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Open in Jobber"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
