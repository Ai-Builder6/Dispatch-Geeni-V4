import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  PhoneOff,
  Globe,
  Hash,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  Check,
  X,
  Phone,
  Radio,
  FileCode,
  Copy,
  Zap,
  Clock,
  ExternalLink,
  Layers
} from 'lucide-react';

interface SpamShieldConfig {
  enabled: boolean;
  blockAllNonNorthAmerica: boolean;
  blockedCountryCodes: string[];
  blockedPrefixes: string[];
  blockedNumbers: string[];
  blockRobocallFloods?: boolean;
  rejectionAction?: 'busy' | 'rejected';
}

interface BlockedCallHistoryItem {
  id: string;
  timestamp: string;
  callerNumber: string;
  callerName?: string;
  countryCode?: string;
  reason: string;
}

interface TwilioSpamShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: 'dispatchgeeni' | 'tidyups';
  preFillNumber?: string;
}

const PRESET_SPAM_COUNTRIES = [
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+234', name: 'Nigeria', flag: '🇳🇬' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+7', name: 'Russia / Kazakhstan', flag: '🇷🇺' },
  { code: '+63', name: 'Philippines', flag: '🇵🇭' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: '+52', name: 'Mexico', flag: '🇲🇽' },
  { code: '+380', name: 'Ukraine', flag: '🇺🇦' },
  { code: '+254', name: 'Kenya', flag: '🇰🇪' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
];

const PRESET_SPAM_PREFIXES = [
  { pattern: '1800*', label: '1-800 Toll Free' },
  { pattern: '1888*', label: '1-888 Toll Free' },
  { pattern: '1877*', label: '1-877 Toll Free' },
  { pattern: '1866*', label: '1-866 Toll Free' },
  { pattern: '1855*', label: '1-855 Toll Free' },
  { pattern: '1844*', label: '1-844 Toll Free' },
  { pattern: '1833*', label: '1-833 Toll Free' },
];

