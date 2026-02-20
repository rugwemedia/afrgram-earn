import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Radio, Users, X,
    Mic, MicOff, Video as VideoIcon, VideoOff,
    Send, StopCircle, Heart, Share2,
    Settings, Loader2, Sparkles, MessageCircle
} from 'lucide-react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import type { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../utils/cn';

// ─── AGORA CONFIG ───────────────────────────────────────────────────────────
// REPLACE THIS with your actual Agora App ID from console.agora.io
const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || "PASTE_YOUR_AGORA_APP_ID_HERE";

interface StreamSession {
    id: string;
    title: string;
    description: string;
    host_id: string;
    room_id: string;
    viewer_count: number;
    cover_url?: string;
    profiles?: {
        full_name: string;
        avatar_url: string;
    };
}

export function Live() {
    const { user } = useAuth();
    const [streams, setStreams] = useState<StreamSession[]>([]);
    const [activeStream, setActiveStream] = useState<StreamSession | null>(null);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Form for new stream
    const [newTitle, setNewTitle] = useState('');

    useEffect(() => {
        fetchStreams();
        const subscription = supabase
            .channel('live_sessions_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions' }, () => fetchStreams())
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    }, []);

    const fetchStreams = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('live_sessions')
                .select('*, profiles:host_id(full_name, avatar_url)')
                .eq('status', 'live')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[Live] Fetch error:', error);
                // If there's a join error, fallback to simple select
                if (error.message.includes('relationship')) {
                    const { data: simpleData } = await supabase
                        .from('live_sessions')
                        .select('*')
                        .eq('status', 'live');
                    setStreams(simpleData || []);
                }
            } else {
                setStreams(data || []);
            }
        } catch (err) {
            console.error('[Live] Unexpected error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartStream = async () => {
        if (!user || !newTitle.trim()) return;

        // Cleanup any old "ghost" sessions first
        await supabase.from('live_sessions').delete().eq('host_id', user.id);

        const roomId = `room_${Math.random().toString(36).substring(7)}`;
        const { data, error } = await supabase
            .from('live_sessions')
            .insert({
                host_id: user.id,
                title: newTitle,
                room_id: roomId,
                status: 'live'
            })
            .select()
            .single();

        if (error) {
            alert(error.message);
            return;
        }

        setActiveStream(data);
        setIsBroadcasting(true);
        setIsCreating(false);
        setNewTitle('');
    };

    return (
        <div className="space-y-8 pb-10">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tight flex items-center gap-3">
                        <Radio className="text-primary animate-pulse" /> Live Now
                    </h2>
                    <p className="text-muted-foreground font-medium">Watch live streams or broadcast your own.</p>
                </div>
                {!isBroadcasting && !activeStream && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="btn-premium px-6 py-3 font-black flex items-center gap-2"
                    >
                        <Radio size={18} /> Go Live
                    </button>
                )}
            </header>

            {/* ── BROADCAST/WATCH OVERLAY ── */}
            <AnimatePresence>
                {(activeStream || isBroadcasting) && (
                    <StreamViewer
                        session={activeStream!}
                        isHost={activeStream?.host_id === user?.id}
                        onClose={() => {
                            setActiveStream(null);
                            setIsBroadcasting(false);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* ── CREATE STREAM MODAL ── */}
            <AnimatePresence>
                {isCreating && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            onClick={() => setIsCreating(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            className="glass-card max-w-md w-full p-8 rounded-[2.5rem] relative"
                        >
                            <h3 className="text-2xl font-black text-white italic mb-6">Start Broadcast</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest block mb-2">Stream Title</label>
                                    <input
                                        autoFocus
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                        placeholder="What are you doing today?"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary/50 outline-none font-bold italic"
                                    />
                                </div>
                                <button
                                    onClick={handleStartStream}
                                    disabled={!newTitle.trim()}
                                    className="btn-premium w-full py-4 text-white font-black text-lg disabled:opacity-50"
                                >
                                    Launch Stream
                                </button>
                                <button onClick={() => setIsCreating(false)} className="w-full text-muted-foreground font-bold hover:text-white transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── STREAMS GRID ── */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={40} className="text-primary animate-spin" />
                </div>
            ) : streams.length === 0 ? (
                <div className="glass-card p-20 rounded-[3rem] text-center border-dashed border-2 border-white/5">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6">
                        <Radio size={40} className="opacity-50" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No one is live right now</h3>
                    <p className="text-muted-foreground">Be the first to start a stream and connect with everyone!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {streams.map(stream => (
                        <motion.div
                            key={stream.id}
                            whileHover={{ y: -5 }}
                            onClick={() => setActiveStream(stream)}
                            className="glass-card rounded-[2.5rem] overflow-hidden group cursor-pointer border border-white/5 hover:border-primary/30 transition-all shadow-xl"
                        >
                            <div className="aspect-[16/10] bg-white/5 relative overflow-hidden">
                                {stream.cover_url ? (
                                    <img src={stream.cover_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-600/20">
                                        <Radio size={40} className="text-primary/30" />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 bg-red-600 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Live</span>
                                </div>
                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5">
                                    <Users size={12} className="text-white" />
                                    <span className="text-[10px] font-black text-white">{stream.viewer_count || 0}</span>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-white/5 overflow-hidden ring-2 ring-primary/20">
                                        <img src={stream.profiles?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky"} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-black truncate">{stream.title}</h4>
                                        <p className="text-xs text-muted-foreground font-medium">{stream.profiles?.full_name}</p>
                                    </div>
                                </div>
                                <button className="w-full py-3 bg-white/5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all group-hover:shadow-[0_4px_15px_rgba(59,130,246,0.3)]">
                                    Watch Stream
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── STREAM VIEWER COMPONENT ────────────────────────────────────────────────
function StreamViewer({ session, isHost, onClose }: { session: StreamSession, isHost: boolean, onClose: () => void }) {
    const { user } = useAuth();
    const agoraClient = useRef<IAgoraRTCClient | null>(null);
    const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
    const [joined, setJoined] = useState(false);
    const [remoteUsers, setRemoteUsers] = useState<any[]>([]);

    // Controls
    const [muted, setMuted] = useState(false);
    const [videoOff, setVideoOff] = useState(false);
    const [beautyEnabled, setBeautyEnabled] = useState(false);

    // Chat & Interactions
    const [comments, setComments] = useState<any[]>([]);
    const [likesCount, setLikesCount] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [joinNotice, setJoinNotice] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const videoRef = useRef<HTMLDivElement>(null);
    const mountedAt = useRef(Date.now());

    useEffect(() => {
        if (session) {
            fetchComments();
            fetchLikes();

            const chatSub = supabase
                .channel(`stream_interactions_${session.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'live_stream_comments',
                    filter: `session_id=eq.${session.id}`
                }, (payload) => {
                    fetchCommentUser(payload.new);
                })
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'live_stream_likes',
                    filter: `session_id=eq.${session.id}`
                }, () => fetchLikes())
                .subscribe();

            // Listen for session deletion (to kick viewers if host ends stream)
            const sessionSync = supabase
                .channel(`session_sync_${session.id}`)
                .on('postgres_changes', {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'live_sessions',
                    filter: `id=eq.${session.id}`
                }, () => {
                    if (!isHost) {
                        onClose();
                    }
                })
                .subscribe();

            // Notify host when someone joins (simulated via presence)
            const presenceChannel = supabase.channel(`presence_${session.id}`, {
                config: { presence: { key: user?.id } }
            });

            presenceChannel
                .on('presence', { event: 'join' }, ({ newPresences }) => {
                    if (isHost && newPresences.length > 0) {
                        const newUser = newPresences[0] as any;
                        if (newUser.key !== user?.id) {
                            showJoinNotice("Someone joined!"); // Ideally fetch name
                        }
                    }
                })
                .subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        await presenceChannel.track({ user_id: user?.id, joined_at: new Date().toISOString() });
                    }
                });

            return () => {
                supabase.removeChannel(chatSub);
                supabase.removeChannel(sessionSync);
                supabase.removeChannel(presenceChannel);
            };
        }
    }, [session.id]);

    const showJoinNotice = (msg: string) => {
        setJoinNotice(msg);
        setTimeout(() => setJoinNotice(null), 3000);
    };

    const fetchLikes = async () => {
        const { count } = await supabase.from('live_stream_likes').select('*', { count: 'exact', head: true }).eq('session_id', session.id);
        setLikesCount(count || 0);

        if (user) {
            const { data } = await supabase.from('live_stream_likes').select('id').match({ session_id: session.id, user_id: user.id }).maybeSingle();
            setHasLiked(!!data);
        }
    };

    const handleToggleLike = async () => {
        if (!user) return;
        if (hasLiked) {
            await supabase.from('live_stream_likes').delete().match({ session_id: session.id, user_id: user.id });
        } else {
            await supabase.from('live_stream_likes').insert({ session_id: session.id, user_id: user.id });
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        alert("Stream link copied to clipboard!");
    };

    const fetchComments = async () => {
        const { data } = await supabase
            .from('live_stream_comments')
            .select('*, profiles:user_id(full_name, avatar_url)')
            .eq('session_id', session.id)
            .order('created_at', { ascending: true });
        setComments(data || []);
    };

    const fetchCommentUser = async (newMsg: any) => {
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', newMsg.user_id)
            .single();
        setComments(prev => [...prev, { ...newMsg, profiles: profile }]);
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [comments]);

    const handleSendComment = async () => {
        if (!newComment.trim() || !user) return;
        const msg = newComment.trim();
        setNewComment('');
        await supabase.from('live_stream_comments').insert({
            session_id: session.id,
            user_id: user.id,
            content: msg
        });
    };

    useEffect(() => {
        initAgora();

        const handleUnload = () => {
            if (isHost) {
                // Use beacon or sync request if possible, but for Supabase we just attempt
                const session_id = session.id;
                supabase.from('live_sessions').delete().eq('id', session_id).then();
            }
        };

        window.addEventListener('beforeunload', handleUnload);

        return () => {
            window.removeEventListener('beforeunload', handleUnload);
            localVideoTrack?.close();
            localAudioTrack?.close();
            agoraClient.current?.leave();

            // Fix for "Cancelling Directly": Only delete if we've been live for > 2 seconds
            // This prevents React Strict Mode from deleting the session on its initial test-mount
            if (isHost && (Date.now() - mountedAt.current > 2000)) {
                endSession();
            }
        };
    }, []);

    const initAgora = async () => {
        if (!AGORA_APP_ID || AGORA_APP_ID === "PASTE_YOUR_AGORA_APP_ID_HERE") {
            console.warn("Agora App ID not found");
            return;
        }

        const client = AgoraRTC.createClient({ mode: isHost ? "live" : "rtc", codec: "h264" });
        agoraClient.current = client;

        if (isHost) {
            await client.setClientRole("host");
            const [audio, video] = await AgoraRTC.createMicrophoneAndCameraTracks();
            setLocalAudioTrack(audio);
            setLocalVideoTrack(video);

            await client.join(AGORA_APP_ID, session.room_id, null, null);
            await client.publish([audio, video]);

            if (videoRef.current) video.play(videoRef.current);
        } else {
            await client.join(AGORA_APP_ID, session.room_id, null, null);
            client.on("user-published", async (user, mediaType) => {
                await client.subscribe(user, mediaType);
                if (mediaType === "video") {
                    setRemoteUsers(prev => [...prev, user]);
                }
                if (mediaType === "audio") user.audioTrack?.play();
            });
            client.on("user-unpublished", (user) => {
                setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
            });
        }
        setJoined(true);
    };

    useEffect(() => {
        if (!isHost && remoteUsers.length > 0 && videoRef.current) {
            remoteUsers[0].videoTrack?.play(videoRef.current);
        }
    }, [remoteUsers, isHost]);

    const toggleMute = () => {
        if (localAudioTrack) {
            localAudioTrack.setEnabled(muted);
            setMuted(!muted);
        }
    };

    const toggleVideo = () => {
        if (localVideoTrack) {
            localVideoTrack.setEnabled(videoOff);
            setVideoOff(!videoOff);
        }
    };

    const toggleBeauty = async () => {
        if (localVideoTrack) {
            const nextState = !beautyEnabled;
            await localVideoTrack.setBeautyEffect(nextState, {
                lighteningContrastLevel: 1,
                lighteningLevel: 0.7,
                smoothnessLevel: 0.5,
                rednessLevel: 0.1
            });
            setBeautyEnabled(nextState);
        }
    };

    const endSession = async () => {
        if (isHost) {
            await supabase.from('live_sessions').delete().eq('id', session.id);
        }
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black flex flex-col md:flex-row shadow-2xl overflow-hidden"
        >
            {/* ── VIDEO AREA ── */}
            <div className="flex-1 relative bg-[#0a0a0a] flex items-center justify-center">
                <div ref={videoRef} className="w-full h-full object-contain" />

                {(!joined || (isHost && videoOff)) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                                <VideoOff className="text-zinc-600" />
                            </div>
                            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
                                {!joined ? 'Connecting...' : 'Video Paused'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Overlay Controls */}
                <div className="absolute top-6 left-6 flex items-center gap-3">
                    <div className="bg-red-600 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-xl">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span className="text-xs font-black text-white uppercase tracking-widest leading-none">Live</span>
                    </div>
                    <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                        <Users size={14} className="text-white" />
                        <span className="text-xs font-black text-white">{session.viewer_count || 0}</span>
                    </div>
                    <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                        <Heart size={14} className="text-red-500 fill-red-500" />
                        <span className="text-xs font-black text-white">{likesCount}</span>
                    </div>
                </div>

                {/* Join Popup for Host */}
                <AnimatePresence>
                    {joinNotice && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, x: '-50%' }}
                            animate={{ opacity: 1, y: 0, x: '-50%' }}
                            exit={{ opacity: 0, y: -20, x: '-50%' }}
                            className="absolute top-20 left-1/2 bg-primary/20 backdrop-blur-xl border border-primary/30 px-6 py-2 rounded-full text-white text-xs font-bold"
                        >
                            ✨ {joinNotice}
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={endSession}
                    className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl transition-all"
                >
                    <X className="text-white" />
                </button>

                {/* BOTTOM CONTROLS */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/40 backdrop-blur-xl p-4 rounded-[2.5rem] border border-white/10">
                    {isHost && (
                        <>
                            <ControlBtn onClick={toggleMute} active={!muted} icon={muted ? MicOff : Mic} />
                            <ControlBtn onClick={toggleVideo} active={!videoOff} icon={videoOff ? VideoOff : VideoIcon} />
                            <ControlBtn
                                onClick={toggleBeauty}
                                active={beautyEnabled}
                                icon={Sparkles}
                                color={beautyEnabled ? "bg-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "bg-white/10 text-white"}
                            />
                        </>
                    )}
                    <button
                        onClick={endSession}
                        className="w-14 h-14 bg-red-600 hover:bg-red-700 rounded-3xl flex items-center justify-center text-white transition-all hover:scale-110 shadow-2xl"
                    >
                        <StopCircle size={24} />
                    </button>
                    <ControlBtn onClick={handleToggleLike} active={hasLiked} icon={Heart} color={hasLiked ? "bg-red-600 text-white" : "bg-white/10 text-white"} />
                    <ControlBtn onClick={handleShare} active={false} icon={Share2} />
                    <ControlBtn onClick={() => { }} active={true} icon={Settings} color="bg-zinc-800" />
                </div>
            </div>

            {/* ── CHAT SIDEBAR ── */}
            <div className="w-full md:w-[380px] h-full bg-zinc-950 border-l border-white/5 flex flex-col">
                <div className="p-6 border-b border-white/5">
                    <h5 className="text-white font-black text-lg truncate">{session.title}</h5>
                    <p className="text-xs text-muted-foreground mt-1">Host: <span className="text-primary font-bold">{session.profiles?.full_name}</span></p>
                </div>

                <div className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar">
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 animate-in slide-in-from-bottom-2 fade-in">
                            <div className="w-8 h-8 rounded-full bg-white/5 overflow-hidden ring-1 ring-white/10 shrink-0">
                                <img src={comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.id}`} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 bg-white/[0.03] p-3 rounded-2xl rounded-tl-none">
                                <p className="text-[10px] text-primary/70 font-black uppercase mb-0.5">{comment.profiles?.full_name}</p>
                                <p className="text-sm text-zinc-300 leading-relaxed">{comment.content}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />

                    {comments.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                            <MessageCircle className="mb-2" />
                            <p className="text-xs">No comments yet. Be the first!</p>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-zinc-900/50">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSendComment(); }}
                        className="flex gap-2"
                    >
                        <input
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:ring-2 focus:ring-primary outline-none"
                            placeholder="Type a message..."
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg disabled:opacity-50"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </motion.div>
    );
}

function ControlBtn({ onClick, active, icon: Icon, color }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-14 h-14 rounded-3xl flex items-center justify-center transition-all hover:scale-110",
                color || (active ? "bg-white/10 text-white" : "bg-red-600/20 text-red-500 border border-red-500/30")
            )}
        >
            <Icon size={22} />
        </button>
    );
}
