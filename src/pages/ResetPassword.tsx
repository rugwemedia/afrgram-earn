import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ready, setReady] = useState(false); // true once Supabase parsed the hash
    const navigate = useNavigate();

    // Supabase sends a recovery link that includes the tokens as a hash fragment.
    // We listen for the PASSWORD_RECOVERY event to know the session is ready.
    useEffect(() => {
        // If the URL hash contains type=recovery, Supabase will fire this event
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setReady(true);
            }
        });

        // Also handle case where user lands here already signed in via the magic link
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setReady(true);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.updateUser({ password });

        setLoading(false);
        if (error) {
            setError(error.message);
        } else {
            setDone(true);
            // Auto-redirect after 3 seconds
            setTimeout(() => navigate('/dashboard'), 3000);
        }
    };

    // Strength indicator
    const strength = password.length === 0 ? 0
        : password.length < 6 ? 1
            : password.length < 10 ? 2
                : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;

    const strengthColors = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];
    const strengthLabels = ['', 'Weak', 'Fair', 'Strong', 'Very Strong'];

    if (!ready) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_25%)] opacity-20" />
                <div className="glass-card max-w-md w-full p-10 rounded-[2rem] text-center space-y-4 relative z-10">
                    <Loader2 size={40} className="text-primary animate-spin mx-auto" />
                    <p className="text-white font-bold">Verifying reset link...</p>
                    <p className="text-muted-foreground text-sm">
                        If this takes too long, the link may have expired. Please request a new one.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="mt-4 text-primary font-bold hover:underline text-sm"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    if (done) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_25%)] opacity-20" />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="glass-card max-w-md w-full p-10 rounded-[2rem] text-center space-y-6 flex flex-col items-center relative z-10"
                >
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                        <CheckCircle2 size={40} className="text-emerald-500" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white">Password Updated!</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Your password has been successfully changed. Redirecting you to the dashboard...
                        </p>
                    </div>
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_25%)] opacity-20" />

            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-card max-w-md w-full p-8 rounded-[2rem] relative z-10"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                        <ShieldCheck size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Set New Password</h1>
                    <p className="text-muted-foreground mt-2 text-center text-sm">
                        Choose a strong password for your AFGgram account.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm mb-6 flex items-center gap-2">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                <form onSubmit={handleReset} className="space-y-5">
                    {/* New Password */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground ml-1">New Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                            <input
                                type={showPw ? 'text' : 'password'}
                                required
                                placeholder="Min. 6 characters"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-white transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(p => !p)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                            >
                                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Strength bar */}
                        {password.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4].map(i => (
                                        <div
                                            key={i}
                                            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= strength ? strengthColors[strength] : 'bg-white/10'}`}
                                        />
                                    ))}
                                </div>
                                <p className={`text-xs font-bold ${strengthColors[strength].replace('bg-', 'text-')}`}>
                                    {strengthLabels[strength]}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground ml-1">Confirm Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                required
                                placeholder="Repeat your password"
                                className={`w-full bg-white/5 border rounded-2xl py-4 pl-12 pr-12 focus:ring-2 outline-none text-white transition-all ${confirm && password !== confirm
                                        ? 'border-red-500/50 focus:ring-red-500/20'
                                        : 'border-white/10 focus:ring-primary/50 focus:border-primary'
                                    }`}
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(p => !p)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                            >
                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {confirm && password !== confirm && (
                            <p className="text-xs text-red-400 font-bold ml-1">Passwords don't match</p>
                        )}
                    </div>

                    <button
                        disabled={loading || (!!confirm && password !== confirm)}
                        className="btn-premium w-full py-4 text-white font-bold flex items-center justify-center gap-2 mt-2"
                    >
                        {loading
                            ? <><Loader2 size={20} className="animate-spin" /> Updating...</>
                            : <><ShieldCheck size={20} /> Set New Password</>
                        }
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
