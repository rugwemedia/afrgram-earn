import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// --- Types ---
export interface Task {
    id: string;
    title: string;
    description: string;
    reward: number;
    instruction: string;
    type: 'gmail' | 'social' | 'other';
    requiredEmailFormat?: string;
    requiredPassword?: string;
    recoveryEmail?: string;
    createdAt?: string;
}

export interface Submission {
    id: string;
    taskId: string;
    userId: string;
    userEmail: string;
    userName: string;
    proofImage: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
}

interface TaskContextType {
    tasks: Task[];
    submissions: Submission[];
    loading: boolean;
    addTask: (task: Omit<Task, 'id'>) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    submitProof: (submission: Omit<Submission, 'id' | 'status' | 'submittedAt'>) => Promise<void>;
    approveSubmission: (id: string) => Promise<void>;
    rejectSubmission: (id: string) => Promise<void>;
    deleteSubmission: (id: string) => Promise<void>;
    refreshData: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        refreshData();
    }, [user]);

    const refreshData = async () => {
        setLoading(true);
        try {
            // Fetch Tasks
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });

            if (tasksError) throw tasksError;

            const mappedTasks: Task[] = (tasksData || []).map(t => ({
                id: t.id,
                title: t.title,
                description: t.description,
                reward: Number(t.reward),
                instruction: t.instruction,
                // DB column is 'type' (fallback to task_type for older schemas)
                type: (t.type ?? t.task_type) as any,
                requiredEmailFormat: t.required_email_format ?? t.requiredEmailFormat,
                requiredPassword: t.required_password ?? t.requiredPassword,
                recoveryEmail: t.recovery_email ?? t.recoveryEmail,
                createdAt: t.created_at
            }));

            // Fetch Submissions (Admin sees all, Users see own)
            const { data: subsData, error: subsError } = await supabase
                .from('task_submissions')
                .select(`
                    *,
                    profiles (full_name, avatar_url)
                `)
                .order('submitted_at', { ascending: false });

            if (subsError) throw subsError;

            const mappedSubs: Submission[] = (subsData || []).map(s => ({
                id: s.id,
                taskId: s.task_id,
                userId: s.user_id,
                userEmail: '', // Profiles don't have email usually in public, but admin has it?
                userName: s.profiles?.full_name || 'User',
                proofImage: s.proof_image_url,
                status: s.status as any,
                submittedAt: s.submitted_at
            }));

            setTasks(mappedTasks);
            setSubmissions(mappedSubs);
        } catch (err) {
            console.error('Error refreshing tasks/submissions:', err);
        } finally {
            setLoading(false);
        }
    };

    const addTask = async (taskData: Omit<Task, 'id'>) => {
        try {
            const { error } = await supabase.from('tasks').insert({
                title: taskData.title,
                description: taskData.description,
                reward: taskData.reward,
                instruction: taskData.instruction,
                type: taskData.type,           // real DB column name
                required_email_format: taskData.requiredEmailFormat,
                required_password: taskData.requiredPassword,
                recovery_email: taskData.recoveryEmail
            });
            if (error) throw error;
            await refreshData();
        } catch (err) {
            console.error('Error adding task:', err);
            throw err;
        }
    };

    const deleteTask = async (id: string) => {
        try {
            const { error } = await supabase.from('tasks').delete().eq('id', id);
            if (error) throw error;
            await refreshData();
        } catch (err) {
            console.error('Error deleting task:', err);
            throw err;
        }
    };

    const submitProof = async (subData: Omit<Submission, 'id' | 'status' | 'submittedAt'>) => {
        try {
            const { error } = await supabase.from('task_submissions').insert({
                task_id: subData.taskId,
                user_id: user?.id,
                proof_image_url: subData.proofImage,
                status: 'pending'
            });
            if (error) throw error;
            await refreshData();
        } catch (err) {
            console.error('Error submitting proof:', err);
            throw err;
        }
    };

    const approveSubmission = async (id: string) => {
        try {
            const { error } = await supabase
                .from('task_submissions')
                .update({ status: 'approved' })
                .eq('id', id);
            if (error) throw error;
            await refreshData();
        } catch (err) {
            console.error('Error approving submission:', err);
        }
    };

    const rejectSubmission = async (id: string) => {
        try {
            const { error } = await supabase
                .from('task_submissions')
                .update({ status: 'rejected' })
                .eq('id', id);
            if (error) throw error;
            await refreshData();
        } catch (err) {
            console.error('Error rejecting submission:', err);
        }
    };

    const deleteSubmission = async (id: string) => {
        try {
            const { error } = await supabase.from('task_submissions').delete().eq('id', id);
            if (error) throw error;
            await refreshData();
        } catch (err) {
            console.error('Error deleting submission:', err);
        }
    };

    return (
        <TaskContext.Provider value={{
            tasks,
            submissions,
            loading,
            addTask,
            deleteTask,
            submitProof,
            approveSubmission,
            rejectSubmission,
            deleteSubmission,
            refreshData
        }}>
            {children}
        </TaskContext.Provider>
    );
}

export function useTasks() {
    const context = useContext(TaskContext);
    if (context === undefined) {
        throw new Error('useTasks must be used within a TaskProvider');
    }
    return context;
}
