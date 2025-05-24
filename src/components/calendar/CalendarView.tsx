
"use client";
import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Task, SocialMediaPost } from "@/types";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay,isSameMonth, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { ListChecks, Send } from "lucide-react";

interface CalendarViewProps {
  tasks: Task[];
  posts: SocialMediaPost[];
  onTaskClick?: (task: Task) => void;
  onPostClick?: (post: SocialMediaPost) => void;
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({ tasks, posts, onTaskClick, onPostClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const firstDayOfMonthOffset = getDay(startOfMonth(currentMonth));

  const tasksForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter(task => task.dueDate && isSameDay(task.dueDate, selectedDate));
  }, [tasks, selectedDate]);

  const postsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return posts.filter(post => post.scheduledDate && isSameDay(post.scheduledDate, selectedDate));
  }, [posts, selectedDate]);

  const handleMonthChange = (month: Date) => {
    setCurrentMonth(month);
    // Select the first day of the new month by default
    setSelectedDate(startOfMonth(month)); 
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-2 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
            {/* External Calendar for month navigation, not day selection */}
            <Calendar
                mode="single"
                selected={currentMonth} // This makes it act as a month navigator
                onMonthChange={handleMonthChange} // Use onMonthChange
                className="p-0 [&_button]:size-8" // smaller buttons
                classNames={{
                    caption_label: "text-lg font-medium",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    head_row: "hidden", // Hide day names from this picker
                    row: "hidden" // Hide days grid from this picker
                }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px border bg-border text-center text-sm font-medium">
            {weekDays.map(day => (
              <div key={day} className="py-2 bg-muted text-muted-foreground">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 grid-rows-5 gap-px border-x border-b bg-border">
            {Array.from({ length: firstDayOfMonthOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-card aspect-square"></div>
            ))}
            {daysInMonth.map(day => {
              const tasksOnDay = tasks.filter(t => t.dueDate && isSameDay(t.dueDate, day));
              const postsOnDay = posts.filter(p => p.scheduledDate && isSameDay(p.scheduledDate, day));
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toString()}
                  className={cn(
                    "p-2 bg-card hover:bg-muted/50 cursor-pointer aspect-square flex flex-col justify-start items-start overflow-hidden",
                    isSelected && "ring-2 ring-primary ring-inset",
                    !isSameMonth(day, currentMonth) && "text-muted-foreground opacity-50",
                  )}
                  onClick={() => setSelectedDate(day)}
                >
                  <span className={cn("font-semibold", isToday && "text-accent")}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-0.5 text-xs flex-grow overflow-y-auto w-full">
                    {tasksOnDay.slice(0,1).map(task => (
                       <div key={task.id} className="p-0.5 rounded bg-primary/10 text-primary truncate" title={task.title}>
                         <ListChecks className="inline h-3 w-3 mr-1"/>Task
                       </div>
                    ))}
                     {postsOnDay.slice(0,1).map(post => (
                       <div key={post.id} className="p-0.5 rounded bg-accent/20 text-accent-foreground truncate" title={post.content.substring(0,20)}>
                         <Send className="inline h-3 w-3 mr-1"/>Post
                       </div>
                    ))}
                    {(tasksOnDay.length + postsOnDay.length > 2) && <div className="text-muted-foreground text-[10px]">...more</div>}
                  </div>
                </div>
              );
            })}
            {/* Fill remaining cells for a consistent 5-row grid */}
            {Array.from({ length: Math.max(0, 35 - daysInMonth.length - firstDayOfMonthOffset) }).map((_, i) => (
              <div key={`empty-end-${i}`} className="bg-card aspect-square"></div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>
            {selectedDate ? format(selectedDate, "MMMM dd, yyyy") : "Select a date"}
          </CardTitle>
          <CardDescription>Events and tasks for the selected day.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {!selectedDate ? (
              <p className="text-muted-foreground">No date selected.</p>
            ) : (
              <>
                {tasksForSelectedDate.length === 0 && postsForSelectedDate.length === 0 ? (
                  <p className="text-muted-foreground">No events or tasks for this day.</p>
                ) : (
                  <div className="space-y-4">
                    {tasksForSelectedDate.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-primary flex items-center gap-2"><ListChecks />Tasks</h4>
                        <ul className="space-y-2">
                          {tasksForSelectedDate.map(task => (
                            <li key={task.id} 
                                className="p-2 border rounded-md hover:bg-muted/30 cursor-pointer"
                                onClick={() => onTaskClick?.(task)}>
                              <p className="font-medium text-sm">{task.title}</p>
                              <Badge variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'secondary' : 'outline'} className="text-xs">{task.priority}</Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {postsForSelectedDate.length > 0 && (
                       <div>
                        <h4 className="font-semibold mb-2 text-accent-foreground flex items-center gap-2"><Send />Social Posts</h4>
                        <ul className="space-y-2">
                          {postsForSelectedDate.map(post => (
                            <li key={post.id} 
                                className="p-2 border rounded-md hover:bg-muted/30 cursor-pointer"
                                onClick={() => onPostClick?.(post)}>
                              <p className="font-medium text-sm">{post.platform}: {post.content.substring(0, 30)}...</p>
                              <Badge variant="outline" className="text-xs">{post.status}</Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
