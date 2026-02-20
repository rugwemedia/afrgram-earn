import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Search, Send, User, Loader2, ChevronLeft, MoreVertical, CheckCheck, Smile, Paperclip, Image as ImageIcon, Check, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { useSearchParams } from 'react-router-dom';
import { MediaUploader } from '../components/MediaUploader';

const REACTION_OPTIONS = ['❤️', '😂', '😮', '😢', '🔥', '👍'];

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
    reactions?: Record<string, string[]>; // emoji -> user_ids[]
    expires_at?: string;
    view_once?: boolean;
    media_url?: string;
    media_type?: 'image' | 'video' | 'file';
}

interface Profile {
    id: string;
    full_name: string;
    avatar_url: string;
    last_seen_at?: string;
}

interface Conversation {
    profile: Profile;
    lastMessage?: Message;
    unreadCount: number;
}

export function Messages() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const targetUserId = searchParams.get('userId');

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState('');
    const [activeMessageReactions, setActiveMessageReactions] = useState<string | null>(null);
    const [viewOnceMode, setViewOnceMode] = useState(false);
    const [disappearingMode, setDisappearingMode] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showList, setShowList] = useState(true); // For mobile view
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user) {
            fetchConversations();
            subscribeToMessages();

            if (targetUserId) {
                handleDirectMessage(targetUserId);
            }
        }
    }, [user, targetUserId]);

    const handleDirectMessage = async (uid: string) => {
        if (uid === user?.id) return;

        try {
            // First check if we already have this profile in conversations
            const existing = conversations.find(c => c.profile.id === uid);
            if (existing) {
                setSelectedProfile(existing.profile);
                setShowList(false);
                return;
            }

            // If not, fetch the profile directly
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, last_seen_at')
                .eq('id', uid)
                .single();

            if (error) throw error;
            if (data) {
                setSelectedProfile(data);
                setShowList(false);
            }
        } catch (error) {
            console.error('Error opening direct message:', error);
        }
    };

    useEffect(() => {
        if (selectedProfile) {
            fetchMessages(selectedProfile.id);
            markMessagesAsRead(selectedProfile.id);
        }
    }, [selectedProfile]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            // This is a complex query to get unique conversations
            // For simplicity in this demo, we'll fetch all profiles the user has interacted with
            const { data: messagesData, error: messagesError } = await supabase
                .from('messages')
                .select('*')
                .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
                .or(`expires_at.gt.${new Date().toISOString()},expires_at.is.null`)
                .order('created_at', { ascending: false });

            if (messagesError) throw messagesError;

            const conversationMap = new Map<string, { lastMessage: Message; unreadCount: number }>();

            messagesData?.forEach(msg => {
                const partnerId = msg.sender_id === user?.id ? msg.receiver_id : msg.sender_id;
                if (!conversationMap.has(partnerId)) {
                    conversationMap.set(partnerId, {
                        lastMessage: msg,
                        unreadCount: msg.receiver_id === user?.id && !msg.is_read ? 1 : 0
                    });
                } else if (msg.receiver_id === user?.id && !msg.is_read) {
                    const current = conversationMap.get(partnerId)!;
                    current.unreadCount += 1;
                }
            });

            const partnerIds = Array.from(conversationMap.keys());
            if (partnerIds.length === 0) {
                setLoading(false);
                return;
            }

            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, last_seen_at')
                .in('id', partnerIds);

            if (profilesError) throw profilesError;

            const sortedConversations = profilesData.map(profile => ({
                profile,
                ...conversationMap.get(profile.id)!
            })).sort((a, b) =>
                new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
            );

            setConversations(sortedConversations);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (partnerId: string) => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user?.id})`)
            .or(`expires_at.gt.${new Date().toISOString()},expires_at.is.null`)
            .order('created_at', { ascending: true });

        if (error) console.error('Error fetching messages:', error);
        else setMessages(data || []);
    };

    const subscribeToMessages = () => {
        const channel = supabase
            .channel('public:messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${user?.id}`
            }, (payload) => {
                const newMessage = payload.new as Message;
                // If it's for the currently open chat, add it
                if (selectedProfile && newMessage.sender_id === selectedProfile.id) {
                    setMessages(prev => [...prev, newMessage]);
                    markMessagesAsRead(selectedProfile.id);
                }
                // Refresh conversations list to update last message/unread count
                fetchConversations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    const handleFileUpload = (url: string, type: 'image' | 'video' | 'file') => {
        sendMessage(url, type);
    };

    const sendMessage = async (mediaUrl?: string, mediaType?: 'image' | 'video' | 'file') => {
        if (!input.trim() && !mediaUrl) return;
        if (!selectedProfile || !user) return;

        const newMessage: any = {
            sender_id: user.id,
            receiver_id: selectedProfile.id,
            content: input.trim(),
            media_url: mediaUrl,
            media_type: mediaType,
            view_once: viewOnceMode && mediaUrl ? true : false,
            expires_at: disappearingMode ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null
        };

        const { data, error } = await supabase
            .from('messages')
            .insert(newMessage)
            .select()
            .single();

        if (error) {
            console.error('Error sending message:', error);
        } else {
            setMessages(prev => [...prev, data]);
            setInput('');
            setViewOnceMode(false);
            setDisappearingMode(false);
            fetchConversations();
        }
    };

    const markMessagesAsRead = async (partnerId: string) => {
        await supabase
            .from('messages')
            .update({ is_read: true })
            .match({ sender_id: partnerId, receiver_id: user?.id, is_read: false });

        setConversations(prev => prev.map(conv =>
            conv.profile.id === partnerId ? { ...conv, unreadCount: 0 } : conv
        ));
    };

    const handleReaction = async (messageId: string, emoji: string) => {
        if (!user?.id) return;
        const msg = messages.find(m => m.id === messageId);
        if (!msg) return;

        const reactions: Record<string, string[]> = { ...(msg.reactions || {}) };
        const userIds = reactions[emoji] || [];

        if (userIds.includes(user.id)) {
            reactions[emoji] = userIds.filter(id => id !== user.id);
        } else {
            reactions[emoji] = [...userIds, user.id];
        }

        // Optimistic update
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));

        const { error } = await supabase
            .from('messages')
            .update({ reactions })
            .eq('id', messageId);

        if (error) console.error('Error reacting:', error);
    };

    const isOnline = (lastSeen?: string) => {
        if (!lastSeen) return false;
        return (new Date().getTime() - new Date(lastSeen).getTime()) < 300000;
    };

    return (
        <div className="flex h-[calc(100vh-12rem)] glass-card rounded-[2.5rem] overflow-hidden border border-white/10">
            {/* Conversations List */}
            <div className={cn(
                "w-full md:w-80 border-r border-white/10 flex flex-col bg-white/[0.02]",
                !showList && "hidden md:flex"
            )}>
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-black text-white mb-4">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center py-20 px-6">
                            <p className="text-muted-foreground text-sm italic">No conversations yet. Start chatting from the Community tab!</p>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <button
                                key={conv.profile.id}
                                onClick={() => {
                                    setSelectedProfile(conv.profile);
                                    setShowList(false);
                                }}
                                className={cn(
                                    "w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors border-b border-white/5 relative",
                                    selectedProfile?.id === conv.profile.id && "bg-white/5"
                                )}
                            >
                                <div className="relative shrink-0">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10">
                                        {conv.profile.avatar_url ? (
                                            <img src={conv.profile.avatar_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-bold">
                                                {conv.profile.full_name[0]}
                                            </div>
                                        )}
                                    </div>
                                    {isOnline(conv.profile.last_seen_at) && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#1a1a1a] rounded-full" />
                                    )}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-white truncate">{conv.profile.full_name}</h3>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {conv.lastMessage && new Date(conv.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className={cn(
                                        "text-xs truncate",
                                        conv.unreadCount > 0 ? "text-white font-bold" : "text-muted-foreground"
                                    )}>
                                        {conv.lastMessage?.sender_id === user?.id && "You: "}{conv.lastMessage?.content}
                                    </p>
                                </div>
                                {conv.unreadCount > 0 && (
                                    <div className="absolute right-4 bottom-4 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-[10px] font-black text-black">
                                        {conv.unreadCount}
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className={cn(
                "flex-1 flex flex-col bg-white/[0.01]",
                showList && "hidden md:flex"
            )}>
                {selectedProfile ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowList(true)}
                                    className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-white"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10">
                                        {selectedProfile.avatar_url ? (
                                            <img src={selectedProfile.avatar_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-bold">
                                                {selectedProfile.full_name[0]}
                                            </div>
                                        )}
                                    </div>
                                    {isOnline(selectedProfile.last_seen_at) && (
                                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#1a1a1a] rounded-full" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">{selectedProfile.full_name}</h3>
                                    <span className="text-[10px] text-muted-foreground">
                                        {isOnline(selectedProfile.last_seen_at) ? 'Active Now' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                            <button className="p-2 text-muted-foreground hover:text-white transition-colors">
                                <MoreVertical size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg) => {
                                const isMine = msg.sender_id === user?.id;
                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className={cn(
                                            "flex flex-col max-w-[80%]",
                                            isMine ? "ml-auto items-end" : "items-start"
                                        )}
                                    >
                                        <div className={cn(
                                            "px-4 py-2.5 rounded-2xl text-sm leading-relaxed relative group/msg",
                                            isMine
                                                ? "bg-primary text-black font-medium rounded-tr-none shadow-[0_5px_15px_rgba(59,130,246,0.2)]"
                                                : "bg-white/10 text-white rounded-tl-none"
                                        )}>
                                            {msg.media_url && (
                                                <div className="mb-2 max-w-sm rounded-[1.5rem] overflow-hidden border border-white/10 shadow-lg">
                                                    {msg.view_once && !isMine && !msg.is_read ? (
                                                        <button
                                                            onClick={async () => {
                                                                // Mark as read immediately to "burn" the view
                                                                await supabase.from('messages').update({ is_read: true }).eq('id', msg.id);
                                                                // Open the image in a new tab for now (or a modal if we had one)
                                                                window.open(msg.media_url, '_blank');
                                                                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
                                                            }}
                                                            className="w-full aspect-video bg-white/5 flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-all border-none"
                                                        >
                                                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                                                <ImageIcon size={24} />
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">View Photo</span>
                                                        </button>
                                                    ) : msg.view_once && msg.is_read ? (
                                                        <div className="w-full aspect-video bg-white/5 flex flex-col items-center justify-center gap-2 opacity-60">
                                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-muted-foreground">
                                                                <Check size={18} />
                                                            </div>
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Opened</span>
                                                        </div>
                                                    ) : msg.media_type === 'video' ? (
                                                        <video src={msg.media_url} controls className="w-full" />
                                                    ) : (
                                                        <img src={msg.media_url} className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                            )}
                                            {msg.content}

                                            {/* Reactions Display */}
                                            {msg.reactions && Object.entries(msg.reactions).some(([_, ids]) => ids.length > 0) && (
                                                <div className="absolute -bottom-2 right-2 flex gap-1">
                                                    {Object.entries(msg.reactions).map(([emoji, ids]) => ids.length > 0 && (
                                                        <div key={emoji} className="bg-white/10 backdrop-blur-md px-1.5 py-0.5 rounded-full text-[10px] border border-white/10 flex items-center gap-1 shadow-lg">
                                                            {emoji} <span className="opacity-60">{ids.length}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Reaction Picker Trigger */}
                                            <div className="absolute -left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1">
                                                <button
                                                    onClick={() => setActiveMessageReactions(activeMessageReactions === msg.id ? null : msg.id)}
                                                    className="p-1.5 bg-white/5 rounded-full hover:bg-white/10 hover:text-primary transition-all"
                                                >
                                                    <Smile size={16} />
                                                </button>

                                                <AnimatePresence>
                                                    {activeMessageReactions === msg.id && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.8, x: -10 }}
                                                            animate={{ opacity: 1, scale: 1, x: 0 }}
                                                            exit={{ opacity: 0, scale: 0.8, x: -10 }}
                                                            className="absolute left-full ml-2 flex items-center gap-1 bg-[#1a1a1a] border border-white/10 p-1 rounded-full shadow-2xl z-50 backdrop-blur-xl"
                                                        >
                                                            {REACTION_OPTIONS.map(emoji => (
                                                                <button
                                                                    key={emoji}
                                                                    onClick={() => {
                                                                        handleReaction(msg.id, emoji);
                                                                        setActiveMessageReactions(null);
                                                                    }}
                                                                    className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-all hover:scale-125 pb-0.5"
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1 px-1">
                                            <span className="text-[9px] text-muted-foreground">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isMine && (
                                                <CheckCheck size={10} className={cn(
                                                    msg.is_read ? "text-primary" : "text-muted-foreground"
                                                )} />
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white/[0.02] border-t border-white/10">
                            <div className="flex items-center gap-2 mb-4">
                                <MediaUploader
                                    onUploadComplete={(url, type) => handleFileUpload(url, type)}
                                    label="Attach Media"
                                    className="border-none p-2 bg-white/5 rounded-xl hover:bg-white/10"
                                />
                                <button
                                    onClick={() => setDisappearingMode(!disappearingMode)}
                                    className={cn(
                                        "p-3 rounded-xl transition-all active:scale-95",
                                        disappearingMode ? "bg-amber-500 text-black shadow-lg" : "bg-white/5 text-muted-foreground hover:bg-white/10"
                                    )}
                                    title="24h Disappearing"
                                >
                                    <Clock size={20} />
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className={cn(
                                            "p-3 rounded-xl transition-all active:scale-95",
                                            showEmojiPicker ? "bg-primary text-black shadow-lg" : "bg-white/5 text-muted-foreground hover:bg-white/10"
                                        )}
                                        title="Pick Emoji"
                                    >
                                        <Smile size={20} />
                                    </button>

                                    <AnimatePresence>
                                        {showEmojiPicker && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute bottom-full mb-4 left-0 bg-[#1a1a1a] border border-white/10 p-4 rounded-[2rem] shadow-2xl z-50 backdrop-blur-xl w-64"
                                            >
                                                <div className="grid grid-cols-6 gap-2">
                                                    {['😀', '😂', '😍', '😎', '🤔', '🔥', '👍', '❤️', '✨', '🎉', '🚀', '💯'].map(emoji => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => {
                                                                setInput(prev => prev + emoji);
                                                                setShowEmojiPicker(false);
                                                            }}
                                                            className="text-xl hover:bg-white/10 rounded-lg p-1 transition-all hover:scale-125"
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <button
                                    onClick={() => setViewOnceMode(!viewOnceMode)}
                                    className={cn(
                                        "p-3 rounded-xl transition-all active:scale-95",
                                        viewOnceMode ? "bg-primary text-black shadow-lg" : "bg-white/5 text-muted-foreground hover:bg-white/10"
                                    )}
                                    title="Toggle View Once"
                                >
                                    <Paperclip size={20} />
                                </button>
                            </div>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    sendMessage();
                                }}
                                className="flex gap-2"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-3 px-6 text-white text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-muted-foreground/50"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="w-12 h-12 rounded-2xl bg-primary text-black flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale shadow-[0_5px_20px_rgba(59,130,246,0.3)]"
                                >
                                    <Send size={20} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-muted-foreground mb-6">
                            <User size={40} />
                        </div>
                        <h3 className="text-xl font-black text-white">Select a conversation</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                            Choose a chat from the list or start a new conversation with a friend.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
