import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Loader2, Search, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';

interface Profile {
    id: string;
    full_name: string;
    avatar_url: string;
    role: string;
    last_seen_at?: string;
    created_at: string;
    is_verified?: boolean;
    follows_me?: boolean;
}

export function Friends() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'new' | 'suggested'>('all');
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            // 1. Fetch all profiles (excluding self)
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, role, last_seen_at, created_at, is_verified')
                .neq('id', user?.id)
                .order('created_at', { ascending: false });

            if (profilesError) throw profilesError;

            // 2. Fetch people I follow
            const { data: followingData, error: followingError } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', user?.id);

            if (followingError) throw followingError;

            // 3. Fetch people who follow me
            const { data: followersData, error: followersError } = await supabase
                .from('follows')
                .select('follower_id')
                .eq('following_id', user?.id);

            if (followersError) throw followersError;

            const followerIds = new Set(followersData?.map(f => f.follower_id));

            setProfiles(profilesData?.map(p => ({
                ...p,
                follows_me: followerIds.has(p.id)
            })) || []);

            setFollowingIds(new Set(followingData?.map(f => f.following_id)));
            setFetchError(null);
        } catch (error: any) {
            console.error('Error fetching friends:', error);
            setFetchError(error.message || 'An unexpected error occurred while fetching profiles.');
            if (error?.message?.includes('column')) {
                console.warn('Database schema mismatch detected. Please run the provided SQL fix.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFollowToggle = async (targetId: string) => {
        const isFollowing = followingIds.has(targetId);

        setFollowingIds(prev => {
            const newSet = new Set(prev);
            if (isFollowing) newSet.delete(targetId);
            else newSet.add(targetId);
            return newSet;
        });

        try {
            if (isFollowing) {
                const { error } = await supabase
                    .from('follows')
                    .delete()
                    .match({ follower_id: user?.id, following_id: targetId });
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('follows')
                    .insert({ follower_id: user?.id, following_id: targetId });
                if (error) throw error;
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
            setFollowingIds(prev => {
                const newSet = new Set(prev);
                if (isFollowing) newSet.add(targetId);
                else newSet.delete(targetId);
                return newSet;
            });
        }
    };

    const getFilteredProfiles = () => {
        let base = profiles;

        // Search filter
        if (searchQuery) {
            base = base.filter(p =>
                (p.full_name || 'Anonymous').toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Tab filter
        if (activeTab === 'new') {
            // Already sorted by newest in query, but let's take top 10 or just show all sorted
            return base;
        } else if (activeTab === 'suggested') {
            // 1. Primary: People who follow me but I don't follow back
            const mutualPotential = base.filter(p => p.follows_me && !followingIds.has(p.id));
            if (mutualPotential.length > 0) return mutualPotential;

            // 2. Fallback: Active users or any users I don't follow yet
            return base
                .filter(p => !followingIds.has(p.id))
                .sort((a, b) => {
                    // Sort by active status first
                    const aOnline = a.last_seen_at && (new Date().getTime() - new Date(a.last_seen_at).getTime() < 300000);
                    const bOnline = b.last_seen_at && (new Date().getTime() - new Date(b.last_seen_at).getTime() < 300000);
                    if (aOnline && !bOnline) return -1;
                    if (!aOnline && bOnline) return 1;
                    return 0;
                })
                .slice(0, 10); // Show top 10 suggestions
        }

        return base;
    };

    const filteredProfiles = getFilteredProfiles();

    return (
        <div className="max-w-2xl mx-auto pb-20">
            <header className="mb-8">
                <h2 className="text-3xl font-black text-white tracking-tight">Community</h2>
                <p className="text-muted-foreground font-medium mt-1">Discover and connect with new people.</p>
            </header>

            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                    type="text"
                    placeholder="Search characters by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                />
            </div>

            {/* Tabs */}
            <div className="flex bg-white/5 p-1.5 rounded-2xl mb-8 border border-white/5">
                {(['all', 'new', 'suggested'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab
                            ? 'bg-primary text-black shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                            : 'text-muted-foreground hover:text-white'
                            }`}
                    >
                        {tab === 'all' ? 'Every One' : tab === 'new' ? 'New Users' : 'Suggested'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" size={32} /></div>
            ) : fetchError ? (
                <div className="text-center py-10 bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                    <p className="text-red-400 font-bold">Error loading profiles</p>
                    <p className="text-red-400/70 text-sm mt-2">{fetchError}</p>
                    <button
                        onClick={fetchData}
                        className="mt-4 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold"
                    >
                        Try Again
                    </button>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredProfiles.map(profile => {
                        const isOnline = profile.last_seen_at ? (new Date().getTime() - new Date(profile.last_seen_at).getTime()) < 300000 : false;

                        return (
                            <motion.div
                                key={profile.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-card p-6 rounded-[2rem] flex items-center justify-between group hover:border-white/20 transition-colors"
                            >
                                <Link
                                    to={`/profile/${profile.id}`}
                                    className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                                >
                                    <div className="relative shrink-0">
                                        <div className="w-16 h-16 rounded-full overflow-hidden bg-white/10 ring-4 ring-white/5">
                                            {profile.avatar_url ? (
                                                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-black text-2xl text-primary bg-primary/20">
                                                    {(profile.full_name || '?')[0]?.toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        {isOnline && (
                                            <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-4 border-[#0a0a0a] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] z-10" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-black text-white text-lg leading-tight">{profile.full_name || 'Anonymous User'}</h3>
                                            {profile.is_verified && (
                                                <div className="bg-blue-500 rounded-full p-1" title="Verified User">
                                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs text-primary font-bold">@{profile.full_name?.toLowerCase().replace(/\s/g, '') || 'anonymous'}</span>
                                            {profile.follows_me && (
                                                <span className="text-[10px] bg-white/10 text-white/60 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Follows You</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => navigate(`/messages?userId=${profile.id}`)}
                                        className="p-3 rounded-2xl bg-white/5 text-white hover:bg-white/10 transition-all active:scale-95 border border-white/10"
                                        title="Send Message"
                                    >
                                        <MessageCircle size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleFollowToggle(profile.id)}
                                        className={cn(
                                            "px-6 py-3 rounded-2xl text-sm font-black transition-all active:scale-95",
                                            followingIds.has(profile.id)
                                                ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                                                : 'bg-primary text-black hover:bg-primary/90 shadow-[0_10px_20px_rgba(59,130,246,0.2)]'
                                        )}
                                    >
                                        {followingIds.has(profile.id) ? 'Unfollow' : 'Follow'}
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                    {filteredProfiles.length === 0 && (
                        <div className="text-center py-16 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                            <UserPlus className="mx-auto text-muted-foreground/30 mb-4" size={48} />
                            <h4 className="text-white font-black text-xl">
                                {searchQuery ? 'No results found' : 'No connections found'}
                            </h4>
                            <p className="text-muted-foreground mt-1 px-10">
                                {searchQuery
                                    ? `We couldn't find anyone matching "${searchQuery}"`
                                    : "It looks like you're the first one here! Or there are no other users yet."}
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={fetchData}
                                    className="mt-6 text-primary font-bold text-sm hover:underline"
                                >
                                    Refresh Community
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
