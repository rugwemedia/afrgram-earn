import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, AtSign, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function Register() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [handle, setHandle] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);

        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    handle: handle.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                },
                // No emailRedirectTo — rely on auto-confirm in Supabase settings
            },
        });

        if (signUpError) {
            // Friendly error messages
            const msg = signUpError.message;
            if (msg.includes('email rate limit') || msg.includes('Email rate limit') || msg.includes('over_email_send_rate_limit')) {
                setError('Too many sign-up attempts. Please wait a few minutes and try again.');
            } else if (msg.includes('already registered') || msg.includes('User already registered')) {
                setError('This email is already registered. Please sign in instead.');
            } else {
                setError(msg);
            }
            setLoading(false);
            return;
        }

        // If user is returned, redirect to dashboard immediately
        if (data?.user) {
            navigate('/dashboard');
            return;
        }

        // Fallback (only if email confirmation is strictly required in Supabase settings)
        setSuccess(true);
        setLoading(false);
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-background">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_25%)] opacity-20" />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="glass-card max-w-md w-full p-10 rounded-[2rem] text-center relative z-10 space-y-6"
                >
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <ShieldCheck size={40} className="text-emerald-500" />
                    </div>
                    <h2 className="text-3xl font-black text-white">Almost There!</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        We sent a confirmation email to <span className="text-white font-bold">{email}</span>.
                        Click the link in the email to activate your account and start earning.
                    </p>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-sm text-amber-400">
                        💡 <strong>Tip:</strong> Check your spam/junk folder if you don't see it within 2 minutes.
                    </div>
                    <button onClick={() => navigate('/login')} className="btn-premium w-full py-4 font-black">
                        Go to Login
                    </button>
                    <button onClick={() => { setSuccess(false); setError(null); }} className="text-sm text-muted-foreground hover:text-white transition-colors">
                        ← Back to Register
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.15)_0%,_transparent_60%)]" />
            <div className="absolute top-32 right-1/4 w-64 h-64 bg-primary/10 blur-[100px] rounded-full" />
            <div className="absolute bottom-32 left-1/4 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full" />

            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                className="glass-card max-w-md w-full p-8 rounded-[2rem] relative z-10"
            >
                {/* Top gradient bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-t-[2rem]" />

                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                        <span className="text-white font-black text-2xl italic">A</span>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Join AFGgram</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Earn real money doing simple tasks</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm flex items-start gap-3 mb-6"
                    >
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </motion.div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    {/* Name + Handle */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                                <input
                                    type="text"
                                    required
                                    placeholder="John Doe"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-10 pr-3 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none text-white text-sm transition-all placeholder:text-muted-foreground/40"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Username</label>
                            <div className="relative group">
                                <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                                <input
                                    type="text"
                                    required
                                    placeholder="johndoe"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-10 pr-3 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none text-white text-sm transition-all placeholder:text-muted-foreground/40"
                                    style={{ textTransform: 'lowercase' }}
                                    value={handle}
                                    onChange={e => setHandle(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="email"
                                required
                                placeholder="name@example.com"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none text-white text-sm transition-all placeholder:text-muted-foreground/40"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type={showPass ? 'text' : 'password'}
                                required
                                minLength={6}
                                placeholder="Min. 6 characters"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none text-white text-sm transition-all placeholder:text-muted-foreground/40"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(v => !v)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                            >
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Confirm Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type={showPass ? 'text' : 'password'}
                                required
                                placeholder="Repeat password"
                                className={`w-full bg-white/5 border rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 outline-none text-white text-sm transition-all placeholder:text-muted-foreground/40 ${confirmPassword && confirmPassword !== password ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 focus:ring-primary/50 focus:border-primary/50'}`}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-premium w-full py-4 font-black flex items-center justify-center gap-2 disabled:opacity-50 text-base mt-2"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating Account…</span>
                        ) : (
                            <><span>Create Account</span><ArrowRight size={20} /></>
                        )}
                    </button>

                    <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
                        By registering you agree to our Terms of Service and Privacy Policy.
                    </p>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-muted-foreground text-sm">
                        Already have an account?{' '}
                        <a href="/login" className="text-primary font-bold hover:underline">Sign In</a>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
