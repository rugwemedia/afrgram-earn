import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Save, User, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { MediaUploader } from '../components/MediaUploader';

export function Settings() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
    const [requestingVerification, setRequestingVerification] = useState(false);
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);
    const [config, setConfig] = useState({ min_followers: 100, monthly_fee: 500 });

    // Password state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('full_name, avatar_url, is_verified')
                .eq('id', user?.id)
                .single();

            if (error) throw error;
            if (data) {
                setFullName(data.full_name || '');
                setAvatarUrl(data.avatar_url || '');
                setIsVerified(data.is_verified || false);
            }

            // Also fetch verification request status and rejection reason
            const { data: reqData } = await supabase
                .from('verification_requests')
                .select('status, rejection_reason')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })
                .limit(1);

            if (reqData && reqData.length > 0) {
                setVerificationStatus(reqData[0].status);
                setRejectionReason(reqData[0].rejection_reason);
            }

            // Fetch public config
            const { data: configData } = await supabase.from('verification_config').select('*').eq('id', 'global').single();
            if (configData) setConfig(configData);
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleRequestVerification = async () => {
        setRequestingVerification(true);
        try {
            const { error } = await supabase
                .from('verification_requests')
                .upsert({ user_id: user?.id, status: 'pending', updated_at: new Date() });

            if (error) throw error;
            setVerificationStatus('pending');
            alert('Verification request submitted!');
        } catch (err: any) {
            console.error('Verification error:', err);
            alert('Failed to submit request: ' + (err.message || 'Already pending?'));
        } finally {
            setRequestingVerification(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);

        try {
            const updates = {
                id: user?.id,
                full_name: fullName,
                avatar_url: avatarUrl,
                updated_at: new Date(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);

            if (error) throw error;
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Error updating profile!');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("Passwords don't match!");
            return;
        }
        if (newPassword.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }

        setUpdatingPassword(true);
        setPasswordSuccess(false);

        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            setPasswordSuccess(true);
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordSuccess(false), 3000);
        } catch (error: any) {
            console.error('Error updating password:', error);
            alert('Error updating password: ' + error.message);
        } finally {
            setUpdatingPassword(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto pb-20">
            <header className="mb-8">
                <h2 className="text-3xl font-black text-white tracking-tight">Settings</h2>
                <p className="text-muted-foreground font-medium mt-1">Manage your public profile and account.</p>
            </header>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 rounded-[2.5rem]"
            >
                <div className="flex justify-center mb-8">
                    <div className="relative group cursor-pointer">
                        <div className="w-24 h-24 rounded-full bg-white/5 border-2 border-white/10 overflow-hidden flex items-center justify-center">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <User size={40} className="text-muted-foreground" />
                            )}
                        </div>
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera size={24} className="text-white" />
                        </div>
                    </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-muted-foreground ml-1">Avatar & Identity</label>
                        <div className="flex gap-6 items-start">
                            <div className="relative group shrink-0">
                                <div className="w-24 h-24 rounded-full bg-white/5 border-2 border-white/10 overflow-hidden flex items-center justify-center">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={40} className="text-muted-foreground" />
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 space-y-4">
                                <MediaUploader
                                    label="Upload New Photo"
                                    onUploadComplete={(url) => setAvatarUrl(url)}
                                    className="w-full"
                                />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Full Name (how you appear to others)"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-6 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-white transition-all font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            disabled={loading}
                            className="btn-premium w-full py-4 text-white font-bold flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : (
                                success ? <><CheckCircle2 size={20} /> Saved!</> : <><Save size={20} /> Update Profile</>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-12 pt-8 border-t border-white/5 space-y-6">
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-muted-foreground ml-1">Security & Access</label>
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="New Password"
                                    className="bg-white/5 border border-white/10 rounded-2xl py-3 px-6 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-white transition-all font-medium"
                                />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm New Password"
                                    className="bg-white/5 border border-white/10 rounded-2xl py-3 px-6 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none text-white transition-all font-medium"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={updatingPassword}
                                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {updatingPassword ? <Loader2 size={16} className="animate-spin" /> : (
                                    passwordSuccess ? <><CheckCircle2 size={16} className="text-emerald-500" /> Password Updated</> : 'Change Password'
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
                        <div>
                            <h4 className="text-white font-bold flex items-center gap-2">
                                Verification Badge
                                {isVerified && (
                                    <div className="bg-blue-500 rounded-full p-0.5">
                                        <svg width={10} height={10} className="text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                                Requirements: {config.min_followers}+ followers & {config.monthly_fee} RWF monthly fee.
                            </p>
                        </div>

                        {isVerified ? (
                            <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-xs font-bold flex items-center gap-2">
                                <CheckCircle2 size={16} /> Verified Account
                            </div>
                        ) : verificationStatus === 'pending' ? (
                            <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs font-bold flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin" /> Request Pending
                            </div>
                        ) : (
                            <button
                                onClick={handleRequestVerification}
                                disabled={requestingVerification}
                                className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                            >
                                {requestingVerification ? 'Submitting...' : 'Request Blue Tick'}
                            </button>
                        )}
                    </div>

                    {verificationStatus === 'rejected' && rejectionReason && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                            <p className="text-xs font-black text-red-500 uppercase tracking-widest mb-1">Rejection Reason:</p>
                            <p className="text-sm text-red-400 font-medium">{rejectionReason}</p>
                            <p className="text-[10px] text-muted-foreground mt-2 italic">You can update your profile and try again after addressing the issues above.</p>
                        </div>
                    )}
                </div>
            </motion.div >
        </div >
    );
}
