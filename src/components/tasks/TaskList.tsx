
"use client";
import type { Task } from "@/types";
import { useAppData } from "@/context/AppDataContext";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Edit3, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { TaskForm } from "./TaskForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onView?: (task: Task) => void; // For a detailed view modal if needed
}

export function TaskList({ tasks, onEdit, onDelete, onView }: TaskListProps) {
  const getPriorityBadgeVariant = (priority: Task['priority']) => {
    switch (priority) {
      case 'High': return 'destructive';
      case 'Urgent': return 'destructive';
      case 'Medium': return 'secondary'; // Using secondary for medium, could be accent based on theme
      case 'Low': return 'outline';
      default: return 'default';
    }
  };

  const getStatusBadgeVariant = (status: Task['status']) => {
     switch (status) {
      case 'Done': return 'default'; // Default (primary) for done
      case 'In Progress': return 'secondary'; // Secondary (yellow from theme) for in progress
      case 'To Do': return 'outline';
      case 'Blocked': return 'destructive';
      default: return 'default';
    }
  };


  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No tasks found. Add a new task to get started!
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium max-w-xs truncate" title={task.title}>{task.title}</TableCell>
                <TableCell><Badge variant={getStatusBadgeVariant(task.status)}>{task.status}</Badge></TableCell>
                <TableCell><Badge variant={getPriorityBadgeVariant(task.priority)}>{task.priority}</Badge></TableCell>
                <TableCell>{task.dueDate ? format(task.dueDate, "MMM dd, yyyy") : "N/A"}</TableCell>
                <TableCell>{task.channel}</TableCell>
                <TableCell>{task.assignee || "N/A"}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && <DropdownMenuItem onClick={() => onView(task)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>}
                      <DropdownMenuItem onClick={() => onEdit(task)}><Edit3 className="mr-2 h-4 w-4" />Edit Task</DropdownMenuItem>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                             <Trash2 className="mr-2 h-4 w-4" />Delete Task
                           </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the task "{task.title}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(task.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Detail view modal component (optional)
export function TaskDetailModal({ task, isOpen, onClose }: { task: Task | null, isOpen: boolean, onClose: () => void}) {
  if (!task) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
          <DialogDescription>
            Created: {format(task.createdAt, "PPPpp")} | Updated: {format(task.updatedAt, "PPPpp")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p><strong>Description:</strong> {task.description || "No description."}</p>
          <p><strong>Status:</strong> <Badge variant={task.status === 'Done' ? 'default' : task.status === 'In Progress' ? 'secondary' : 'outline'}>{task.status}</Badge></p>
          <p><strong>Priority:</strong> <Badge variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'secondary' : 'outline'}>{task.priority}</Badge></p>
          <p><strong>Due Date:</strong> {task.dueDate ? format(task.dueDate, "PPP") : "N/A"}</p>
          <p><strong>Assignee:</strong> {task.assignee || "N/A"}</p>
          <p><strong>Channel:</strong> {task.channel}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
