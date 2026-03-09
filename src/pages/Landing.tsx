import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const LoadingScreen = () => (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center gap-8">
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)] mb-4"
        >
            <span className="text-white font-black text-2xl italic">A</span>
        </motion.div>
        <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                    key={i}
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut"
                    }}
                    className="w-2.5 h-2.5 bg-primary rounded-full"
                />
            ))}
        </div>
    </div>
);

export function Landing() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <AnimatePresence>
                {loading && <LoadingScreen key="loader" />}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="min-h-screen bg-background text-white overflow-x-hidden flex flex-col"
            >
                {/* ── Ambient BG ── */}
                <div className="pointer-events-none fixed inset-0 z-0">
                    <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-primary/15 blur-[140px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-purple-600/10 blur-[140px] rounded-full" />
                </div>

                {/* ── Navbar ── */}
                <nav className="relative z-20 flex justify-between items-center px-6 md:px-16 py-8 max-w-7xl mx-auto w-full">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                            <span className="text-white font-black text-lg italic">A</span>
                        </div>
                        <span className="text-2xl font-black tracking-tighter">Afrgram</span>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
                        <button onClick={() => navigate('/login')} className="text-white/60 font-bold hover:text-white transition-colors text-sm px-4">
                            Log In
                        </button>
                        <button onClick={() => navigate('/register')} className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-black hover:bg-white/90 transition-all">
                            Join Now
                        </button>
                    </motion.div>
                </nav>

                {/* ── Hero ── */}
                <main className="flex-1 flex flex-col items-center justify-center relative z-10 max-w-7xl mx-auto px-6 text-center py-20">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-8"
                    >
                        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">The Gen-Z Web</span>
                        </div>

                        <h1 className="text-6xl md:text-9xl font-black tracking-tight leading-[0.85] mb-4">
                            Chat Free.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-emerald-400 italic">
                                Secure & Earn.
                            </span>
                        </h1>

                        <p className="text-lg md:text-2xl text-white/40 font-medium max-w-2xl mx-auto leading-relaxed">
                            Afrgram is a simple, secure, and earnable web app built for connection.
                            Chat with peers and get rewarded in real <span className="text-white font-bold">RWF</span> instantly.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                            <button
                                onClick={() => navigate('/register')}
                                className="bg-primary text-white px-12 py-5 rounded-[2rem] text-xl font-black flex items-center justify-center gap-3 hover:scale-105 transition-transform shadow-[0_20px_40px_rgba(59,130,246,0.3)]"
                            >
                                Get Started <ArrowRight />
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-white/5 border border-white/10 text-white px-12 py-5 rounded-[2rem] text-xl font-black backdrop-blur-md hover:bg-white/10 transition-all"
                            >
                                Sign In
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 pt-12 text-white/30 font-black text-[10px] uppercase tracking-[0.3em]">
                            <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500/50" /> End-to-End Secure</div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500/50" /> Zero Fees</div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500/50" /> Instant Payouts</div>
                        </div>
                    </motion.div>
                </main>

                {/* ── Footer ── */}
                <footer className="relative z-10 py-12 px-6 md:px-16 border-t border-white/5">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-2.5 opacity-50">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-white font-black text-sm italic">A</span>
                            </div>
                            <span className="font-black text-white tracking-tighter">Afrgram</span>
                        </div>
                        <div className="flex gap-12 text-xs font-black uppercase tracking-widest text-white/30">
                            <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Support</button>
                            <button onClick={() => navigate('/register')} className="hover:text-white transition-colors">Privacy</button>
                            <button onClick={() => navigate('/register')} className="hover:text-white transition-colors">Terms</button>
                        </div>
                        <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.4em]">
                            © 2025 RUGWE MEDIA
                        </p>
                    </div>
                </footer>
            </motion.div>
        </>
    );
}
