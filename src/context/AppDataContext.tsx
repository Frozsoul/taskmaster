
"use client";

import type { Task, SocialMediaPost, Priority, PrioritizedTaskSuggestion, Status, Platform, PostStatus } from '@/types';
// INITIAL_TASKS and INITIAL_POSTS are no longer used for initial state for logged-in users
// import { INITIAL_TASKS, INITIAL_POSTS } from '@/lib/constants'; 
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { suggestTaskPrioritization as aiSuggestTaskPrioritization, SuggestTaskPrioritizationInput } from '@/ai/flows/suggest-task-prioritization';
import { generateSocialMediaPost as aiGenerateSocialMediaPost, GenerateSocialMediaPostInput } from '@/ai/flows/generate-social-media-post';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  Timestamp,
  orderBy
} from 'firebase/firestore';

interface AppDataContextType {
  tasks: Task[];
  posts: SocialMediaPost[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void;
  updateTask: (updatedTaskData: Partial<Task> & { id: string }) => void;
  deleteTask: (taskId: string) => void;
  addPost: (post: Omit<SocialMediaPost, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => void;
  updatePost: (updatedPostData: Partial<SocialMediaPost> & { id: string }) => void;
  deletePost: (postId: string) => void;
  prioritizedSuggestions: PrioritizedTaskSuggestion[];
  suggestTaskPrioritization: () => Promise<void>;
  updateTaskPriority: (taskId: string, priority: Priority) => void;
  generateSocialMediaPost: (input: GenerateSocialMediaPostInput) => Promise<string | null>;
  isLoadingAi: boolean;
  isLoadingData: boolean;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// Helper to convert Firestore Timestamps to Dates
const convertTimestampsToDates = (data: Record<string, any>): Record<string, any> => {
  const newObj: Record<string, any> = {};
  for (const key in data) {
    if (data[key] instanceof Timestamp) {
      newObj[key] = data[key].toDate();
    } else if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
      newObj[key] = convertTimestampsToDates(data[key]);
    }
     else {
      newObj[key] = data[key];
    }
  }
  return newObj;
};


export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [prioritizedSuggestions, setPrioritizedSuggestions] = useState<PrioritizedTaskSuggestion[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      setPosts([]);
      setPrioritizedSuggestions([]);
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);
    const tasksCollectionPath = `users/${currentUser.uid}/tasks`;
    const postsCollectionPath = `users/${currentUser.uid}/posts`;

    const qTasks = query(collection(db, tasksCollectionPath), orderBy("createdAt", "desc"));
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestampsToDates(doc.data()),
      } as Task));
      setTasks(fetchedTasks);
      setIsLoadingData(false);
    }, (error) => {
      console.error("Error fetching tasks:", error);
      toast({ title: "Error", description: "Could not fetch tasks.", variant: "destructive" });
      setIsLoadingData(false);
    });

    const qPosts = query(collection(db, postsCollectionPath), orderBy("createdAt", "desc"));
    const unsubscribePosts = onSnapshot(qPosts, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestampsToDates(doc.data()),
      } as SocialMediaPost));
      setPosts(fetchedPosts);
      // Keep isLoadingData controlled by tasks fetch or combine logic
    }, (error) => {
      console.error("Error fetching posts:", error);
      toast({ title: "Error", description: "Could not fetch posts.", variant: "destructive" });
    });

    return () => {
      unsubscribeTasks();
      unsubscribePosts();
    };
  }, [currentUser, toast]);

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to add tasks.", variant: "destructive" });
      return;
    }
    try {
      const tasksCollectionPath = `users/${currentUser.uid}/tasks`;
      const newTaskPayload = {
        ...taskData,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, tasksCollectionPath), newTaskPayload);
      toast({ title: "Task Added", description: `Task "${taskData.title}" has been successfully added.` });
    } catch (error) {
      console.error("Error adding task:", error);
      toast({ title: "Error", description: "Could not add task.", variant: "destructive" });
    }
  };

  const updateTask = async (updatedTaskData: Partial<Task> & { id: string }) => {
     if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to update tasks.", variant: "destructive" });
      return;
    }
    try {
      const { id, ...dataToUpdate } = updatedTaskData;
      const taskDocRef = doc(db, `users/${currentUser.uid}/tasks`, id);
      await updateDoc(taskDocRef, {
        ...dataToUpdate,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Task Updated", description: `Task "${dataToUpdate.title || 'Task'}" has been successfully updated.` });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({ title: "Error", description: "Could not update task.", variant: "destructive" });
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to delete tasks.", variant: "destructive" });
      return;
    }
    const taskToDelete = tasks.find(t => t.id === taskId);
    try {
      const taskDocRef = doc(db, `users/${currentUser.uid}/tasks`, taskId);
      await deleteDoc(taskDocRef);
      if (taskToDelete) {
        toast({ title: "Task Deleted", description: `Task "${taskToDelete.title}" has been deleted.`, variant: "destructive" });
      } else {
        toast({ title: "Task Deleted", description: "Task has been deleted.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({ title: "Error", description: "Could not delete task.", variant: "destructive" });
    }
  };
  
  const addPost = async (postData: Omit<SocialMediaPost, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to add posts.", variant: "destructive" });
      return;
    }
    try {
      const postsCollectionPath = `users/${currentUser.uid}/posts`;
      const newPostPayload = {
        ...postData,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await addDoc(collection(db, postsCollectionPath), newPostPayload);
      toast({ title: "Post Added", description: `A new post for ${postData.platform} has been added.` });
    } catch (error) {
      console.error("Error adding post:", error);
      toast({ title: "Error", description: "Could not add post.", variant: "destructive" });
    }
  };

  const updatePost = async (updatedPostData: Partial<SocialMediaPost> & { id: string }) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to update posts.", variant: "destructive" });
      return;
    }
    try {
      const { id, ...dataToUpdate } = updatedPostData;
      const postDocRef = doc(db, `users/${currentUser.uid}/posts`, id);
      await updateDoc(postDocRef, {
        ...dataToUpdate,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Post Updated", description: `Post for ${dataToUpdate.platform || 'platform'} has been updated.` });
    } catch (error) {
      console.error("Error updating post:", error);
      toast({ title: "Error", description: "Could not update post.", variant: "destructive" });
    }
  };

  const deletePost = async (postId: string) => {
     if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to delete posts.", variant: "destructive" });
      return;
    }
    const postToDelete = posts.find(p => p.id === postId);
    try {
      const postDocRef = doc(db, `users/${currentUser.uid}/posts`, postId);
      await deleteDoc(postDocRef);
      if (postToDelete) {
        toast({ title: "Post Deleted", description: `Post for ${postToDelete.platform} has been deleted.`, variant: "destructive" });
      } else {
        toast({ title: "Post Deleted", description: "Post has been deleted.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({ title: "Error", description: "Could not delete post.", variant: "destructive" });
    }
  };

  const suggestTaskPrioritization = async () => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "Please log in.", variant: "destructive" });
      return;
    }
    if (tasks.length === 0) {
      toast({ title: "No Tasks", description: "Add some tasks before using AI prioritization.", variant: "default" });
      return;
    }
    setIsLoadingAi(true);
    try {
      const input: SuggestTaskPrioritizationInput = {
        tasks: tasks.map(task => ({
          title: task.title,
          description: task.description || '',
          // Ensure dueDate is valid, default to a far future date if not set, or handle appropriately
          dueDate: task.dueDate ? task.dueDate.toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          impact: task.priority, 
        })),
      };
      const result = await aiSuggestTaskPrioritization(input);
      if (result && result.prioritizedTasks) {
        const suggestions: PrioritizedTaskSuggestion[] = result.prioritizedTasks.map(pt => {
          // Find task by title - might be fragile if titles are not unique. ID would be better if AI can return it.
          const originalTask = tasks.find(t => t.title === pt.title); 
          return {
            taskId: originalTask?.id || '', // Fallback, but ID is crucial
            title: pt.title,
            currentPriority: originalTask?.priority || 'Medium',
            suggestedPriority: pt.priority as Priority, // Assuming AI returns valid Priority
            reason: pt.reason,
          };
        }).filter(s => s.taskId); // Ensure we only keep suggestions for tasks we could map
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
  
  const updateTaskPriority = async (taskId: string, priority: Priority) => {
     if (!currentUser) {
        toast({ title: "Not Authenticated", variant: "destructive" });
        return;
    }
    try {
        const taskDocRef = doc(db, `users/${currentUser.uid}/tasks`, taskId);
        await updateDoc(taskDocRef, {
            priority: priority,
            updatedAt: serverTimestamp()
        });
        // Optimistically update local state or rely on onSnapshot
        setPrioritizedSuggestions(prev => prev.filter(s => s.taskId !== taskId));
        toast({ title: "Priority Updated", description: `Task priority set to ${priority}.` });
    } catch (error) {
        console.error("Error updating task priority:", error);
        toast({ title: "Error", description: "Could not update task priority.", variant: "destructive" });
    }
  };

  const generateSocialMediaPost = async (input: GenerateSocialMediaPostInput): Promise<string | null> => {
    if (!currentUser) {
        toast({ title: "Not Authenticated", variant: "destructive" });
        return null;
    }
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
      generateSocialMediaPost, isLoadingAi, isLoadingData
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
