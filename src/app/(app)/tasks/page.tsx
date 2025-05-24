
"use client";
import { useState, useMemo } from "react";
import { useAppData } from "@/context/AppDataContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { TaskList, TaskDetailModal } from "@/components/tasks/TaskList";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, ListChecks, Filter } from "lucide-react";
import type { Task, Status, Priority, Platform } from "@/types";
import { TASK_STATUSES, TASK_PRIORITIES, SOCIAL_PLATFORMS } from "@/lib/constants";

export default function TasksPage() {
  const { tasks, addTask, updateTask, deleteTask } = useAppData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "All">("All");
  const [channelFilter, setChannelFilter] = useState<Platform | "All">("All");


  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleDelete = (taskId: string) => {
    deleteTask(taskId);
  };

  const handleViewDetails = (task: Task) => {
    setViewingTask(task);
    setIsDetailModalOpen(true);
  }

  const handleSubmit = (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTask) {
      updateTask({ ...editingTask, ...data });
    } else {
      addTask(data);
    }
    setIsFormOpen(false);
    setEditingTask(undefined);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "All" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
      const matchesChannel = channelFilter === "All" || task.channel === channelFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesChannel;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter, channelFilter]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Task Management" 
        description="Organize, track, and manage all your project tasks efficiently."
        icon={ListChecks}
        actionButtons={
          <Button onClick={() => { setEditingTask(undefined); setIsFormOpen(true); }}>
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Task
          </Button>
        }
      />

      <div className="p-4 bg-card rounded-lg border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="lg:col-span-1"
          />
          <div className="flex flex-col gap-1.5">
             <label htmlFor="status-filter" className="text-sm font-medium text-muted-foreground">Status</label>
             <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Status | "All")}>
              <SelectTrigger id="status-filter"><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                {TASK_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
           <div className="flex flex-col gap-1.5">
            <label htmlFor="priority-filter" className="text-sm font-medium text-muted-foreground">Priority</label>
            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as Priority | "All")}>
              <SelectTrigger id="priority-filter"><SelectValue placeholder="Filter by priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Priorities</SelectItem>
                {TASK_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="channel-filter" className="text-sm font-medium text-muted-foreground">Channel</label>
            <Select value={channelFilter} onValueChange={(value) => setChannelFilter(value as Platform | "All")}>
              <SelectTrigger id="channel-filter"><SelectValue placeholder="Filter by channel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Channels</SelectItem>
                {SOCIAL_PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <TaskList tasks={filteredTasks} onEdit={handleEdit} onDelete={handleDelete} onView={handleViewDetails} />

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
        setIsFormOpen(isOpen);
        if (!isOpen) setEditingTask(undefined);
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle>
            <DialogDescription>
              {editingTask ? "Update the details of your task." : "Fill in the details for your new task."}
            </DialogDescription>
          </DialogHeader>
          <TaskForm 
            onSubmit={handleSubmit} 
            initialData={editingTask}
            onCancel={() => { setIsFormOpen(false); setEditingTask(undefined);}} 
          />
        </DialogContent>
      </Dialog>

      <TaskDetailModal task={viewingTask} isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} />
    </div>
  );
}
