import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Globe, TrendingUp } from 'lucide-react';

export function Landing() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background overflow-hidden relative">
            {/* Background Ambient Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />

            {/* Navigation Header */}
            <nav className="relative z-20 flex justify-between items-center px-6 md:px-12 py-8 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                >
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="text-white font-black text-xl">A</span>
                    </div>
                    <span className="text-2xl font-black text-white tracking-tighter">AFGgram</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-6"
                >
                    <button
                        onClick={() => navigate('/login')}
                        className="text-white font-bold hover:text-primary transition-colors text-sm"
                    >
                        Login
                    </button>
                    <button
                        onClick={() => navigate('/register')}
                        className="btn-premium px-6 py-2.5 text-sm"
                    >
                        Get Started
                    </button>
                </motion.div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-32 flex flex-col items-center text-center">
                {/* Animated Logo Container */}
                <motion.div
                    initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 10,
                        delay: 0.2
                    }}
                    className="relative mb-12"
                >
                    <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-primary to-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.5)] relative overflow-hidden group">
                        <motion.span
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-6xl md:text-7xl font-black text-white italic tracking-tighter"
                        >
                            AFG
                        </motion.span>
                        {/* Gloss Effect */}
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="absolute -right-4 -bottom-4 bg-emerald-500 text-black px-4 py-1.5 rounded-full font-black text-xs shadow-lg"
                    >
                        LIVE & SECURE
                    </motion.div>
                </motion.div>

                {/* Hero Text */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-6 max-w-3xl"
                >
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[0.95]">
                        The New Era of <br />
                        <span className="text-primary italic">Digital Earnings.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                        AFGgram combines social engagement with high-yield digital tasks. Verify accounts, share content, and earn real commissions in a secure, decentralized environment.
                    </p>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-col sm:flex-row gap-4 mt-12"
                >
                    <button
                        onClick={() => navigate('/register')}
                        className="btn-premium px-10 py-5 text-lg font-black flex items-center gap-3 group"
                    >
                        Register Now <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-10 py-5 rounded-2xl transition-all backdrop-blur-md"
                    >
                        Access Dashboard
                    </button>
                </motion.div>

                {/* Feature Highlights */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-24 w-full"
                >
                    {[
                        { icon: Zap, label: 'Instant Payouts', detail: 'MTN & Airtel integration' },
                        { icon: ShieldCheck, label: 'Secure Verification', detail: 'End-to-End Encryption' },
                        { icon: Globe, label: 'Global Market', detail: '24/7 Access Anywhere' },
                        { icon: TrendingUp, label: 'High Commissions', detail: 'Best rates in Rwanda' }
                    ].map((feature, i) => (
                        <div key={i} className="glass-card p-6 rounded-3xl text-left hover:border-primary/50 transition-colors group">
                            <feature.icon className="text-primary mb-4 group-hover:scale-110 transition-transform" size={24} />
                            <h4 className="text-white font-bold mb-1">{feature.label}</h4>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-tight">{feature.detail}</p>
                        </div>
                    ))}
                </motion.div>
            </main>

            {/* Footer Info */}
            <footer className="absolute bottom-8 left-0 right-0 text-center">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.4em]">
                    Powered by Rugwe Media Group © 2024
                </p>
            </footer>
        </div>
    );
}
