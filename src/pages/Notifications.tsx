import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Info, CheckCircle2, XCircle, Trash2, Loader2, UserPlus, Wallet } from 'lucide-react';
import { cn } from '../utils/cn';

interface Notification {
    id: string;
    type: string;
    message: string;
    metadata: any;
    is_read: boolean;
    created_at: string;
}

export function Notifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchNotifications();

            // Subscribe to new notifications
            const channel = supabase
                .channel('notifications_realtime')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                }, (payload) => {
                    setNotifications(prev => [payload.new as Notification, ...prev]);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    };

    const getIcon = (type: string, status?: string) => {
        if (type === 'verification_alert') {
            return status === 'approved' ? <CheckCircle2 className="text-emerald-500" /> : <XCircle className="text-red-500" />;
        }
        if (type === 'follow_alert') {
            return <UserPlus className="text-blue-500" />;
        }
        if (type === 'withdrawal_alert') {
            return <Wallet className="text-amber-500" />;
        }
        return <Info className="text-primary" />;
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-muted-foreground mt-4 font-bold uppercase tracking-widest text-xs">Loading Alerts...</p>
        </div>
    );

    return (
        <div className="max-w-xl mx-auto pb-20">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Bell className="text-primary" /> Alerts
                    </h2>
                    <p className="text-muted-foreground font-medium mt-1">Stay updated with your account activity.</p>
                </div>
                {notifications.some(n => !n.is_read) && (
                    <button
                        onClick={() => {
                            notifications.filter(n => !n.is_read).forEach(n => markAsRead(n.id));
                        }}
                        className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                    >
                        Mark all as read
                    </button>
                )}
            </header>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="glass-card p-12 rounded-[2.5rem] text-center space-y-4">
                        <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-muted-foreground/20 mx-auto">
                            <Bell size={32} />
                        </div>
                        <p className="text-muted-foreground font-bold">No notifications yet.</p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {notifications.map((n) => (
                            <motion.div
                                key={n.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={cn(
                                    "glass-card p-6 rounded-[2rem] border-l-4 transition-all group",
                                    n.is_read ? "border-transparent opacity-60" : "border-primary shadow-[0_0_20px_rgba(59,130,246,0.1)]",
                                    n.type === 'verification_alert' && n.metadata?.status === 'rejected' && "border-red-500",
                                    n.type === 'verification_alert' && n.metadata?.status === 'approved' && "border-emerald-500",
                                    n.type === 'follow_alert' && "border-blue-500",
                                    n.type === 'withdrawal_alert' && "border-amber-500"
                                )}
                                onClick={() => !n.is_read && markAsRead(n.id)}
                            >
                                <div className="flex gap-4">
                                    <div className="mt-1 shrink-0">
                                        {getIcon(n.type, n.metadata?.status)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className={cn(
                                                "text-sm leading-relaxed",
                                                n.is_read ? "text-white/60" : "text-white font-bold"
                                            )}>
                                                {n.message}
                                            </p>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                                            {new Date(n.created_at).toLocaleTimeString()} • {new Date(n.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
