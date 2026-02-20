import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail, Lock, ArrowRight, AlertCircle,
    KeyRound, ChevronLeft, SendHorizonal, CheckCircle2, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

type View = 'login' | 'forgot' | 'sent';

export function Login() {
    const [view, setView] = useState<View>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // --- Login ---
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            navigate('/');
        }
    };

    // --- Send password reset email ---
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const redirectTo = `${window.location.origin}/reset-password`;

        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
            redirectTo,
        });

        setLoading(false);
        if (error) {
            setError(error.message);
        } else {
            setView('sent');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_25%)] opacity-20" />

            <AnimatePresence mode="wait">

                {/* ── LOGIN VIEW ── */}
                {view === 'login' && (
                    <motion.div
                        key="login"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="glass-card max-w-md w-full p-8 rounded-[2rem] relative z-10"
                    >
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                                <KeyRound size={32} className="text-white" />
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight">Welcome Back</h1>
                            <p className="text-muted-foreground mt-2 text-center">Securely access your AFGgram account.</p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm mb-6 flex items-center gap-2">
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                                    <input
                                        type="email"
                                        required
                                        placeholder="name@example.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-white transition-all"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-sm font-bold text-muted-foreground">Password</label>
                                    <button
                                        type="button"
                                        onClick={() => { setError(null); setResetEmail(email); setView('forgot'); }}
                                        className="text-xs font-bold text-primary hover:underline transition-opacity hover:opacity-80"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                                    <input
                                        type="password"
                                        required
                                        placeholder="Enter your password"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-white transition-all"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                disabled={loading}
                                className="btn-premium w-full py-4 text-white font-bold flex items-center justify-center gap-2"
                            >
                                {loading
                                    ? <><Loader2 size={20} className="animate-spin" /> Authenticating...</>
                                    : <> Sign In <ArrowRight size={20} /></>
                                }
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-muted-foreground text-sm">
                                New here? <a href="/register" className="text-primary font-bold hover:underline">Create Account</a>
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* ── FORGOT PASSWORD VIEW ── */}
                {view === 'forgot' && (
                    <motion.div
                        key="forgot"
                        initial={{ x: 40, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -40, opacity: 0 }}
                        className="glass-card max-w-md w-full p-8 rounded-[2rem] relative z-10"
                    >
                        <button
                            onClick={() => { setError(null); setView('login'); }}
                            className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-8 font-bold text-sm"
                        >
                            <ChevronLeft size={18} /> Back to Login
                        </button>

                        <div className="flex flex-col items-center mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                                <Mail size={28} className="text-primary" />
                            </div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Reset Password</h1>
                            <p className="text-muted-foreground mt-2 text-center text-sm leading-relaxed">
                                Enter your email address and we'll send you a secure link to reset your password.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm mb-6 flex items-center gap-2">
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}

                        <form onSubmit={handleForgotPassword} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                                    <input
                                        type="email"
                                        required
                                        placeholder="name@example.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-white transition-all"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                disabled={loading}
                                className="btn-premium w-full py-4 text-white font-bold flex items-center justify-center gap-2"
                            >
                                {loading
                                    ? <><Loader2 size={20} className="animate-spin" /> Sending Link...</>
                                    : <> Send Reset Link <SendHorizonal size={18} /></>
                                }
                            </button>
                        </form>
                    </motion.div>
                )}

                {/* ── EMAIL SENT CONFIRMATION VIEW ── */}
                {view === 'sent' && (
                    <motion.div
                        key="sent"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-card max-w-md w-full p-10 rounded-[2rem] relative z-10 text-center space-y-6 flex flex-col items-center"
                    >
                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                            <CheckCircle2 size={40} className="text-emerald-500" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-white">Check Your Email</h2>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                A password reset link has been sent to
                            </p>
                            <p className="text-primary font-black text-sm">{resetEmail}</p>
                            <p className="text-muted-foreground text-xs mt-2 leading-relaxed">
                                Click the link in the email to set a new password. The link expires in 1 hour. Check your spam folder if you don't see it.
                            </p>
                        </div>

                        <div className="w-full space-y-3">
                            <button
                                onClick={() => { setError(null); setView('forgot'); }}
                                className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all text-sm"
                            >
                                Resend Email
                            </button>
                            <button
                                onClick={() => { setError(null); setView('login'); }}
                                className="w-full text-sm text-muted-foreground hover:text-white transition-colors font-bold"
                            >
                                Back to Login
                            </button>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}
