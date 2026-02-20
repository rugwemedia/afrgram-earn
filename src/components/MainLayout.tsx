import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Film, Settings, DollarSign, LogOut, Radio,
    Layout as LayoutIcon, Wallet, ShieldAlert, Bell, X, MoreHorizontal, Home, Users, CheckSquare, MessageSquare, Download, Smartphone, ArrowRight, Sparkles
} from 'lucide-react';

import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { supabase } from '../lib/supabase';

interface MainLayoutProps {
    children: React.ReactNode;
}

// ─── PWA Install Prompt ─────────────────────────────────────────────────────
function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const dismissed = localStorage.getItem('pwa_dismissed');
        if (dismissed) {
            const elapsed = Date.now() - parseInt(dismissed);
            if (elapsed < 24 * 60 * 60 * 1000) return; // suppressed for 24h
        }

        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setTimeout(() => setIsVisible(true), 6000);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsVisible(false);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('pwa_dismissed', Date.now().toString());
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDismiss}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ y: 80, scale: 0.92, opacity: 0 }}
                        animate={{ y: 0, scale: 1, opacity: 1 }}
                        exit={{ y: 80, scale: 0.92, opacity: 0 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 180 }}
                        className="glass-card max-w-sm w-full p-8 rounded-[2.5rem] relative z-10 overflow-hidden shadow-2xl border border-primary/20"
                    >
                        {/* Top gradient bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-primary" />

                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="relative">
                                <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center text-primary relative z-10">
                                    <Smartphone size={40} strokeWidth={2} />
                                </div>
                                <motion.div
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
                                    transition={{ repeat: Infinity, duration: 2.5 }}
                                    className="absolute -inset-4 bg-primary/10 blur-2xl rounded-full pointer-events-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white italic tracking-tight">Download AFGgram</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Install our app for instant alerts, faster access, and seamless digital earnings.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full">
                                {[
                                    { icon: Sparkles, text: 'Faster App' },
                                    { icon: Download, text: 'Install Once' },
                                ].map((feat, i) => (
                                    <div key={i} className="bg-white/5 p-3 rounded-2xl flex items-center gap-2 border border-white/10">
                                        <feat.icon size={14} className="text-primary" />
                                        <span className="text-[10px] font-black uppercase text-white tracking-widest">{feat.text}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleInstall}
                                className="btn-premium w-full py-4 font-black flex items-center justify-center gap-3 group text-base"
                            >
                                Install App <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button onClick={handleDismiss} className="text-xs text-muted-foreground hover:text-white transition-colors">
                                Maybe later
                            </button>
                        </div>
                        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// ─── Main Layout ─────────────────────────────────────────────────────────────
export function MainLayout({ children }: MainLayoutProps) {
    const { user, signOut, balance } = useAuth();
    const { tasks, submissions } = useTasks();
    const navigate = useNavigate();
    const isAdmin = user?.email === 'sharibaru0@gmail.com';

    const [unreadCount, setUnreadCount] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const activeTasks = tasks.filter(task => {
        const sub = submissions.find(s => s.taskId === task.id && s.userId === user?.id);
        return !sub || sub.status === 'rejected';
    });
    const activeTaskCount = activeTasks.length;

    useEffect(() => {
        if (!user) return;
        fetchUnreadCount();
        const channel = supabase
            .channel('unread_total')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, () => fetchUnreadCount())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user]);

    const fetchUnreadCount = async () => {
        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user?.id)
            .eq('is_read', false);
        setUnreadCount(count || 0);
    };

    // All nav items
    const navItems = [
        { icon: LayoutIcon, label: 'Dashboard', path: '/dashboard' },
        { icon: Home, label: 'Feed', path: '/feed' },
        { icon: Radio, label: 'Live', path: '/live' },
        { icon: Users, label: 'Friends', path: '/friends' },
        { icon: CheckSquare, label: 'Tasks', path: '/tasks', badge: activeTaskCount },
        { icon: Bell, label: 'Alerts', path: '/alerts', badge: unreadCount },
        { icon: MessageSquare, label: 'Messages', path: '/messages' },
        { icon: Film, label: 'Reels', path: '/reels' },
    ];

    const secondaryNav = [
        { icon: Settings, label: 'Settings', path: '/settings' },
        { icon: DollarSign, label: 'Monetize', path: '/monetize' },
    ];

    // Bottom bar shows exactly 4 primary + "More" button
    const bottomPrimary = navItems.slice(0, 4);

    return (
        <div className="flex min-h-screen bg-background text-foreground bg-[radial-gradient(circle_at_top_right,_#3b82f6_0%,_transparent_15%)]">
            {/* PWA Install Popup */}
            <PWAInstallPrompt />

            {/* ── Mobile Slide-out Menu ───────────────────────────────── */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
                        />
                        <motion.aside
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                            className="fixed top-0 right-0 bottom-0 w-[78%] max-w-[300px] glass border-l border-white/10 z-[101] p-6 flex flex-col md:hidden"
                        >
                            {/* Drawer header */}
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-lg font-black text-white italic">AFGgram</h2>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <Wallet size={12} className="text-amber-500" />
                                        <span className="text-xs font-black text-amber-500">{balance.toLocaleString()} RWF</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                                >
                                    <X size={20} className="text-white" />
                                </button>
                            </div>

                            {/* All nav items in drawer */}
                            <nav className="flex-1 space-y-1 overflow-y-auto">
                                {navItems.map(item => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={({ isActive }) => cn(
                                            'flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all relative',
                                            isActive
                                                ? 'text-primary bg-primary/10'
                                                : 'text-muted-foreground hover:text-white hover:bg-white/5'
                                        )}
                                    >
                                        <item.icon size={22} />
                                        <span className="font-bold flex-1">{item.label}</span>
                                        {item.badge != null && item.badge > 0 && (
                                            <span className="min-w-[20px] h-5 px-1.5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center">
                                                {item.badge}
                                            </span>
                                        )}
                                    </NavLink>
                                ))}

                                <div className="h-px bg-white/5 my-3" />

                                {isAdmin && (
                                    <NavLink
                                        to="/admin"
                                        onClick={() => setIsMenuOpen(false)}
                                        className={({ isActive }) => cn(
                                            'flex items-center gap-4 px-4 py-3.5 rounded-2xl border border-primary/20 bg-primary/5 transition-all',
                                            isActive ? 'text-primary' : 'text-primary/70'
                                        )}
                                    >
                                        <ShieldAlert size={20} />
                                        <span className="font-bold">Admin Control</span>
                                    </NavLink>
                                )}

                                {secondaryNav.map(item => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={({ isActive }) => cn(
                                            'flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all',
                                            isActive
                                                ? 'text-primary bg-primary/10'
                                                : 'text-muted-foreground hover:text-white hover:bg-white/5'
                                        )}
                                    >
                                        <item.icon size={20} />
                                        <span className="font-semibold text-sm">{item.label}</span>
                                    </NavLink>
                                ))}
                            </nav>

                            {/* Logout */}
                            <button
                                onClick={() => signOut()}
                                className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-all mt-4"
                            >
                                <LogOut size={20} />
                                <span className="font-bold">Logout</span>
                            </button>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ── Desktop Sidebar ─────────────────────────────────────── */}
            <aside className="hidden md:flex flex-col w-64 glass border-r border-white/10 sticky top-0 h-screen p-6 overflow-y-auto">
                {/* Logo + balance */}
                <div className="flex items-center gap-3 mb-10">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                            <span className="font-black text-xl text-white">A</span>
                        </div>
                        <h1 className="text-2xl font-black tracking-tighter text-white">AFGgram</h1>
                    </div>
                    <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5 cursor-pointer hover:bg-white/10 transition-colors">
                        <Wallet size={13} className="text-amber-500" />
                        <span className="text-xs font-black text-amber-500">{balance.toLocaleString()}</span>
                    </div>
                </div>

                <nav className="flex-1 space-y-1">
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => cn(
                                'flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group hover:bg-white/[0.05]',
                                isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-white'
                            )}
                        >
                            <item.icon size={22} className="group-hover:scale-110 transition-transform" />
                            <span className="font-semibold flex-1">{item.label}</span>
                            {item.badge != null && item.badge > 0 && (
                                <span className="min-w-[20px] h-5 px-1.5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(59,130,246,0.6)]">
                                    {item.badge}
                                </span>
                            )}
                        </NavLink>
                    ))}

                    <div className="py-3 opacity-40"><div className="h-px bg-white/10" /></div>

                    {isAdmin && (
                        <NavLink
                            to="/admin"
                            className={({ isActive }) => cn(
                                'flex items-center gap-4 px-4 py-3 rounded-xl transition-all group border border-primary/20 bg-primary/5 mb-2',
                                isActive ? 'text-primary bg-primary/20' : 'text-primary/70 hover:text-primary'
                            )}
                        >
                            <ShieldAlert size={20} className="group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-sm">Admin Control</span>
                        </NavLink>
                    )}

                    {secondaryNav.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => cn(
                                'flex items-center gap-4 px-4 py-3 rounded-xl transition-all group hover:bg-white/[0.05]',
                                isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-white'
                            )}
                        >
                            <item.icon size={20} className="group-hover:scale-110 transition-transform" />
                            <span className="font-medium text-sm">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-all mt-8"
                >
                    <LogOut size={20} />
                    <span className="font-semibold">Logout</span>
                </button>
            </aside>

            {/* ── Main Content ─────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="sticky top-0 z-40 md:hidden glass border-b border-white/10 px-4 py-3 flex justify-between items-center">
                    <h1 className="text-xl font-black tracking-tighter text-white">AFGgram</h1>
                    <div
                        className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => navigate('/dashboard')}
                    >
                        <Wallet size={15} className="text-amber-500" />
                        <span className="text-sm font-black text-amber-500">{balance.toLocaleString()} <span className="text-xs font-bold opacity-70">RWF</span></span>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full pb-36 md:pb-8">
                    {children}
                </main>

                {/* ── Bottom Navigation - Mobile ────────────────────── */}
                <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] glass border border-white/10 px-2 py-2 rounded-[2rem] flex justify-around items-center z-50 shadow-2xl">
                    {bottomPrimary.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => cn(
                                'flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-200 relative min-w-[48px]',
                                isActive
                                    ? 'text-white'
                                    : 'text-muted-foreground'
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={cn(
                                        'p-2 rounded-2xl transition-all duration-200',
                                        isActive ? 'bg-primary shadow-[0_4px_15px_rgba(59,130,246,0.4)] scale-110' : ''
                                    )}>
                                        <item.icon size={24} />
                                    </div>
                                    <span className={cn(
                                        'text-[9px] font-black uppercase tracking-wide leading-none',
                                        isActive ? 'text-primary' : 'text-muted-foreground/60'
                                    )}>
                                        {item.label}
                                    </span>
                                    {item.badge != null && item.badge > 0 && (
                                        <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-0.5 bg-primary text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-background">
                                            {item.badge}
                                        </span>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}

                    {/* "More" button opens drawer */}
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-200 relative min-w-[48px] text-muted-foreground"
                    >
                        <div className="p-2 rounded-2xl">
                            <MoreHorizontal size={24} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wide leading-none text-muted-foreground/60">
                            More
                        </span>
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-0.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-background">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </nav>
            </div>
        </div>
    );
}
