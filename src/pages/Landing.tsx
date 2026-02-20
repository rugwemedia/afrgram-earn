import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight, ShieldCheck, Zap, Globe, TrendingUp,
    Play, Star, CheckCircle2, ChevronRight
} from 'lucide-react';

const STATS = [
    { value: '15,000+', label: 'Active Earners' },
    { value: '50M RWF', label: 'Total Paid Out' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Support' },
];

const FEATURES = [
    { icon: Zap, label: 'Instant Payouts', detail: 'MTN & Airtel MoMo integration — withdraw in seconds.', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { icon: ShieldCheck, label: 'Fully Verified', detail: 'Bank-grade security with end-to-end encryption.', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { icon: Globe, label: 'Global Tasks', detail: 'Hundreds of digital tasks available around the clock.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: TrendingUp, label: 'Top Commissions', detail: 'Highest earning rates in the region. Tier rewards.', color: 'text-purple-500', bg: 'bg-purple-500/10' },
];

const HOW_IT_WORKS = [
    { step: '01', title: 'Create Account', desc: 'Sign up in 30 seconds. No fees, no credit card needed.' },
    { step: '02', title: 'Complete Tasks', desc: 'Like posts, verify emails, share content. Each task pays.' },
    { step: '03', title: 'Earn Real Money', desc: 'Withdraw directly to MTN/Airtel MoMo instantly.' },
];

const TESTIMONIALS = [
    { name: 'Claudine M.', handle: '@claudine_rw', text: 'I earned 120,000 RWF in my first month doing simple tasks!', stars: 5, avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&q=80' },
    { name: 'Jean Pierre', handle: '@jp_kigali', text: 'Withdrawals hit my MoMo in seconds. This is the real deal.', stars: 5, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&q=80' },
    { name: 'Aline K.', handle: '@aline.codes', text: 'AFGgram helped me pay my university fees. Highly recommend!', stars: 5, avatar: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=80&q=80' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stagger: any = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fadeUp: any = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80 } }
};

export function Landing() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background text-white overflow-x-hidden">
            {/* ── Ambient BG ── */}
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-primary/15 blur-[140px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-purple-600/10 blur-[140px] rounded-full" />
                <div className="absolute top-[40%] right-[15%] w-[25%] h-[25%] bg-emerald-600/8 blur-[100px] rounded-full" />
            </div>

            {/* ── Navbar ── */}
            <nav className="relative z-20 flex justify-between items-center px-6 md:px-16 py-6 max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                        <span className="text-white font-black text-lg italic">A</span>
                    </div>
                    <span className="text-2xl font-black tracking-tighter">AFGgram</span>
                    <span className="hidden sm:block ml-1 text-[9px] bg-emerald-500/20 text-emerald-400 font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-500/20">Live</span>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                    <button onClick={() => navigate('/login')} className="text-white/70 font-bold hover:text-white transition-colors text-sm px-4">
                        Log In
                    </button>
                    <button onClick={() => navigate('/register')} className="btn-premium px-6 py-2.5 text-sm font-black flex items-center gap-2 group">
                        Get Started <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </motion.div>
            </nav>

            {/* ── Hero ── */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-16 pt-16 pb-24 text-center">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                    className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-xs font-black text-primary uppercase tracking-widest">15,000+ Rwandans earning today</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, type: 'spring', stiffness: 70 }}
                    className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight leading-[0.9] mb-6"
                >
                    Earn Real Money<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-purple-500 italic">
                        Doing Simple Tasks.
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="text-lg md:text-xl text-white/50 font-medium max-w-2xl mx-auto leading-relaxed mb-10"
                >
                    AFGgram pays you to like posts, verify accounts and complete micro-tasks.
                    Withdraw directly to <span className="text-white font-bold">MTN or Airtel MoMo</span> — instantly.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
                >
                    <button
                        onClick={() => navigate('/register')}
                        className="btn-premium px-10 py-5 text-lg font-black flex items-center justify-center gap-3 group shadow-[0_0_40px_rgba(59,130,246,0.3)]"
                    >
                        Start Earning Free <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-10 py-5 rounded-2xl transition-all backdrop-blur-md flex items-center justify-center gap-2"
                    >
                        <Play size={18} className="fill-white" /> See How It Works
                    </button>
                </motion.div>

                {/* Stats Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
                >
                    {STATS.map((s, i) => (
                        <div key={i} className="glass-card p-5 rounded-2xl text-center border border-white/5">
                            <p className="text-2xl font-black text-white">{s.value}</p>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">{s.label}</p>
                        </div>
                    ))}
                </motion.div>
            </section>

            {/* ── How It Works ── */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-16 py-20">
                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}
                    variants={stagger}
                    className="text-center mb-14"
                >
                    <motion.p variants={fadeUp} className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-3">How It Works</motion.p>
                    <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black tracking-tight">
                        Earn in 3 Simple Steps
                    </motion.h2>
                </motion.div>

                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
                    variants={stagger}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    {HOW_IT_WORKS.map((step, i) => (
                        <motion.div key={i} variants={fadeUp} className="glass-card p-8 rounded-[2rem] relative group hover:border-primary/30 transition-colors border border-white/5">
                            <div className="text-6xl font-black text-primary/10 mb-4 group-hover:text-primary/20 transition-colors">{step.step}</div>
                            <h3 className="text-xl font-black text-white mb-3">{step.title}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                            {i < 2 && (
                                <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-primary/30 z-10" size={24} />
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* ── Features ── */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-16 py-20">
                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                    variants={stagger}
                    className="text-center mb-14"
                >
                    <motion.p variants={fadeUp} className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-3">Why AFGgram</motion.p>
                    <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black tracking-tight">
                        Built to Make You Money
                    </motion.h2>
                </motion.div>

                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                    variants={stagger}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                >
                    {FEATURES.map((f, i) => (
                        <motion.div key={i} variants={fadeUp} className="glass-card p-8 rounded-[2rem] flex gap-5 group hover:border-white/10 transition-all border border-white/5">
                            <div className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                <f.icon size={26} className={f.color} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white mb-2">{f.label}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{f.detail}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* ── Earnings Showcase ── */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-16 py-20">
                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                    variants={stagger}
                    className="glass-card rounded-[3rem] p-10 md:p-16 border border-primary/20 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-emerald-500" />
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 blur-[80px] rounded-full" />

                    <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
                        <div className="flex-1 space-y-6">
                            <motion.p variants={fadeUp} className="text-xs font-black text-primary uppercase tracking-[0.3em]">Real Earnings</motion.p>
                            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                                Top earners make<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">200,000 RWF/month</span>
                            </motion.h2>
                            <motion.p variants={fadeUp} className="text-muted-foreground leading-relaxed">
                                Complete daily tasks, build your referral network, and unlock higher-paying Tier-2 and Tier-3 opportunities.
                            </motion.p>
                            <motion.ul variants={stagger} className="space-y-3">
                                {['No upfront investment required', 'Withdraw any time, any amount', 'Referral bonuses for every friend you invite'].map((item, i) => (
                                    <motion.li key={i} variants={fadeUp} className="flex items-center gap-3 text-sm text-white/80">
                                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                        {item}
                                    </motion.li>
                                ))}
                            </motion.ul>
                            <motion.button
                                variants={fadeUp}
                                onClick={() => navigate('/register')}
                                className="btn-premium px-8 py-4 font-black flex items-center gap-2 group mt-4"
                            >
                                Start Earning Now <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </motion.button>
                        </div>

                        {/* Mock earnings widget */}
                        <div className="w-full md:w-80 shrink-0">
                            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">My Wallet</span>
                                    <span className="text-xs text-emerald-500 font-black bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">+12% this week</span>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-bold mb-1">Available Balance</p>
                                    <p className="text-4xl font-black text-white">85,400 <span className="text-sm text-muted-foreground font-bold">RWF</span></p>
                                </div>
                                <div className="space-y-2.5">
                                    {[
                                        { task: 'Email Verification', amount: '+2,500', time: '2m ago' },
                                        { task: 'Social Share', amount: '+800', time: '15m ago' },
                                        { task: 'Daily Login Bonus', amount: '+500', time: '1h ago' },
                                        { task: 'Referral Bonus', amount: '+5,000', time: '2h ago' },
                                    ].map((tx, i) => (
                                        <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                            <div>
                                                <p className="text-xs font-bold text-white">{tx.task}</p>
                                                <p className="text-[10px] text-muted-foreground">{tx.time}</p>
                                            </div>
                                            <span className="text-sm font-black text-emerald-500">{tx.amount} RWF</span>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full py-3 bg-primary rounded-2xl text-white font-black text-sm hover:bg-primary/90 transition-colors">
                                    Withdraw to MoMo
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ── Testimonials ── */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-16 py-20">
                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                    variants={stagger}
                    className="text-center mb-14"
                >
                    <motion.p variants={fadeUp} className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-3">Testimonials</motion.p>
                    <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black tracking-tight">
                        Real People, Real Earnings
                    </motion.h2>
                </motion.div>

                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                    variants={stagger}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    {TESTIMONIALS.map((t, i) => (
                        <motion.div key={i} variants={fadeUp} className="glass-card p-8 rounded-[2rem] border border-white/5 flex flex-col gap-4">
                            <div className="flex gap-1">
                                {Array(t.stars).fill(0).map((_, j) => (
                                    <Star key={j} size={14} className="text-amber-500 fill-amber-500" />
                                ))}
                            </div>
                            <p className="text-white/80 text-sm leading-relaxed italic">"{t.text}"</p>
                            <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/5">
                                <img src={t.avatar} className="w-10 h-10 rounded-full object-cover border-2 border-primary/30" />
                                <div>
                                    <p className="font-bold text-white text-sm">{t.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{t.handle}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* ── CTA Banner ── */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-16 py-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="text-center space-y-8"
                >
                    <div className="flex justify-center gap-1 mb-2">
                        {Array(5).fill(0).map((_, i) => <Star key={i} size={18} className="text-amber-500 fill-amber-500" />)}
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tight">
                        Ready to Start Earning?
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                        Join 15,000+ Rwandans who are already earning with AFGgram. Create your free account in 30 seconds.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate('/register')}
                            className="btn-premium px-12 py-5 text-xl font-black flex items-center justify-center gap-3 group shadow-[0_0_60px_rgba(59,130,246,0.25)]"
                        >
                            Create Free Account <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground/60 font-bold">
                        <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" />No fees</div>
                        <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" />No credit card</div>
                        <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" />Instant payouts</div>
                    </div>
                </motion.div>
            </section>

            {/* ── Footer ── */}
            <footer className="relative z-10 border-t border-white/5 py-10 px-6 md:px-16 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-white font-black text-sm italic">A</span>
                        </div>
                        <span className="font-black text-white tracking-tighter">AFGgram</span>
                    </div>
                    <div className="flex gap-8 text-sm text-muted-foreground font-medium">
                        <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Log In</button>
                        <button onClick={() => navigate('/register')} className="hover:text-white transition-colors">Register</button>
                    </div>
                    <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.3em]">
                        © 2025 Rugwe Media Group
                    </p>
                </div>
            </footer>
        </div>
    );
}
