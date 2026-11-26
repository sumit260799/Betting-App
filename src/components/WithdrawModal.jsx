import { useState } from 'react';
import { useTournament } from '../context/useTournament';
import { Modal } from './Modal';
import {
  X,
  ArrowUpRight,
  Coins,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Info,
} from 'lucide-react';

const STATUS_STYLE = {
  pending: {
    label: 'Pending Admin Payout',
    classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: Clock,
  },
  paid: {
    label: 'Paid',
    classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected (Refunded)',
    classes: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    icon: XCircle,
  },
};

const PAYOUT_METHODS = [
  { id: 'UPI', label: 'UPI' },
  { id: 'Cash', label: 'Cash' },
  { id: 'Bank Transfer', label: 'Bank' },
];

export const WithdrawModal = ({ onClose }) => {
  const {
    currentUser,
    oddsConfig,
    myWithdrawals,
    requestWithdrawal,
  } = useTournament();

  const [amount, setAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('UPI');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const feePct = Number(oddsConfig?.withdrawFeePct ?? 10);
  const balance = Number(currentUser?.balance ?? 0);

  const parsed = Number(amount);
  const numAmount = amount !== '' && Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  const feeAmount = Number(((numAmount * feePct) / 100).toFixed(2));
  const netAmount = Number((numAmount - feeAmount).toFixed(2));
  const exceedsBalance = numAmount > balance;
  const needsDetails = payoutMethod === 'UPI' || payoutMethod === 'Bank Transfer';
  const missingDetails = needsDetails && payoutDetails.trim().length === 0;

  const handleAmountChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      setAmount('');
      return;
    }
    const cleaned = raw.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const normalized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
    setAmount(normalized);
  };

  const handleKeyDown = (e) => {
    if (['-', '+', 'e', 'E'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setStatusMessage({ type: 'error', text: 'Please login with OTP first.' });
      return;
    }
    if (numAmount <= 0) {
      setStatusMessage({ type: 'error', text: 'Enter a withdrawal amount greater than ₹0.' });
      return;
    }
    if (exceedsBalance) {
      setStatusMessage({ type: 'error', text: `Amount exceeds your available balance (₹${balance}).` });
      return;
    }
    if (missingDetails) {
      setStatusMessage({
        type: 'error',
        text: payoutMethod === 'UPI' ? 'Please enter your UPI ID.' : 'Please enter your bank account & IFSC.',
      });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);
    const res = await requestWithdrawal(numAmount, {
      payoutMethod,
      payoutDetails: payoutDetails.trim(),
      payoutNote: payoutNote.trim(),
    });
    setSubmitting(false);

    if (res.success) {
      setAmount('');
      setPayoutNote('');
      setStatusMessage({ type: 'success', text: res.message });
    } else {
      setStatusMessage({ type: 'error', text: res.message || 'Failed to submit withdrawal request.' });
    }
  };

  const isSubmitDisabled = submitting || !currentUser || numAmount <= 0 || exceedsBalance || missingDetails;

  return (
    <Modal onClose={onClose} maxWidth="md">
      {/* Header */}
      <div className="px-5 py-3.5 pr-12 bg-white/[0.02] border-b border-white/[0.07] relative flex-shrink-0">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-1.5 text-emerald-400 text-[11px] font-semibold uppercase tracking-wider">
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Wallet Cash-Out</span>
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-100 mt-0.5">
          Withdraw Wallet Points
        </h3>
        {/* <p className="text-[11px] text-slate-400">
          0% fee on deposits &amp; betting • {feePct}% platform fee applies on withdrawal
        </p> */}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 text-xs">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block">Available Wallet Balance</span>
            <span className="font-bold text-slate-200">{currentUser?.name}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-base font-black text-amber-300 font-mono">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>₹{balance}</span>
          </div>
        </div>

        <form id="withdraw-form" onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Withdraw Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0"
                max={balance || undefined}
                value={amount}
                onKeyDown={handleKeyDown}
                onChange={handleAmountChange}
                placeholder="Enter amount to withdraw"
                className={`w-full bg-slate-950 border rounded-xl pl-8 pr-4 py-2.5 text-base font-bold text-amber-300 font-mono focus:outline-none transition ${exceedsBalance
                  ? 'border-rose-500/70 focus:border-rose-400'
                  : 'border-white/[0.1] focus:border-amber-500'
                  }`}
              />
            </div>

            {exceedsBalance && (
              <p className="text-[11px] text-rose-400 mt-1 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Amount exceeds your available balance (₹{balance}).</span>
              </p>
            )}

            {balance > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  { label: '25%', val: Math.floor(balance * 0.25) },
                  { label: '50%', val: Math.floor(balance * 0.5) },
                  { label: 'Max All', val: balance },
                ]
                  .filter((p) => p.val > 0)
                  .map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setAmount(String(chip.val))}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold font-mono bg-white/[0.04] hover:bg-white/[0.1] text-slate-300 border border-white/[0.08] transition"
                    >
                      {chip.label} (₹{chip.val})
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Payout Method Selector */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Receive Payout Via
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/[0.07]">
              {PAYOUT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPayoutMethod(m.id)}
                  className={`py-1.5 rounded-lg font-semibold transition ${payoutMethod === m.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {needsDetails && (
              <input
                type="text"
                maxLength={150}
                value={payoutDetails}
                onChange={(e) => setPayoutDetails(e.target.value)}
                placeholder={
                  payoutMethod === 'UPI'
                    ? 'Enter your UPI ID (e.g. yourname@okaxis)'
                    : 'Enter Account No & IFSC code'
                }
                className="w-full bg-slate-950 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
            )}
          </div>

          {/* Transparent Fee Breakdown */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/[0.08] space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Requested Withdrawal</span>
              <span className="font-mono font-semibold text-slate-200">₹{numAmount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Platform Fee ({feePct}%)</span>
              <span className="font-mono font-semibold text-rose-400">-₹{feeAmount}</span>
            </div>
            <div className="pt-2 border-t border-white/[0.07] flex justify-between items-center">
              <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px]">
                Net Amount You Receive
              </span>
              <span className="text-lg font-black font-mono text-emerald-400">
                ₹{netAmount}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Note (Optional)
            </label>
            <input
              type="text"
              maxLength={200}
              value={payoutNote}
              onChange={(e) => setPayoutNote(e.target.value)}
              placeholder={payoutMethod === 'Cash' ? 'e.g. Collect in person at office' : 'e.g. PhonePe / GPay name'}
              className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-start space-x-2 text-[11px] text-indigo-200/80">
            <Info className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <span>
              Admin pays the net amount via your chosen method and marks it paid. If rejected, the full requested amount returns to your wallet.
            </span>
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 border ${statusMessage.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
              : 'bg-rose-950/40 text-rose-300 border-rose-500/40'
              }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </form>

        {/* Recent Player Withdrawals */}
        {myWithdrawals.length > 0 && (
          <div className="pt-2 border-t border-white/[0.07] space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Your Withdrawal Requests ({myWithdrawals.length})
            </h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {myWithdrawals.map((w) => {
                const st = STATUS_STYLE[w.status] || STATUS_STYLE.pending;
                const Icon = st.icon;
                return (
                  <div
                    key={w.id}
                    className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-slate-100">
                        Receive ₹{w.netAmount}{' '}
                        <span className="text-[10px] font-normal text-slate-400">
                          ({w.payoutMethod}{w.payoutDetails ? `: ${w.payoutDetails}` : ''})
                        </span>
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        From ₹{w.grossAmount} ({w.feePct}% fee) •{' '}
                        {new Date(w.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full border text-[10px] font-bold flex-shrink-0 ${st.classes}`}>
                      <Icon className="w-3 h-3" />
                      <span>{st.label}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-[#0a0f18] border-t border-white/[0.07] flex-shrink-0">
        <button
          type="submit"
          form="withdraw-form"
          disabled={isSubmitDisabled}
          className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-1.5 ${isSubmitDisabled
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
            : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
            }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>
            {submitting
              ? 'Submitting Request...'
              : numAmount > 0
                ? `Request Withdraw (Receive ₹${netAmount})`
                : 'Enter Amount to Withdraw'}
          </span>
        </button>
      </div>
    </Modal>
  );
};
