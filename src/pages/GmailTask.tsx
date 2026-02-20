import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Info, Camera, Send,
    CheckCircle2, AlertTriangle, Copy,
    ExternalLink, UserCheck
} from 'lucide-react';
import { cn } from '../utils/cn';
import { MediaUploader } from '../components/MediaUploader';

interface GmailTaskProps {
    onBack: () => void;
}

export function GmailTask({ onBack }: GmailTaskProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    const taskData = {
        name: "John Musoni",
        emailFormat: "jmusoni.xxxx@gmail.com",
        password: "AFGgramPass!2024",
        recoveryEmail: "security@afggram.com"
    };

    const handleNext = () => setStep(prev => prev + 1);

    const handleSubmit = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setIsCompleted(true);
        }, 2500);
    };

    if (isCompleted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                    <UserCheck size={48} className="text-emerald-500" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white">Proof Submitted!</h2>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        Our verification engine will review your submission within 1-2 hours.
                        <b> 150 RWF</b> will be added to your balance pending approval.
                    </p>
                </div>
                <button onClick={onBack} className="btn-premium px-10">Back to Feed</button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto pb-20">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-8 font-bold"
            >
                <ChevronLeft size={20} /> Back to Dashboard
            </button>

            <header className="flex justify-between items-start mb-10">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Gmail Creation</h1>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2">
                        Detailed instruction set for secure account deployment.
                    </p>
                </div>
                <div className="bg-emerald-500 text-black font-black px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                    +150 RWF
                </div>
            </header>

            {/* Stepper */}
            <div className="flex justify-between items-center mb-12 relative">
                <div className="absolute h-1 bg-white/5 left-0 right-0 top-1/2 -translate-y-1/2 -z-10" />
                {[1, 2, 3].map(s => (
                    <div
                        key={s}
                        className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-black transition-all duration-500",
                            s < step ? "bg-primary text-white scale-90" :
                                s === step ? "bg-primary text-white shadow-[0_0_20px_rgba(59,130,246,0.6)]" :
                                    "bg-accent text-muted-foreground border border-white/10"
                        )}
                    >
                        {s < step ? <CheckCircle2 size={20} /> : s}
                    </div>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="glass-card p-10 rounded-[2.5rem] space-y-8"
                >
                    {step === 1 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <Info className="text-primary" /> Step 1: Account Parameters
                            </h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Configure a new Google account with the exact credentials below.
                                Using different names may lead to task rejection.
                            </p>

                            <div className="space-y-3 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                                {[
                                    { label: 'Display Name', value: taskData.name },
                                    { label: 'Email Format', value: taskData.emailFormat },
                                    { label: 'Master Password', value: taskData.password },
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center group">
                                        <span className="text-xs font-black text-muted-foreground uppercase">{item.label}</span>
                                        <div className="flex items-center gap-3">
                                            <code className="text-sm font-bold text-white font-mono">{item.value}</code>
                                            <button className="opacity-0 group-hover:opacity-100 text-primary transition-opacity"><Copy size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-center gap-3">
                                <UserCheck size={18} className="text-primary" />
                                <p className="text-xs text-primary font-bold">Use random Date of Birth (Age &gt; 18) and Gender.</p>
                            </div>

                            <button onClick={handleNext} className="btn-premium w-full flex items-center justify-center gap-2">
                                I've Started Creation <ExternalLink size={18} />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <Camera className="text-primary" /> Step 2: Proof Capture
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                Once the account is ready, take a screenshot of the <b>Welcome Screen</b> or the Google Workspace inbox.
                            </p>

                            <div className="aspect-video bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4 group hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden">
                                <MediaUploader
                                    label="Upload Screenshot Proof"
                                    className="w-full h-full border-none hover:bg-transparent"
                                    onUploadComplete={() => {
                                        // Ideally store this functionality in parent state or new state here
                                        // For now just auto-advance to simulate submission for the user
                                        handleNext();
                                    }}
                                />
                            </div>

                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
                                <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-500 leading-relaxed font-bold">
                                    Warning: Accepting this task and failing to submit proof will result in a <b>-100 RWF penalty</b> deduction.
                                </p>
                            </div>

                            <button onClick={handleNext} className="btn-premium w-full">Next: Security Shield</button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <Send className="text-primary" /> Step 3: Final Submission
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                Add the specified recovery email into the new account settings to ensure long-term stability.
                            </p>

                            <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5 flex justify-between items-center group">
                                <span className="text-xs font-black text-muted-foreground uppercase">Recovery Email</span>
                                <div className="flex items-center gap-3">
                                    <code className="text-sm font-bold text-white font-mono">{taskData.recoveryEmail}</code>
                                    <button className="text-primary"><Copy size={14} /></button>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="btn-premium w-full flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Submit Proof For Review <Send size={18} /></>
                                )}
                            </button>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div >
    );
}
