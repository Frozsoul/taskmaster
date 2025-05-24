
"use client";
import { useAppData } from "@/context/AppDataContext";
import { PageHeader } from "@/components/PageHeader";
import { CalendarView } from "@/components/calendar/CalendarView";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import type { Task, SocialMediaPost } from "@/types";
import { TaskDetailModal } from "@/components/tasks/TaskList"; // Re-use for showing task details
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";


export default function CalendarPage() {
  const { tasks, posts } = useAppData();
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [viewingPost, setViewingPost] = useState<SocialMediaPost | null>(null);

  const handleTaskClick = (task: Task) => {
    setViewingTask(task);
  };

  const handlePostClick = (post: SocialMediaPost) => {
    setViewingPost(post);
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Calendar View"
        description="Visualize your tasks and scheduled posts in a monthly calendar."
        icon={CalendarDays}
      />
      
      <CalendarView tasks={tasks} posts={posts} onTaskClick={handleTaskClick} onPostClick={handlePostClick}/>

      {/* Modal for Task Details */}
      <TaskDetailModal task={viewingTask} isOpen={!!viewingTask} onClose={() => setViewingTask(null)} />

      {/* Modal for Post Details */}
      {viewingPost && (
        <Dialog open={!!viewingPost} onOpenChange={() => setViewingPost(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{viewingPost.platform} Post Details</DialogTitle>
              <DialogDescription>
                Scheduled: {viewingPost.scheduledDate ? format(viewingPost.scheduledDate, "PPPpp") : "Not scheduled"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p><strong>Content:</strong></p>
              <p className="whitespace-pre-line bg-muted p-3 rounded-md">{viewingPost.content}</p>
              <p><strong>Status:</strong> <Badge variant={viewingPost.status === 'Posted' ? 'default' : viewingPost.status === 'Scheduled' ? 'secondary' : 'outline'}>{viewingPost.status}</Badge></p>
              {viewingPost.imageUrl && (
                <div>
                  <strong>Image:</strong>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={viewingPost.imageUrl} alt="Post image" className="mt-2 rounded-md max-h-60 w-auto" data-ai-hint="social media image" />
                </div>
              )}
              {viewingPost.notes && <p><strong>Notes:</strong> {viewingPost.notes}</p>}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
