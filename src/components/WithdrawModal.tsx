import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, DollarSign, Clock, Check, AlertCircle } from 'lucide-react';

import { cn } from '../utils/cn';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    balance: number;
}

const MIN_WITHDRAW = 1000;

const FEE_PERCENT = 0.10;

export function WithdrawModal({ isOpen, onClose, balance }: WithdrawModalProps) {
    const { user } = useAuth();
    const [method, setMethod] = useState<'MTN' | 'AIRTEL'>('MTN');
    const [phone, setPhone] = useState('');
    const [amount, setAmount] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Time-based guard (7 AM - 7 PM GMT)
    const isWithdrawTime = () => {
        const now = new Date();
        const gmtHour = now.getUTCHours();
        return gmtHour >= 7 && gmtHour < 19;
    };

    const calculateTotal = () => {
        const val = parseFloat(amount) || 0;
        return val + (val * FEE_PERCENT);
    };

    const handleWithdraw = async () => {
        setError(null);
        const val = parseFloat(amount);

        if (!isWithdrawTime()) {
            setError('Withdrawals are only processed between 7:00 AM – 7:00 PM GMT.');
            return;
        }

        if (val < MIN_WITHDRAW) {
            setError(`Minimum withdrawal is ${MIN_WITHDRAW} RWF.`);
            return;
        }

        if (calculateTotal() > balance) {
            setError('Insufficient balance (including 10% fee).');
            return;
        }

        if (!/^07[8,9,2,3]\d{7}$/.test(phone)) {
            setError('Invalid Rwandan mobile money number.');
            return;
        }

        setLoading(true);
        try {
            const { error: insertError } = await supabase
                .from('withdrawals')
                .insert({
                    user_id: user?.id,
                    amount: val,
                    method: method,
                    phone: phone,
                    fee: val * FEE_PERCENT,
                    total_deduction: calculateTotal(),
                    status: 'pending'
                });

            if (insertError) throw insertError;

            setIsSuccess(true);
        } catch (err: any) {
            console.error('Withdrawal error:', err);
            setError(err.message || 'Failed to submit withdrawal request.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="glass-card max-w-md w-full p-8 rounded-[2.5rem] relative z-10 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-white tracking-tight">Withdraw Funds</h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X size={20} className="text-muted-foreground" />
                            </button>
                        </div>

                        {!isSuccess ? (
                            <div className="space-y-6">
                                {/* Method Selection */}
                                <div className="grid grid-cols-2 gap-4">
                                    {(['MTN', 'AIRTEL'] as const).map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => setMethod(m)}
                                            className={cn(
                                                "p-4 rounded-2xl border transition-all flex flex-col items-center gap-2",
                                                method === m
                                                    ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20"
                                                    : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-12 h-12 rounded-full flex items-center justify-center font-black text-sm",
                                                m === 'MTN' ? "bg-yellow-400 text-black" : "bg-red-500 text-white"
                                            )}>
                                                {m}
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider">{m} Money</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Inputs */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-muted-foreground uppercase ml-1">Mobile Number</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                                            <input
                                                type="text"
                                                placeholder="07XXXXXXXX"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/50 outline-none text-white transition-all font-mono"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-muted-foreground uppercase ml-1">Amount (RWF)</label>
                                        <div className="relative group">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                                            <input
                                                type="number"
                                                placeholder="Min. 1,000"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/50 outline-none text-white transition-all font-bold text-lg"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Info & Error */}
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs font-bold text-muted-foreground px-1">
                                        <span>Transaction Fee (10%):</span>
                                        <span>{(parseFloat(amount) * FEE_PERCENT || 0).toLocaleString()} RWF</span>
                                    </div>
                                    <div className="flex justify-between text-base font-black text-white px-1">
                                        <span>Total Deduction:</span>
                                        <span className="text-primary">{calculateTotal().toLocaleString()} RWF</span>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-xs flex items-center gap-2"
                                        >
                                            <AlertCircle size={14} />
                                            {error}
                                        </motion.div>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <button
                                        onClick={handleWithdraw}
                                        disabled={loading || !amount || !phone}
                                        className="btn-premium w-full py-4 text-white font-black flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>Push To {method} Wallet <ArrowUpRight size={18} /></>
                                        )}
                                    </button>
                                    <p className="text-[10px] text-muted-foreground text-center mt-4 uppercase tracking-widest flex items-center justify-center gap-1">
                                        <Clock size={10} /> Mon - Sat | 7AM - 7PM GMT
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-10 space-y-6"
                            >
                                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                                    <Check size={40} className="text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white">Transfer Initiated</h3>
                                    <p className="text-muted-foreground mt-2 px-4 italic">
                                        Funds will be disbursed to your {method} wallet within 15-30 minutes.
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsSuccess(false);
                                        onClose();
                                    }}
                                    className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-2xl transition-all"
                                >
                                    Close Secure Window
                                </button>
                            </motion.div>
                        )}

                        {/* Ambient Background Glow */}
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

const ArrowUpRight = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg>
);
