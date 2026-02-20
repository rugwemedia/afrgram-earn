import { useParams, useNavigate } from 'react-router-dom';
import { useTasks } from '../context/TaskContext';
import { TaskDetail } from './TaskDetail';
import { ChevronLeft } from 'lucide-react';

export function TaskPage() {
    const { taskId } = useParams();
    const { tasks } = useTasks();
    const navigate = useNavigate();

    const task = tasks.find(t => t.id === taskId);

    if (!task) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
                <h2 className="text-2xl font-bold text-white">Task Not Found</h2>
                <p className="text-muted-foreground">The task you are looking for does not exist or has been removed.</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-primary hover:underline font-bold"
                >
                    <ChevronLeft size={20} /> Back to Dashboard
                </button>
            </div>
        );
    }

    return <TaskDetail task={task} onBack={() => navigate('/dashboard')} />;
}