export const TwilioSpamShieldModal: React.FC<TwilioSpamShieldModalProps> = ({
  isOpen,
  onClose,
  projectId = 'dispatchgeeni',
  preFillNumber = '',
}) => {
  const [activeTab, setActiveTab] = useState<'PREFIXES' | 'COUNTRIES' | 'NUMBERS' | 'LOGS' | 'TEST'>('PREFIXES');
  const [config, setConfig] = useState<SpamShieldConfig>({
    enabled: true,
    blockAllNonNorthAmerica: true,
    blockedCountryCodes: ['+44', '+91', '+234', '+86', '+7', '+37', '+20', '+33'],
    blockedPrefixes: ['1800*', '1888*', '1877*', '1844*', '1855*', '1866*'],
    blockedNumbers: ['+18005550199', '+18885550123'],
    rejectionAction: 'busy',
  });
  const [history, setHistory] = useState<BlockedCallHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Form Inputs
  const [newPrefixInput, setNewPrefixInput] = useState('');
  const [newCountryInput, setNewCountryInput] = useState('');
  const [newNumberInput, setNewNumberInput] = useState(preFillNumber);

  // Test Simulator
  const [testNumberInput, setTestNumberInput] = useState(preFillNumber || '+1 (844) 932-8819');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/twilio/voice`
    : 'https://dispatchgeeni.com/api/twilio/voice';

  // Fetch current config & history
  const fetchSpamShield = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/twilio/spam-shield?project=${projectId}`);
      const data = await res.json();
      if (data.success && data.config) {
        setConfig(data.config);
        if (data.history) setHistory(data.history);
      }
    } catch (e) {
      console.warn('Failed to fetch spam shield config:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSpamShield();
      if (preFillNumber) {
        setNewNumberInput(preFillNumber);
        setTestNumberInput(preFillNumber);
      }
    }
  }, [isOpen, preFillNumber]);

  if (!isOpen) return null;

  // Save config update
  const handleSaveConfig = async (newConfig: Partial<SpamShieldConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    try {
      const res = await fetch(`/api/twilio/spam-shield?project=${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: updated }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusNotice('Shield rules updated and active in Twilio!');
        setTimeout(() => setStatusNotice(null), 3000);
      }
    } catch {
      setStatusNotice('Error saving spam configuration.');
    }
  };

  // Block item (number, prefix, country)
  const handleBlockItem = async (number: string, type: 'number' | 'prefix' | 'country', reason?: string) => {
    if (!number.trim()) return;
    try {
      const res = await fetch(`/api/twilio/block-number?project=${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: number.trim(), type, reason }),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        if (data.history) setHistory(data.history);
        setStatusNotice(`Blocked: ${number.trim()}`);
        setTimeout(() => setStatusNotice(null), 3000);
        if (type === 'prefix') setNewPrefixInput('');
        if (type === 'country') setNewCountryInput('');
        if (type === 'number') setNewNumberInput('');
      }
    } catch {
      setStatusNotice('Error blocking rule.');
    }
  };

  // Unblock item
  const handleUnblockItem = async (number: string, type: 'number' | 'prefix' | 'country') => {
    try {
      const res = await fetch(`/api/twilio/unblock-number?project=${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, type }),
      });
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setStatusNotice(`Unblocked: ${number}`);
        setTimeout(() => setStatusNotice(null), 3000);
      }
    } catch {
      setStatusNotice('Error unblocking rule.');
    }
  };

  // Test phone number
  const handleRunTest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!testNumberInput.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/twilio/test-number?project=${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: testNumberInput.trim() }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({
        isBlocked: false,
        reason: 'Error testing number against server endpoint.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Clear history
  const handleClearHistory = async () => {
    try {
      await fetch(`/api/twilio/clear-history?project=${projectId}`, { method: 'POST' });
      setHistory([]);
      setStatusNotice('Blocked call history cleared.');
      setTimeout(() => setStatusNotice(null), 2500);
    } catch {
      // ignore
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#10131d] border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden font-sans">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#161a28] border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Twilio Spam Shield &amp; Call Blocker
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live TwiML Protection
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Automatically stop robocalls, international numbers, and spammers who call over and over with rotating numbers. Blocked callers receive a busy signal before your phones ring.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Notification Toast */}
        {statusNotice && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between shadow-lg animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{statusNotice}</span>
            </div>
            <button onClick={() => setStatusNotice(null)} className="text-emerald-400 hover:text-white font-bold">×</button>
          </div>
        )}

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 pt-4">
          <div className="p-3 bg-[#171b29] rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Master Shield</div>
              <div className="text-xs font-black text-emerald-400">
                {config.enabled ? 'ACTIVE & ENFORCING' : 'DISABLED'}
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#171b29] rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Rotating Prefixes</div>
              <div className="text-xs font-black text-white">
                {config.blockedPrefixes.length} Patterns Active
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#171b29] rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Country Policy</div>
              <div className="text-xs font-black text-blue-300">
                {config.blockAllNonNorthAmerica ? '+1 US/Canada Only' : `${config.blockedCountryCodes.length} Blocked`}
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#171b29] rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <PhoneOff className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Stopped Calls</div>
              <div className="text-xs font-black text-amber-400">
                {history.length} Robocalls Dropped
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800 overflow-x-auto scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('PREFIXES')}
            className={`pb-3 px-3.5 font-bold transition-all flex items-center gap-1.5 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'PREFIXES'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Rotating Numbers &amp; Prefixes</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-300">
              {config.blockedPrefixes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('COUNTRIES')}
            className={`pb-3 px-3.5 font-bold transition-all flex items-center gap-1.5 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'COUNTRIES'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Country Codes</span>
            {config.blockAllNonNorthAmerica && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500/20 text-blue-300">
                +1 Only
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('NUMBERS')}
            className={`pb-3 px-3.5 font-bold transition-all flex items-center gap-1.5 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'NUMBERS'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>Blacklisted Numbers</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300">
              {config.blockedNumbers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('LOGS')}
            className={`pb-3 px-3.5 font-bold transition-all flex items-center gap-1.5 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'LOGS'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Blocked Calls Log</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/20 text-purple-300">
              {history.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('TEST')}
            className={`pb-3 px-3.5 font-bold transition-all flex items-center gap-1.5 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'TEST'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Live Tester &amp; Webhook</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* TAB 1: ROTATING NUMBERS & PREFIXES */}
          {activeTab === 'PREFIXES' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Highlight callout for repetitive spammers with rotating numbers */}
              <div className="p-4 rounded-2xl bg-[#1d1622] border border-purple-900/60 text-purple-200 shadow-sm text-xs leading-relaxed flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-purple-300">
                    How to stop spammers calling over and over from different numbers:
                  </div>
                  <div className="text-[12px] text-purple-200/90 mt-1">
                    Automated robocallers and repetitive telemarketers rotate their last 4 digits on every call to bypass simple number blocking. 
                    However, they almost always share the same <strong>Area Code or 6-digit Prefix (e.g. 1-844-*, 1-800-*, or local 780-999-*)</strong>. 
                    Adding the prefix pattern below blocks <strong>all rotating numbers from that caller instantly</strong>!
                  </div>
                </div>
              </div>

              {/* Add New Prefix Box */}
              <div className="bg-[#151926] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-rose-400" />
                  <span>Block a Rotating Prefix or Area Code</span>
                </h3>
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <div className="relative flex-1 w-full">
                    <input
                      type="text"
                      placeholder="e.g. 1844, 844, 1800, 780999, or 587400*"
                      value={newPrefixInput}
                      onChange={(e) => setNewPrefixInput(e.target.value)}
                      className="w-full pl-3.5 pr-3 py-2.5 bg-[#0f121d] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <button
                    onClick={() => {
                      let clean = newPrefixInput.trim().replace(/\D/g, '');
                      if (!clean) return;
                      if (!clean.endsWith('*')) clean = `${clean}*`;
                      handleBlockItem(clean, 'prefix', `Blocked rotating numbers matching pattern ${clean}`);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Block Rotating Prefix</span>
                  </button>
                </div>

                {/* Quick Add Buttons for Common Robocall Prefixes */}
                <div>
                  <div className="text-[11px] text-slate-400 mb-2 font-semibold">
                    1-Click Block Common Telemarketer Toll-Free Ranges:
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_SPAM_PREFIXES.map((p) => {
                      const isAlreadyBlocked = config.blockedPrefixes.some((bp) => bp.replace(/\D/g, '') === p.pattern.replace(/\D/g, ''));
                      return (
                        <button
                          key={p.pattern}
                          onClick={() => {
                            if (!isAlreadyBlocked) {
                              handleBlockItem(p.pattern, 'prefix', `Blocked toll-free robocalls (${p.label})`);
                            }
                          }}
                          disabled={isAlreadyBlocked}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                            isAlreadyBlocked
                              ? 'bg-rose-950/40 border-rose-900/60 text-rose-300 opacity-70 cursor-default'
                              : 'bg-[#1b2030] hover:bg-[#252b40] text-slate-200 border-slate-700/70'
                          }`}
                        >
                          <Hash className="w-3 h-3 text-rose-400" />
                          <span>{p.label}</span>
                          {isAlreadyBlocked && <Check className="w-3 h-3 text-rose-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Active Blocked Prefixes List */}
              <div className="bg-[#151926] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Active Blocked Prefix Rules ({config.blockedPrefixes.length})
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Incoming calls starting with these digits will be dropped
                  </span>
                </div>

                {config.blockedPrefixes.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    No rotating prefix rules active. Add a prefix pattern above to block spammers rotating numbers.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {config.blockedPrefixes.map((prefix) => (
                      <div
                        key={prefix}
                        className="p-3 bg-[#111420] border border-slate-800 rounded-xl flex items-center justify-between gap-2 shadow-xs group hover:border-rose-500/40 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-mono text-xs font-bold">
                            #
                          </div>
                          <div>
                            <div className="font-mono text-xs font-bold text-white">
                              {prefix}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Rejects any number starting with this
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnblockItem(prefix, 'prefix')}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                          title="Remove prefix rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: COUNTRY CODES */}
          {activeTab === 'COUNTRIES' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Master Country Toggle: Block All Non-North America */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/70 to-indigo-950/70 border border-blue-800/80 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-400" />
                    <h3 className="font-extrabold text-sm text-white">
                      Block All Non-North American Calls (+1 Canada &amp; US Only)
                    </h3>
                  </div>
                  <p className="text-xs text-blue-200/80 max-w-xl leading-relaxed">
                    Recommended for local Edmonton &amp; Canadian cleaning services. Drops 100% of overseas calls (India, Nigeria, UK, Russia, China, etc.) before your phone line rings.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={config.blockAllNonNorthAmerica}
                    onChange={(e) => handleSaveConfig({ blockAllNonNorthAmerica: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Specific Country Code Blacklist */}
              <div className="bg-[#151926] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    1-Click Add Frequent Spam Country Codes
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Block specific international prefixes if you keep overseas calling enabled
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {PRESET_SPAM_COUNTRIES.map((c) => {
                    const isBlocked = config.blockedCountryCodes.includes(c.code);
                    return (
                      <button
                        key={c.code}
                        onClick={() => {
                          if (isBlocked) {
                            handleUnblockItem(c.code, 'country');
                          } else {
                            handleBlockItem(c.code, 'country', `Blocked Country: ${c.name} (${c.code})`);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          isBlocked
                            ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                            : 'bg-[#121522] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{c.flag}</span>
                          <div>
                            <div className="font-bold text-xs">{c.name}</div>
                            <div className="font-mono text-[10px] text-slate-400">{c.code}</div>
                          </div>
                        </div>
                        {isBlocked ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400">
                            Blocked
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">+</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Country Code Input */}
                <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter custom country code (e.g. +33, +34, +49)"
                    value={newCountryInput}
                    onChange={(e) => setNewCountryInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#0f121d] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => {
                      let code = newCountryInput.trim();
                      if (!code.startsWith('+')) code = `+${code}`;
                      handleBlockItem(code, 'country', `Blocked Country Code ${code}`);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Add Country Block
                  </button>
                </div>
              </div>

              {/* Active Blocked Countries */}
              <div className="bg-[#151926] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Currently Blacklisted Country Codes ({config.blockedCountryCodes.length})
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {config.blockedCountryCodes.map((code) => {
                    const preset = PRESET_SPAM_COUNTRIES.find((p) => p.code === code);
                    return (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200"
                      >
                        <span>{preset?.flag || '🌐'}</span>
                        <span>{preset?.name || 'Country'}</span>
                        <span className="font-mono text-rose-400">{code}</span>
                        <button
                          onClick={() => handleUnblockItem(code, 'country')}
                          className="ml-1 text-slate-400 hover:text-white cursor-pointer"
                          title="Unblock country"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BLACKLISTED NUMBERS */}
          {activeTab === 'NUMBERS' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Add Single Number Form */}
              <div className="bg-[#151926] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Blacklist an Exact Phone Number</span>
                </h3>
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <input
                    type="text"
                    placeholder="Enter exact caller phone (e.g. +1 780 555 0199 or 800-555-0123)"
                    value={newNumberInput}
                    onChange={(e) => setNewNumberInput(e.target.value)}
                    className="w-full sm:flex-1 px-3.5 py-2.5 bg-[#0f121d] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => {
                      if (!newNumberInput.trim()) return;
                      handleBlockItem(newNumberInput.trim(), 'number', 'Manually blocked from Spam Shield');
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>Blacklist Number</span>
                  </button>
                </div>
              </div>

              {/* Blacklisted Numbers List */}
              <div className="bg-[#151926] p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Exact Blocked Numbers ({config.blockedNumbers.length})
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    These specific numbers cannot reach your dispatch line
                  </span>
                </div>

                {config.blockedNumbers.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No individual numbers blacklisted yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/80">
                    {config.blockedNumbers.map((num) => (
                      <div
                        key={num}
                        className="py-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                            <PhoneOff className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-mono font-bold text-white">{num}</div>
                            <div className="text-[11px] text-slate-400">Blacklisted phone caller</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnblockItem(num, 'number')}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold transition-all cursor-pointer"
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: BLOCKED CALLS LOG */}
          {activeTab === 'LOGS' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Live Audit Log of Dropped Robocalls
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time log of spam calls intercepted and rejected by your Twilio webhook
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchSpamShield}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  {history.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-xs font-bold transition-all cursor-pointer"
                    >
                      Clear Log
                    </button>
                  )}
                </div>
              </div>

              {history.length === 0 ? (
                <div className="bg-[#151926] p-8 rounded-2xl border border-slate-800 text-center space-y-2">
                  <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
                  <div className="text-sm font-bold text-slate-300">No Blocked Calls Logged Yet</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    When spam numbers, blocked country codes, or matching prefixes call your Twilio number, they will appear here with full timestamps.
                  </p>
                </div>
              ) : (
                <div className="bg-[#151926] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#10131f] border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Timestamp</th>
                          <th className="py-3 px-4">Caller ID &amp; Number</th>
                          <th className="py-3 px-4">Country Code</th>
                          <th className="py-3 px-4">Rejection Reason</th>
                          <th className="py-3 px-4 text-right">Action Taken</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {history.map((call) => {
                          const dateObj = new Date(call.timestamp);
                          const formattedTime = !isNaN(dateObj.getTime())
                            ? `${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
                            : call.timestamp;

                          return (
                            <tr key={call.id} className="hover:bg-[#191e2e]/50 transition-colors">
                              <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                                {formattedTime}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-mono font-bold text-white">{call.callerNumber}</div>
                                {call.callerName && (
                                  <div className="text-[11px] text-slate-400">{call.callerName}</div>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-blue-300">
                                  {call.countryCode || '+1'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-rose-300 font-medium">
                                {call.reason}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  Busy Tone Played (0 Ring)
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: TEST SIMULATOR & WEBHOOK */}
          {activeTab === 'TEST' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Test Phone Number Simulator */}
              <div className="bg-[#151926] p-5 rounded-2xl border border-slate-800 space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>Real-Time Phone Number Shield Simulator</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Paste any spam caller's phone number to test immediately against your country rules, prefixes, and blacklists.
                  </p>
                </div>

                <form onSubmit={handleRunTest} className="flex flex-col sm:flex-row items-center gap-2.5">
                  <input
                    type="text"
                    placeholder="Enter phone to test (e.g. +91 98200 12345 or 1-844-932-8819)"
                    value={testNumberInput}
                    onChange={(e) => setTestNumberInput(e.target.value)}
                    className="w-full sm:flex-1 px-3.5 py-2.5 bg-[#0f121d] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isTesting}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Evaluating...' : 'Test Shield Rules'}</span>
                  </button>
                </form>

                {/* Test Verdict Display */}
                {testResult && (
                  <div
                    className={`p-4 rounded-2xl border text-xs leading-relaxed animate-fadeIn ${
                      testResult.isBlocked
                        ? 'bg-rose-950/60 border-rose-800 text-rose-200'
                        : 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {testResult.isBlocked ? (
                        <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                      ) : (
                        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                      )}
                      <span className="font-extrabold text-sm">
                        {testResult.isBlocked
                          ? `BLOCKED: Caller will be rejected (${testResult.action || 'Busy tone'})`
                          : 'ALLOWED: Caller will connect to Dispatch Line'}
                      </span>
                    </div>

                    <div className="mt-2 text-xs font-mono">
                      Reason: <strong className="underline">{testResult.reason}</strong>
                    </div>

                    {testResult.twimlPreview && (
                      <div className="mt-3 p-3 bg-black/40 rounded-xl font-mono text-[11px] text-slate-300 border border-slate-800">
                        <div className="text-[10px] text-slate-500 mb-1">Generated Twilio Voice XML (TwiML):</div>
                        <pre className="overflow-x-auto">{testResult.twimlPreview}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Twilio Voice Webhook Configuration */}
              <div className="bg-[#151926] p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-violet-400" />
                    <h3 className="font-bold text-sm text-white">Twilio Voice Webhook Endpoint</h3>
                  </div>
                  <span className="text-[11px] text-slate-400">HTTP POST / GET supported</span>
                </div>

                <div className="flex items-center gap-2 bg-[#0f121d] p-2.5 rounded-xl border border-slate-800">
                  <span className="font-mono text-xs text-violet-300 flex-1 truncate select-all">
                    {webhookUrl}
                  </span>
                  <button
                    onClick={handleCopyWebhook}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-3 bg-[#111420] rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1 leading-relaxed">
                  <p>
                    <strong>Setup Instructions in Twilio Console:</strong>
                  </p>
                  <p>
                    1. Go to Twilio Console → <em>Phone Numbers</em> → <em>Manage</em> → <em>Active Numbers</em>.
                  </p>
                  <p>
                    2. Select your dispatch phone number and under <strong>Voice &amp; Fax</strong> set <em>"A CALL COMES IN"</em> to <strong>Webhook</strong> and paste the URL above.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-[#161a28] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Real-time protection enabled for all incoming Twilio &amp; Quo calls</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
