import React from 'react';
import {
    Film, Settings, DollarSign, LogOut,
    Layout as LayoutIcon, Wallet, ShieldAlert, Bell
} from 'lucide-react';

import { NavLink } from 'react-router-dom';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { supabase } from '../lib/supabase';
import { Home, Users, CheckSquare, MessageSquare } from 'lucide-react';

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const { user, signOut } = useAuth();
    const { tasks, submissions } = useTasks();
    const isAdmin = user?.email === 'sharibaru0@gmail.com';

    const [unreadCount, setUnreadCount] = React.useState(0);

    // Count tasks that are still available (user hasn't submitted or was rejected)
    const activeTasks = tasks.filter(task => {
        const sub = submissions.find(s => s.taskId === task.id && s.userId === user?.id);
        // Available if no submission, or submission was rejected (can re-do)
        return !sub || sub.status === 'rejected';
    });
    const activeTaskCount = activeTasks.length;

    React.useEffect(() => {
        if (user) {
            fetchUnreadCount();

            const channel = supabase
                .channel('unread_total')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                }, () => {
                    fetchUnreadCount();
                })
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }
    }, [user]);

    const fetchUnreadCount = async () => {
        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user?.id)
            .eq('is_read', false);
        setUnreadCount(count || 0);
    };

    const navItems = [
        { icon: LayoutIcon, label: 'Dashboard', path: '/dashboard' },
        { icon: Home, label: 'Feed', path: '/feed' },
        { icon: Users, label: 'Friends', path: '/friends' },
        { icon: CheckSquare, label: 'Tasks', path: '/tasks', badge: activeTaskCount },
        { icon: Bell, label: 'Alerts', path: '/alerts', badge: unreadCount },
        { icon: MessageSquare, label: 'Messages', path: '/messages' },
        { icon: Film, label: 'Reels', path: '/reels' },
    ];

    const secondaryNav = [
        { icon: LayoutIcon, label: 'Pages', path: '/pages' },
        { icon: DollarSign, label: 'Monetize', path: '/monetize' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <div className="flex min-h-screen bg-background text-foreground bg-[radial-gradient(circle_at_top_right,_#3b82f6_0%,_transparent_15%)]">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex flex-col w-64 glass border-r sticky top-0 h-screen p-6 overflow-y-auto">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                        <span className="font-black text-xl text-white">A</span>
                    </div>
                    <h1 className="text-2xl font-black tracking-tighter text-white">AFGgram</h1>
                </div>

                <nav className="flex-1 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group hover:bg-white/[0.05]",
                                isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-white"
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

                    <div className="py-4 opacity-50">
                        <div className="h-px bg-white/10" />
                    </div>

                    {isAdmin && (
                        <NavLink
                            to="/admin"
                            className={({ isActive }) => cn(
                                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group hover:bg-white/[0.05] border border-primary/20 bg-primary/5 mb-4",
                                isActive ? "text-primary bg-primary/20" : "text-primary/70 hover:text-primary"
                            )}
                        >
                            <ShieldAlert size={20} className="group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-sm">Admin Control</span>
                        </NavLink>
                    )}

                    {secondaryNav.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group hover:bg-white/[0.05]",
                                isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            <item.icon size={20} className="group-hover:scale-110 transition-transform" />
                            <span className="font-medium text-sm">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-all duration-300 mt-8"
                >
                    <LogOut size={20} />
                    <span className="font-semibold">Logout</span>
                </button>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="sticky top-0 z-40 md:hidden glass border-b p-4 flex justify-between items-center">
                    <h1 className="text-xl font-black tracking-tighter text-white">AFGgram</h1>
                    <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                        <Wallet size={16} className="text-amber-500" />
                        <span className="text-sm font-bold text-amber-500">1,250 RWF</span>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full pb-32 md:pb-8">
                    {children}
                </main>

                {/* Bottom Navigation - Mobile */}
                <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] glass border px-6 py-4 rounded-[2rem] flex justify-between items-center z-50">
                    {[...navItems.slice(0, 4), isAdmin ? { icon: ShieldAlert, path: '/admin', badge: undefined } : navItems[4]].map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "p-2 rounded-2xl transition-all duration-300 relative",
                                isActive ? "bg-primary text-white scale-110 shadow-lg" : "text-muted-foreground"
                            )}
                        >
                            <item.icon size={24} />
                            {item.badge != null && item.badge > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-background shadow">
                                    {item.badge}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>
            </div>
        </div>
    );
}
