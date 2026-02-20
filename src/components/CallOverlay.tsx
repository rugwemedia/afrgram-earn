import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X } from 'lucide-react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import type { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';

const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || "PASTE_YOUR_AGORA_APP_ID_HERE";

interface CallState {
    id: string;
    caller_id: string;
    receiver_id: string;
    call_type: 'audio' | 'video';
    status: 'ringing' | 'ongoing' | 'ended' | 'declined';
    room_id: string;
    caller_profile?: any;
    receiver_profile?: any;
}

export function CallOverlay() {
    const { user } = useAuth();
    const [call, setCall] = useState<CallState | null>(null);
    const [joined, setJoined] = useState(false);

    // RTC Refs
    const client = useRef<IAgoraRTCClient | null>(null);
    const localAudio = useRef<IMicrophoneAudioTrack | null>(null);
    const localVideo = useRef<ICameraVideoTrack | null>(null);
    const remoteVideoRef = useRef<HTMLDivElement>(null);
    const localVideoRef = useRef<HTMLDivElement>(null);

    const [muted, setMuted] = useState(false);
    const [camOff, setCamOff] = useState(false);

    useEffect(() => {
        const handleInitiate = (e: any) => {
            console.log("Local call initiate event:", e.detail);
            const newCall = e.detail as CallState;
            setCall(newCall);

            // iOS Fix: Caller joins immediately to use the gesture
            if (newCall.caller_id === user?.id) {
                joinRoom(newCall.room_id, newCall);
            }
        };
        window.addEventListener('initiate-call', handleInitiate);
        return () => window.removeEventListener('initiate-call', handleInitiate);
    }, [user?.id]);

    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`calls_${user.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'calls'
            }, async (payload: any) => {
                const newCall = payload.new as CallState;
                if (newCall.status !== 'ringing') return;

                // Handle Incoming
                if (newCall.receiver_id === user.id) {
                    const { data: profile } = await supabase.from('profiles').select('*').eq('id', newCall.caller_id).single();
                    setCall({ ...newCall, caller_profile: profile });
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'calls'
            }, (payload) => {
                const updated = payload.new as CallState;
                if (call && updated.id === call.id) {
                    if (updated.status === 'ended' || updated.status === 'declined') {
                        endCallCleanup();
                    }
                    // For receiver: join when ongoing
                    if (updated.status === 'ongoing' && !joined && updated.receiver_id === user.id) {
                        joinRoom(updated.room_id, updated);
                    }
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user, call?.id, joined]);

    const joinRoom = async (roomId: string, currentCall: CallState) => {
        if (!AGORA_APP_ID || AGORA_APP_ID === "PASTE_YOUR_AGORA_APP_ID_HERE" || !user) return;
        if (joined) return;

        client.current = AgoraRTC.createClient({ mode: "rtc", codec: "h264" });
        await client.current.join(AGORA_APP_ID, roomId, null, user.id);

        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localAudio.current = audioTrack;

        const tracks: any[] = [audioTrack];

        if (currentCall.call_type === 'video') {
            const videoTrack = await AgoraRTC.createCameraVideoTrack();
            localVideo.current = videoTrack;
            tracks.push(videoTrack);
            if (localVideoRef.current) {
                videoTrack.play(localVideoRef.current, { fit: 'cover' });
            }
        }

        await client.current.publish(tracks);

        client.current.on("user-published", async (remoteUser, mediaType) => {
            await client.current!.subscribe(remoteUser, mediaType);
            if (mediaType === "video") {
                remoteUser.videoTrack?.play(remoteVideoRef.current!);
            }
            if (mediaType === "audio") remoteUser.audioTrack?.play();
        });

        setJoined(true);
    };

    // Auto-timeout logic: 90 seconds
    useEffect(() => {
        if (call?.status === 'ringing') {
            const timer = setTimeout(() => {
                console.log("Call timed out after 90s");
                handleEnd();
            }, 90000);
            return () => clearTimeout(timer);
        }
    }, [call?.status]);

    const handleAnswer = async () => {
        if (!call) return;
        await supabase.from('calls').update({ status: 'ongoing' }).eq('id', call.id);
        joinRoom(call.room_id, call);
    };

    const handleDecline = async () => {
        if (!call) return;
        await supabase.from('calls').update({ status: 'declined' }).eq('id', call.id);
        endCallCleanup();
    };

    const handleEnd = async () => {
        if (!call) return;
        await supabase.from('calls').update({ status: 'ended' }).eq('id', call.id);
        endCallCleanup();
    };

    const endCallCleanup = () => {
        localAudio.current?.close();
        localVideo.current?.close();
        client.current?.leave();
        setCall(null);
        setJoined(false);
    };

    const toggleMute = () => {
        localAudio.current?.setEnabled(muted);
        setMuted(!muted);
    };

    const toggleCam = () => {
        localVideo.current?.setEnabled(camOff);
        setCamOff(!camOff);
    };

    if (!call) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
            >
                <div className="max-w-4xl w-full aspect-video glass-card rounded-[3rem] overflow-hidden relative border border-white/10 shadow-2xl flex flex-col">

                    {/* VIDEO AREA */}
                    <div className="flex-1 relative bg-zinc-900/50">
                        {/* Remote Video */}
                        <div ref={remoteVideoRef} className="w-full h-full object-cover" />

                        {/* Local Video Pip */}
                        {call.call_type === 'video' && joined && (
                            <div className="absolute top-8 right-8 w-40 aspect-[3/4] bg-zinc-800 rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl z-10">
                                <div ref={localVideoRef} className="w-full h-full object-cover" />
                                {camOff && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                                        <VideoOff className="text-zinc-600" size={24} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Ringing / Connecting State */}
                        {(!joined || call.status === 'ringing') && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-8">
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary shadow-[0_0_40px_rgba(59,130,246,0.5)]">
                                        <img src={call.caller_profile?.avatar_url || call.receiver_profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky"} className="w-full h-full object-cover" />
                                    </div>
                                    {call.status === 'ringing' && (
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="absolute -inset-8 bg-primary/20 blur-3xl rounded-full"
                                        />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-white italic mb-2">
                                        {call.caller_id === user?.id ? 'Calling...' : (call.caller_profile?.full_name || 'Incoming Call')}
                                    </h3>
                                    <p className="text-primary font-bold tracking-widest uppercase text-xs">
                                        {call.call_type === 'video' ? 'Video Call' : 'Audio Call'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CONTROLS */}
                    <div className="p-10 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 left-0 right-0 flex justify-center items-center gap-8">
                        {call.status === 'ringing' && call.receiver_id === user?.id ? (
                            <>
                                <button onClick={handleDecline} className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all">
                                    <PhoneOff size={32} />
                                </button>
                                <button onClick={handleAnswer} className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-110 transition-all">
                                    <Phone size={32} />
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={toggleMute} className={cn("w-16 h-16 rounded-full flex items-center justify-center transition-all", muted ? "bg-red-600/20 text-red-500 border border-red-500/30" : "bg-white/10 text-white")}>
                                    {muted ? <MicOff size={24} /> : <Mic size={24} />}
                                </button>

                                <button onClick={handleEnd} className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all">
                                    <PhoneOff size={32} />
                                </button>

                                {call.call_type === 'video' && (
                                    <button onClick={toggleCam} className={cn("w-16 h-16 rounded-full flex items-center justify-center transition-all", camOff ? "bg-red-600/20 text-red-500 border border-red-500/30" : "bg-white/10 text-white")}>
                                        {camOff ? <VideoOff size={24} /> : <Video size={24} />}
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    <button onClick={handleEnd} className="absolute top-8 right-8 p-3 bg-white/5 rounded-2xl hover:bg-white/10 text-white transition-all">
                        <X />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
