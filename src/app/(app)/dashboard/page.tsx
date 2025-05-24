
"use client";
import { useAppData } from "@/context/AppDataContext";
import { PageHeader } from "@/components/PageHeader";
import { QuickAddTask } from "@/components/dashboard/QuickAddTask";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks, CheckCircle, Clock, Users, BarChart3, CalendarClock, Send } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

// Note: The original file had a local const LayoutDashboard = BarChart3;
// PageHeader uses BarChart3 via this const. This is maintained.
const LayoutDashboardIcon = BarChart3;

export default function DashboardPage() {
  const { tasks, posts } = useAppData();

  const tasksToDo = tasks.filter(task => task.status === 'To Do').length;
  const tasksInProgress = tasks.filter(task => task.status === 'In Progress').length;
  const tasksDone = tasks.filter(task => task.status === 'Done').length;
  
  const upcomingTasks = tasks
    .filter(task => task.dueDate && task.dueDate >= new Date() && task.status !== 'Done')
    .sort((a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0))
    .slice(0, 5);

  const scheduledPosts = posts
    .filter(post => post.scheduledDate && post.scheduledDate >= new Date() && post.status === 'Scheduled')
    .sort((a,b) => (a.scheduledDate?.getTime() || 0) - (b.scheduledDate?.getTime() || 0))
    .slice(0,5);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        description="Welcome back! Here's an overview of your MiinTaskMaster workspace."
        icon={LayoutDashboardIcon}
        actionButtons={<QuickAddTask />} 
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Total Tasks" value={tasks.length} icon={ListChecks} description="All tasks in system" />
        <SummaryCard title="Tasks To Do" value={tasksToDo} icon={Clock} description="Pending tasks" className="text-destructive-foreground bg-destructive/80" />
        <SummaryCard title="Tasks In Progress" value={tasksInProgress} icon={Users} description="Currently active tasks" className="text-accent-foreground bg-accent/80" />
        <SummaryCard title="Tasks Completed" value={tasksDone} icon={CheckCircle} description="Finished tasks" className="text-primary-foreground bg-primary/80" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-primary"/>Upcoming Deadlines</CardTitle>
            <CardDescription>Tasks that are due soon.</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length > 0 ? (
              <ul className="space-y-3">
                {upcomingTasks.map(task => (
                  <li key={task.id} className="flex justify-between items-center p-3 rounded-md border hover:bg-muted/50 transition-colors">
                    <div>
                      <Link href={`/tasks?taskId=${task.id}`} className="font-medium hover:underline">{task.title}</Link>
                      <p className="text-sm text-muted-foreground">
                        Due: {task.dueDate ? format(task.dueDate, "MMM dd, yyyy") : "N/A"} - Priority: {task.priority}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild><Link href={`/tasks?taskId=${task.id}`}>View</Link></Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No upcoming deadlines. Great job!</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary"/>Scheduled Posts</CardTitle>
            <CardDescription>Content ready to go live.</CardDescription>
          </CardHeader>
          <CardContent>
             {scheduledPosts.length > 0 ? (
              <ul className="space-y-3">
                {scheduledPosts.map(post => (
                  <li key={post.id} className="flex justify-between items-center p-3 rounded-md border hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium">{post.platform}: {post.content.substring(0,50)}...</p>
                      <p className="text-sm text-muted-foreground">
                        Scheduled: {post.scheduledDate ? format(post.scheduledDate, "MMM dd, yyyy HH:mm") : "N/A"}
                      </p>
                    </div>
                     <Button variant="outline" size="sm" asChild><Link href={`/content-studio?postId=${post.id}`}>View</Link></Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No posts scheduled for the near future.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
