import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';


interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: any | null;
    balance: number;
    loading: boolean;
    signOut: () => Promise<void>;
    require2FA: boolean;
    setRequire2FA: (val: boolean) => void;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [require2FA, setRequire2FA] = useState(false);

    const refreshProfile = async () => {
        if (!user) {
            setProfile(null);
            setBalance(0);
            return;
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (data && !error) {
            setProfile(data);
            setBalance(Number(data.balance) || 0);
        }
    };

    useEffect(() => {
        if (user) {
            refreshProfile();

            // Subscribe to profile changes
            const channel = supabase
                .channel(`profile:${user.id}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`
                }, (payload: any) => {
                    setProfile(payload.new);
                    setBalance(Number(payload.new.balance) || 0);
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user?.id]);

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
        <AuthContext.Provider value={{ user, session, profile, balance, loading, signOut, require2FA, setRequire2FA, refreshProfile }}>
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
