import React, { useState } from 'react';
import { 
  Receipt, 
  ExternalLink, 
  Search, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Filter
} from 'lucide-react';
import { JobberInvoice } from '../services/jobberSyncModules';

interface InvoicesViewProps {
  invoices: JobberInvoice[];
  onRefreshInvoices?: () => void;
  onBackToManagement?: () => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  onRefreshInvoices,
  onBackToManagement,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [monthFilter, setMonthFilter] = useState<'ALL' | '2026-09' | '2026-10'>('ALL');

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || inv.invoiceStatus === statusFilter;
    const matchesMonth =
      monthFilter === 'ALL' ||
      inv.issuedDate?.startsWith(monthFilter) ||
      inv.dueDate?.startsWith(monthFilter);

    return matchesSearch && matchesStatus && matchesMonth;
  });

  const totalPaid = filteredInvoices
    .filter((i) => i.invoiceStatus === 'PAID')
    .reduce((acc, i) => acc + i.total, 0);

  const totalOutstanding = filteredInvoices
    .filter((i) => i.invoiceStatus === 'AWAITING_PAYMENT')
    .reduce((acc, i) => acc + (i.balance || i.total), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'AWAITING_PAYMENT':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'BAD_DEBT':
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
              <Receipt className="w-4 h-4 text-white" />
            </span>
            <span>Jobber Invoices &amp; Payments ({filteredInvoices.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time billing, payments, and balances directly from your Jobber ledger
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl font-mono text-xs font-bold shadow-2xs">
            Collected: ${totalPaid.toLocaleString()}
          </div>
          <div className="px-3.5 py-1.5 bg-gradient-to-r from-pink-50 to-purple-50 text-purple-900 border border-purple-200/80 rounded-xl font-mono text-xs font-bold shadow-2xs">
            Due: <span className="text-pink-600 font-extrabold">${totalOutstanding.toLocaleString()}</span>
          </div>
          {onRefreshInvoices && (
            <button
              onClick={onRefreshInvoices}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-95 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            >
              Sync Billing
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-2.5 mb-4">
        {/* Month Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Jobber Month:</span>
          </span>
          <button
            onClick={() => setMonthFilter('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              monthFilter === 'ALL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            All Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setMonthFilter('2026-09')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              monthFilter === '2026-09'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            September 2026 ({invoices.filter((i) => i.issuedDate?.startsWith('2026-09') || i.dueDate?.startsWith('2026-09')).length})
          </button>
          <button
            onClick={() => setMonthFilter('2026-10')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              monthFilter === '2026-10'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            October 2026 ({invoices.filter((i) => i.issuedDate?.startsWith('2026-10') || i.dueDate?.startsWith('2026-10')).length})
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by client or invoice number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 focus:outline-none shadow-2xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid in Full</option>
              <option value="AWAITING_PAYMENT">Awaiting Payment</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices List / Table */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <th className="p-3">Invoice #</th>
              <th className="p-3">Client</th>
              <th className="p-3">Status</th>
              <th className="p-3">Issued Date</th>
              <th className="p-3">Due Date</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-right">Balance Due</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 text-xs">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">No Invoices Found</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Invoices will populate automatically when synchronized with your live Jobber account.
                  </p>
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-700">{inv.invoiceNumber}</td>
                  <td className="p-3 font-bold text-slate-900">{inv.clientName}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getStatusBadge(inv.invoiceStatus)}`}>
                      {inv.invoiceStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 font-mono">{inv.issuedDate}</td>
                  <td className="p-3 text-slate-500 font-mono">{inv.dueDate}</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-900">${inv.total}</td>
                  <td className="p-3 text-right font-mono font-bold">
                    {inv.balance > 0 ? (
                      <span className="text-amber-700 font-bold">${inv.balance}</span>
                    ) : (
                      <span className="text-emerald-700">$0 (Paid)</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <a
                      href={inv.jobberWebUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 inline-flex items-center text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Open in Jobber"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
