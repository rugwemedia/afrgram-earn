import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';


interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
    require2FA: boolean;
    setRequire2FA: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [require2FA, setRequire2FA] = useState(false);

    useEffect(() => {
        // Get initial session
        console.log('Auth: Fetching initial session...');
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('Auth: Session retrieved:', session?.user?.email ?? 'No user');
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        }).catch(err => {
            console.error('Auth: Session error:', err);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth: State change event:', event, session?.user?.email ?? 'No user');
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Presence Heartbeat
        let heartbeat: any;
        if (user) {
            const updatePresence = async () => {
                await supabase
                    .from('profiles')
                    .update({ last_seen_at: new Date().toISOString() })
                    .eq('id', user.id);
            };

            updatePresence(); // Immediate update
            heartbeat = setInterval(updatePresence, 120000); // Every 2 minutes
        }

        return () => {
            subscription.unsubscribe();
            if (heartbeat) clearInterval(heartbeat);
        };
    }, [user?.id]);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signOut, require2FA, setRequire2FA }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
