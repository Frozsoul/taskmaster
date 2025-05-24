
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TaskForm } from "@/components/tasks/TaskForm";
import { PlusCircle } from "lucide-react";
import type { Task } from "@/types";
import { useAppData } from "@/context/AppDataContext";

export function QuickAddTask() {
  const [isOpen, setIsOpen] = useState(false);
  const { addTask } = useAppData();

  const handleSubmit = (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    addTask(data);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-5 w-5" /> Quick Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>
            Quickly add a new task to your list. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <TaskForm onSubmit={handleSubmit} onCancel={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
