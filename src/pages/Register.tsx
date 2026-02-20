import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';


export function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [handle, setHandle] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'info' | 'otp'>('info');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin,
                data: {
                    full_name: fullName,
                    handle: handle.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                }
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setStep('otp');
            setLoading(false);
        }
    };

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
                    <h1 className="text-3xl font-black text-white tracking-tight">Create Account</h1>
                    <p className="text-muted-foreground mt-2">Join the future of micro-earning.</p>
                </div>

                {step === 'info' ? (
                    <form onSubmit={handleRegister} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-sm flex items-center gap-2">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground ml-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="John Doe"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-white transition-all"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground ml-1">Username/Handle</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="johndoe"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-white transition-all uppercase"
                                    style={{ textTransform: 'lowercase' }}
                                    value={handle}
                                    onChange={(e) => setHandle(e.target.value)}
                                />
                            </div>
                        </div>

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
                            <label className="text-sm font-bold text-muted-foreground ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    type="password"
                                    required
                                    placeholder="Min. 8 characters"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-white transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="btn-premium w-full py-4 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Securing...' : 'Verify Email & Password'}
                            <ArrowRight size={20} />
                        </button>
                    </form>
                ) : (
                    <div className="text-center space-y-6">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-4 rounded-2xl inline-block">
                            <ShieldCheck size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Verification Sent!</h2>
                        <p className="text-muted-foreground">
                            Please check <b>{email}</b> for a verification link to activate your account.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="text-primary font-bold hover:underline"
                        >
                            Didn't receive it? Resend
                        </button>
                    </div>
                )}

                <div className="mt-8 text-center">
                    <p className="text-muted-foreground text-sm">
                        Already have an account? <a href="/login" className="text-primary font-bold hover:underline">Sign In</a>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
