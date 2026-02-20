import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageCircleQuestion, X, Send, Loader2, CheckCircle2,
    Clock, Headphones, ArrowLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type Screen = 'home' | 'new_ticket' | 'my_tickets' | 'ticket_detail';

interface Ticket {
    id: string;
    subject: string;
    message: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    created_at: string;
    admin_reply?: string;
    replied_at?: string;
    guest_name?: string;
    guest_email?: string;
}

const STATUS_COLOR: Record<string, string> = {
    open: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    closed: 'bg-white/5 text-muted-foreground border-white/10',
};

const SUBJECTS = [
    'Account Issue',
    'Withdrawal Problem',
    'Task Not Credited',
    'Verification Help',
    'Bug Report',
    'Other',
];

export function SupportWidget() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [screen, setScreen] = useState<Screen>('home');
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [unread, setUnread] = useState(0);

    // Form state
    const [subject, setSubject] = useState(SUBJECTS[0]);
    const [message, setMessage] = useState('');
    // Guest fields
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [guestWhatsapp, setGuestWhatsapp] = useState('');
    const [guestHandle, setGuestHandle] = useState('');

    const widgetRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (open && widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Fetch user tickets + count unread replies
    useEffect(() => {
        if (user && open) fetchMyTickets();
    }, [user, open]);

    const fetchMyTickets = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setTickets((data as Ticket[]) || []);
            const unreadCount = ((data as Ticket[]) || []).filter(
                t => t.admin_reply && t.status !== 'closed'
            ).length;
            setUnread(unreadCount);
        } catch (err: any) {
            console.error('Error fetching support tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!message.trim() || !subject) return;
        if (!user && !guestEmail.trim() && !guestPhone.trim() && !guestHandle.trim()) {
            alert('Please provide at least one contact detail (email, phone, or AFGgram handle).');
            return;
        }

        setSubmitting(true);
        try {
            const payload: any = {
                subject,
                message: message.trim(),
                status: 'open',
            };
            if (user) {
                payload.user_id = user.id;
            } else {
                payload.guest_name = guestName.trim() || null;
                payload.guest_email = guestEmail.trim() || null;
                payload.guest_phone = guestPhone.trim() || null;
                payload.guest_whatsapp = guestWhatsapp.trim() || null;
                payload.guest_handle = guestHandle.trim() || null;
            }

            const { error } = await supabase.from('support_tickets').insert(payload);
            if (error) throw error;

            setSubmitted(true);
            setMessage('');
            setGuestName(''); setGuestEmail(''); setGuestPhone('');
            setGuestWhatsapp(''); setGuestHandle('');
            if (user) fetchMyTickets();
        } catch (err: any) {
            alert('Failed to submit: ' + (err.message || 'Unknown error'));
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setSubmitted(false);
        setSubject(SUBJECTS[0]);
        setMessage('');
        setScreen('home');
    };

    return (
        <div ref={widgetRef} className="fixed bottom-6 right-6 z-[200] flex flex-col items-end gap-3">

            {/* ── Widget Panel ── */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 250 }}
                        className="w-[360px] max-h-[80vh] bg-[#0d0d0d] border border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-5 bg-gradient-to-br from-primary/20 to-purple-600/10 border-b border-white/5 shrink-0">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    {screen !== 'home' && (
                                        <button
                                            onClick={() => { setScreen('home'); setSubmitted(false); }}
                                            className="p-1.5 bg-white/5 rounded-full text-muted-foreground hover:text-white transition-colors"
                                        >
                                            <ArrowLeft size={16} />
                                        </button>
                                    )}
                                    <div>
                                        <h3 className="text-white font-black text-base flex items-center gap-2">
                                            <Headphones size={18} className="text-primary" />
                                            Support Center
                                        </h3>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">We reply within 72 hours</p>
                                    </div>
                                </div>
                                <button onClick={() => setOpen(false)} className="p-1.5 bg-white/5 rounded-full text-muted-foreground hover:text-white">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <AnimatePresence mode="wait">
                                {/* ─── HOME ─── */}
                                {screen === 'home' && (
                                    <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-3">
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Hi{user ? ` 👋` : '!'} How can we help you today?
                                        </p>

                                        <button
                                            onClick={() => { setScreen('new_ticket'); setSubmitted(false); }}
                                            className="w-full flex items-center gap-4 p-4 bg-primary/10 border border-primary/20 rounded-2xl hover:bg-primary/15 transition-all text-left group"
                                        >
                                            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                <MessageCircleQuestion size={20} className="text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold text-sm">Send a Message</p>
                                                <p className="text-[11px] text-muted-foreground">Get help from our team</p>
                                            </div>
                                        </button>

                                        {user && (
                                            <button
                                                onClick={() => { setScreen('my_tickets'); fetchMyTickets(); }}
                                                className="w-full flex items-center gap-4 p-4 bg-white/[0.04] border border-white/10 rounded-2xl hover:bg-white/[0.07] transition-all text-left group"
                                            >
                                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform relative">
                                                    <Clock size={20} className="text-muted-foreground" />
                                                    {unread > 0 && (
                                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-black flex items-center justify-center">
                                                            {unread}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-sm">My Tickets</p>
                                                    <p className="text-[11px] text-muted-foreground">View previous conversations</p>
                                                </div>
                                            </button>
                                        )}

                                        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-center">
                                            <p className="text-[10px] text-muted-foreground/60 uppercase font-black tracking-widest mb-1">Response Time</p>
                                            <p className="text-2xl font-black text-white">72 hrs</p>
                                            <p className="text-[11px] text-muted-foreground">Usually much faster ⚡</p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ─── NEW TICKET ─── */}
                                {screen === 'new_ticket' && !submitted && (
                                    <motion.div key="new" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-5 space-y-4">
                                        {/* Subject */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Subject</label>
                                            <select
                                                value={subject}
                                                onChange={e => setSubject(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                            >
                                                {SUBJECTS.map(s => <option key={s} value={s} className="bg-[#1a1a1a]">{s}</option>)}
                                            </select>
                                        </div>

                                        {/* Message */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Your Message</label>
                                            <textarea
                                                value={message}
                                                onChange={e => setMessage(e.target.value)}
                                                rows={4}
                                                placeholder="Describe your issue in detail…"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none resize-none placeholder:text-muted-foreground/40"
                                            />
                                        </div>

                                        {/* Guest contact details (not logged in) */}
                                        {!user && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-px flex-1 bg-white/5" />
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Your Contact Details</p>
                                                    <div className="h-px flex-1 bg-white/5" />
                                                </div>
                                                <p className="text-[11px] text-muted-foreground/70 text-center">
                                                    Fill at least one so we can reach you.
                                                </p>
                                                {[
                                                    { label: 'Full Name', value: guestName, set: setGuestName, placeholder: 'John Doe', required: false },
                                                    { label: 'Email Address', value: guestEmail, set: setGuestEmail, placeholder: 'name@example.com', required: false },
                                                    { label: 'Phone Number', value: guestPhone, set: setGuestPhone, placeholder: '+250 7XX XXX XXX', required: false },
                                                    { label: 'WhatsApp Number', value: guestWhatsapp, set: setGuestWhatsapp, placeholder: '+250 7XX XXX XXX', required: false },
                                                    { label: 'AFGgram Handle', value: guestHandle, set: setGuestHandle, placeholder: '@yourhandle', required: false },
                                                ].map(({ label, value, set, placeholder }) => (
                                                    <div key={label} className="space-y-1">
                                                        <label className="text-[10px] font-bold text-muted-foreground ml-1">{label}</label>
                                                        <input
                                                            type="text"
                                                            value={value}
                                                            onChange={e => set(e.target.value)}
                                                            placeholder={placeholder}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none placeholder:text-muted-foreground/30"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <button
                                            onClick={handleSubmit}
                                            disabled={submitting || !message.trim()}
                                            className="btn-premium w-full py-3 font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                                        >
                                            {submitting ? (
                                                <><Loader2 size={16} className="animate-spin" /> Sending…</>
                                            ) : (
                                                <><Send size={16} /> Send Message</>
                                            )}
                                        </button>
                                        <p className="text-[10px] text-center text-muted-foreground/50">
                                            We'll respond within 72 hours ⚡
                                        </p>
                                    </motion.div>
                                )}

                                {/* ─── SUCCESS ─── */}
                                {screen === 'new_ticket' && submitted && (
                                    <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-8 flex flex-col items-center text-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                            <CheckCircle2 size={36} className="text-emerald-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-black text-lg">Message Sent!</h4>
                                            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                                Our support team will get back to you within <strong className="text-white">72 hours</strong>.
                                            </p>
                                        </div>
                                        <button onClick={resetForm} className="btn-premium px-6 py-3 text-sm font-black">
                                            Done
                                        </button>
                                    </motion.div>
                                )}

                                {/* ─── MY TICKETS ─── */}
                                {screen === 'my_tickets' && (
                                    <motion.div key="tickets" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4 space-y-3">
                                        {loading ? (
                                            <div className="flex justify-center py-10">
                                                <Loader2 size={28} className="animate-spin text-primary" />
                                            </div>
                                        ) : tickets.length === 0 ? (
                                            <div className="text-center py-10">
                                                <p className="text-muted-foreground text-sm">No tickets yet.</p>
                                                <button onClick={() => setScreen('new_ticket')} className="mt-3 text-primary font-bold text-sm hover:underline">
                                                    Send your first message →
                                                </button>
                                            </div>
                                        ) : (
                                            tickets.map(ticket => (
                                                <button
                                                    key={ticket.id}
                                                    onClick={() => { setActiveTicket(ticket); setScreen('ticket_detail'); }}
                                                    className="w-full text-left p-4 bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 rounded-2xl transition-all space-y-2"
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className="text-sm font-bold text-white truncate">{ticket.subject}</p>
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border capitalize shrink-0 ${STATUS_COLOR[ticket.status]}`}>
                                                            {ticket.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground line-clamp-2">{ticket.message}</p>
                                                    {ticket.admin_reply && (
                                                        <p className="text-[11px] text-emerald-500 font-bold">✓ Admin replied</p>
                                                    )}
                                                    <p className="text-[10px] text-muted-foreground/50">{new Date(ticket.created_at).toLocaleDateString()}</p>
                                                </button>
                                            ))
                                        )}
                                    </motion.div>
                                )}

                                {/* ─── TICKET DETAIL ─── */}
                                {screen === 'ticket_detail' && activeTicket && (
                                    <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{activeTicket.subject}</p>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border capitalize ${STATUS_COLOR[activeTicket.status]}`}>
                                                {activeTicket.status.replace('_', ' ')}
                                            </span>
                                        </div>

                                        {/* Your message */}
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">You wrote:</p>
                                            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
                                                <p className="text-sm text-white/80 leading-relaxed">{activeTicket.message}</p>
                                                <p className="text-[10px] text-muted-foreground mt-2">{new Date(activeTicket.created_at).toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {/* Admin reply */}
                                        {activeTicket.admin_reply ? (
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Support replied:</p>
                                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                                                    <p className="text-sm text-white/90 leading-relaxed">{activeTicket.admin_reply}</p>
                                                    {activeTicket.replied_at && (
                                                        <p className="text-[10px] text-emerald-600 mt-2">{new Date(activeTicket.replied_at).toLocaleString()}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
                                                <Clock size={20} className="text-amber-500 mx-auto mb-1" />
                                                <p className="text-xs text-amber-400 font-bold">Awaiting reply</p>
                                                <p className="text-[10px] text-muted-foreground mt-1">Within 72 hours</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── FAB Button ── */}
            <motion.button
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpen(v => !v)}
                className="relative w-14 h-14 bg-primary rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.5)] flex items-center justify-center text-white"
            >
                <AnimatePresence mode="wait">
                    {open ? (
                        <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                            <X size={24} />
                        </motion.div>
                    ) : (
                        <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                            <Headphones size={24} />
                        </motion.div>
                    )}
                </AnimatePresence>
                {unread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white font-black flex items-center justify-center border-2 border-background">
                        {unread}
                    </span>
                )}
            </motion.button>
        </div>
    );
}
