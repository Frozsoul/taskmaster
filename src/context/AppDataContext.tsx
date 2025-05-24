
"use client";

import type { Task, SocialMediaPost, Priority, PrioritizedTaskSuggestion } from '@/types';
import { INITIAL_TASKS, INITIAL_POSTS } from '@/lib/constants';
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { suggestTaskPrioritization as aiSuggestTaskPrioritization, SuggestTaskPrioritizationInput } from '@/ai/flows/suggest-task-prioritization';
import { generateSocialMediaPost as aiGenerateSocialMediaPost, GenerateSocialMediaPostInput } from '@/ai/flows/generate-social-media-post';
import { useToast } from "@/hooks/use-toast";


interface AppDataContextType {
  tasks: Task[];
  posts: SocialMediaPost[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (updatedTask: Task) => void;
  deleteTask: (taskId: string) => void;
  addPost: (post: Omit<SocialMediaPost, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePost: (updatedPost: SocialMediaPost) => void;
  deletePost: (postId: string) => void;
  prioritizedSuggestions: PrioritizedTaskSuggestion[];
  suggestTaskPrioritization: () => Promise<void>;
  updateTaskPriority: (taskId: string, priority: Priority) => void;
  generateSocialMediaPost: (input: GenerateSocialMediaPostInput) => Promise<string | null>;
  isLoadingAi: boolean;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [posts, setPosts] = useState<SocialMediaPost[]>(INITIAL_POSTS);
  const [prioritizedSuggestions, setPrioritizedSuggestions] = useState<PrioritizedTaskSuggestion[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const { toast } = useToast();

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTasks(prev => [newTask, ...prev]);
    toast({ title: "Task Added", description: `Task "${newTask.title}" has been successfully added.` });
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(task => task.id === updatedTask.id ? { ...updatedTask, updatedAt: new Date() } : task));
    toast({ title: "Task Updated", description: `Task "${updatedTask.title}" has been successfully updated.` });
  };

  const deleteTask = (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.filter(task => task.id !== taskId));
    if (taskToDelete) {
      toast({ title: "Task Deleted", description: `Task "${taskToDelete.title}" has been deleted.`, variant: "destructive" });
    }
  };

  const addPost = (postData: Omit<SocialMediaPost, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPost: SocialMediaPost = {
      ...postData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setPosts(prev => [newPost, ...prev]);
     toast({ title: "Post Added", description: `A new post for ${newPost.platform} has been added.` });
  };

  const updatePost = (updatedPost: SocialMediaPost) => {
    setPosts(prev => prev.map(post => post.id === updatedPost.id ? { ...updatedPost, updatedAt: new Date() } : post));
    toast({ title: "Post Updated", description: `Post for ${updatedPost.platform} has been updated.` });
  };

  const deletePost = (postId: string) => {
    const postToDelete = posts.find(p => p.id === postId);
    setPosts(prev => prev.filter(post => post.id !== postId));
     if (postToDelete) {
      toast({ title: "Post Deleted", description: `Post for ${postToDelete.platform} has been deleted.`, variant: "destructive" });
    }
  };

  const suggestTaskPrioritization = async () => {
    setIsLoadingAi(true);
    try {
      const input: SuggestTaskPrioritizationInput = {
        tasks: tasks.map(task => ({
          title: task.title,
          description: task.description || '',
          dueDate: task.dueDate ? task.dueDate.toISOString() : new Date().toISOString(),
          impact: task.priority, // Assuming priority (High, Medium, Low) can map to impact
        })),
      };
      const result = await aiSuggestTaskPrioritization(input);
      if (result && result.prioritizedTasks) {
        const suggestions: PrioritizedTaskSuggestion[] = result.prioritizedTasks.map(pt => {
          const originalTask = tasks.find(t => t.title === pt.title);
          return {
            taskId: originalTask?.id || '',
            title: pt.title,
            currentPriority: originalTask?.priority || 'Medium',
            suggestedPriority: pt.priority as Priority,
            reason: pt.reason,
          };
        }).filter(s => s.taskId);
        setPrioritizedSuggestions(suggestions);
        toast({ title: "Prioritization Suggested", description: "AI has suggested task priorities." });
      }
    } catch (error) {
      console.error("Error suggesting task prioritization:", error);
      toast({ title: "AI Error", description: "Could not get task prioritization suggestions.", variant: "destructive" });
    } finally {
      setIsLoadingAi(false);
    }
  };
  
  const updateTaskPriority = (taskId: string, priority: Priority) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, priority, updatedAt: new Date() } : task
      )
    );
    // Optionally remove the suggestion for this task or mark as actioned
    setPrioritizedSuggestions(prev => prev.filter(s => s.taskId !== taskId));
    toast({ title: "Priority Updated", description: `Task priority set to ${priority}.` });
  };

  const generateSocialMediaPost = async (input: GenerateSocialMediaPostInput): Promise<string | null> => {
    setIsLoadingAi(true);
    try {
      const result = await aiGenerateSocialMediaPost(input);
      if (result && result.post) {
        toast({ title: "Post Generated", description: `AI has generated a post for ${input.platform}.` });
        return result.post;
      }
      return null;
    } catch (error) {
      console.error("Error generating social media post:", error);
      toast({ title: "AI Error", description: "Could not generate social media post.", variant: "destructive" });
      return null;
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <AppDataContext.Provider value={{ 
      tasks, posts, addTask, updateTask, deleteTask, 
      addPost, updatePost, deletePost,
      prioritizedSuggestions, suggestTaskPrioritization, updateTaskPriority,
      generateSocialMediaPost, isLoadingAi
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
