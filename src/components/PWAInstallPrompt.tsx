import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Sparkles, ArrowRight } from 'lucide-react';

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Show prompt after 5 seconds of browsing
            const timer = setTimeout(() => {
                if (!isDismissed) setIsVisible(true);
            }, 5000);
            return () => clearTimeout(timer);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, [isDismissed]);

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
        setIsDismissed(true);
        // Save dismissal to local storage to not show again for 24h
        localStorage.setItem('pwa_dismissed', new Date().getTime().toString());
    };

    // Check if dismissed recently
    useEffect(() => {
        const dismissedAt = localStorage.getItem('pwa_dismissed');
        if (dismissedAt) {
            const twentyFourHours = 24 * 60 * 60 * 1000;
            if (new Date().getTime() - parseInt(dismissedAt) < twentyFourHours) {
                setIsDismissed(true);
            }
        }
    }, []);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleDismiss}
                    className="absolute inset-0"
                />

                <motion.div
                    initial={{ y: 100, scale: 0.9, opacity: 0 }}
                    animate={{ y: 0, scale: 1, opacity: 1 }}
                    exit={{ y: 100, scale: 0.9, opacity: 0 }}
                    className="glass-card max-w-sm w-full p-8 rounded-[2.5rem] relative z-10 overflow-hidden shadow-2xl border-primary/20"
                >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-primary animate-pulse" />

                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X size={18} className="text-muted-foreground" />
                    </button>

                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="relative">
                            <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center text-primary relative z-10">
                                <Smartphone size={40} strokeWidth={2.5} />
                            </div>
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute -inset-4 bg-primary/10 blur-2xl rounded-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-white italic tracking-tight">App Experience</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Install <span className="text-white font-bold tracking-tighter">AFGgram</span> for faster access, instant alerts, and smooth digital earnings.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full">
                            {[
                                { icon: Sparkles, text: 'Smooth UI' },
                                { icon: Download, text: 'No Updates' }
                            ].map((feat, i) => (
                                <div key={i} className="bg-white/5 p-3 rounded-2xl flex items-center gap-2 border border-white/10">
                                    <feat.icon size={14} className="text-primary" />
                                    <span className="text-[10px] font-black uppercase text-white tracking-widest">{feat.text}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleInstall}
                            className="btn-premium w-full py-5 text-lg font-black flex items-center justify-center gap-3 group"
                        >
                            Download Our App <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {/* Background glow */}
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
