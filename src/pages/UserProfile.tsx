import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, ArrowLeft, MapPin, Calendar, MessageSquare } from 'lucide-react';
import { PostCard } from '../components/PostCard';
import { cn } from '../utils/cn';

interface Profile {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
    role: string;
    bio?: string;
    location?: string;
    website?: string;
    created_at: string;
    last_seen_at?: string;
}

interface Post {
    id: string;
    content: string;
    image?: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
    profiles: any; // We already have profile data
    user_id: string;
}

export function UserProfile() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0 });
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchProfileData();

            // Real-time Live Status Listener
            const sub = supabase
                .channel(`profile_live_${userId}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'live_sessions',
                    filter: `host_id=eq.${userId}`
                }, (payload) => {
                    if (payload.eventType === 'INSERT') setIsLive(true);
                    if (payload.eventType === 'DELETE') setIsLive(false);
                })
                .subscribe();

            return () => { supabase.removeChannel(sub); };
        }
    }, [userId]);

    const fetchProfileData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;

            // 2. Fetch Posts
            const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (postsError) throw postsError;

            // 3. Fetch Stats (Followers/Following)
            const { count: followersCount } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', userId);

            const { count: followingCount } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', userId);

            setProfile({
                ...profileData,
                username: '@' + (profileData.full_name?.toLowerCase().replace(/\s/g, '') || 'user')
            });
            setPosts(postsData || []);
            setStats({
                followers: followersCount || 0,
                following: followingCount || 0,
                posts: postsData?.length || 0
            });

            // 4. Check Live Status
            const { data: liveData } = await supabase
                .from('live_sessions')
                .select('id')
                .eq('host_id', userId)
                .maybeSingle();
            setIsLive(!!liveData);

        } catch (error) {
            console.error('Error fetching profile:', error);
            // toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <p className="text-muted-foreground">User not found</p>
                <button onClick={() => navigate(-1)} className="btn-premium px-6">Go Back</button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto pb-20">
            {/* Header / Nav */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft size={20} className="text-white" />
                </button>
                <h2 className="text-xl font-bold text-white tracking-tight">{profile.full_name}</h2>
            </div>

            {/* Profile Card */}
            <div className="glass-card p-6 rounded-[2.5rem] mb-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary/20 to-purple-500/20" />

                <div className="relative mt-12 flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full p-1 bg-background mb-4 relative">
                        <div className={cn(
                            "w-full h-full rounded-full overflow-hidden transition-all",
                            isLive ? "ring-4 ring-red-600 animate-pulse" : "bg-white/10"
                        )}>
                            <img src={profile.avatar_url || 'https://via.placeholder.com/150'} alt={profile.full_name} className="w-full h-full object-cover" />
                        </div>
                        {isLive ? (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 text-[8px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-widest border-2 border-[#0a0a0a] z-20">
                                Live
                            </div>
                        ) : profile.last_seen_at && (new Date().getTime() - new Date(profile.last_seen_at).getTime() < 300000) ? (
                            <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-[#0a0a0a] rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] z-10" />
                        ) : null}
                    </div>

                    <div className="flex flex-col items-center">
                        <h1 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
                            {profile.full_name}
                            {(profile as any).is_verified && (
                                <div className="bg-blue-500 rounded-full p-1">
                                    <svg width={12} height={12} className="text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                            {profile.last_seen_at && (new Date().getTime() - new Date(profile.last_seen_at).getTime() < 300000) && (
                                <span className="flex items-center gap-1.5 text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-widest font-black">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    Active Now
                                </span>
                            )}
                            {isLive && (
                                <Link to="/live" className="flex items-center gap-1.5 text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full border border-red-600/20 uppercase tracking-widest font-black shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                    Live Now
                                </Link>
                            )}
                        </h1>
                        <p className="text-primary font-medium mb-6">@{profile.username}</p>

                        <div className="flex gap-4 w-full max-w-sm">
                            <button className="flex-1 bg-primary text-black font-black py-4 rounded-2xl hover:bg-primary/90 transition-all shadow-[0_10px_20px_rgba(59,130,246,0.2)] active:scale-95">
                                Follow
                            </button>
                            <Link
                                to="/messages"
                                className="flex-1 bg-white/5 border border-white/10 text-white font-black py-4 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                <MessageSquare size={20} /> Message
                            </Link>
                        </div>
                    </div>
                    <div className="flex gap-6 mb-6">
                        <div className="text-center">
                            <div className="text-lg font-black text-white">{stats.posts}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Posts</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-black text-white">{stats.followers}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Followers</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-black text-white">{stats.following}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Following</div>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                        {profile.location && (
                            <div className="flex items-center gap-1">
                                <MapPin size={14} /> {profile.location}
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <Calendar size={14} /> Joined {new Date(profile.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Posts Grid */}
            <div className="space-y-6">
                <h3 className="font-bold text-white text-lg px-2">Posts</h3>
                {posts.length > 0 ? (
                    posts.map(post => (
                        <PostCard
                            key={post.id}
                            id={post.id}
                            user={{
                                name: profile.full_name,
                                username: profile.username,
                                avatar: profile.avatar_url,
                                verified: (profile as any).is_verified,
                                id: profile.id,
                                isLive: isLive
                            }}
                            content={post.content}
                            image={post.image}
                            likes={post.likes_count}
                            comments={post.comments_count}
                            timestamp={new Date(post.created_at).toLocaleDateString()}
                        />
                    ))
                ) : (
                    <div className="text-center py-10 text-muted-foreground bg-white/5 rounded-3xl">
                        No posts yet.
                    </div>
                )}
            </div>
        </div>
    );
}
