
"use client";

import type { Task, SocialMediaPost, Priority, PrioritizedTaskSuggestion, Status, Platform, PostStatus } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { suggestTaskPrioritization as aiSuggestTaskPrioritization, SuggestTaskPrioritizationInput } from '@/ai/flows/suggest-task-prioritization';
import { generateSocialMediaPost as aiGenerateSocialMediaPost, GenerateSocialMediaPostInput } from '@/ai/flows/generate-social-media-post';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  Timestamp,
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

const convertTimestampsToDates = (data: Record<string, any>): Record<string, any> => {
  const newObj: Record<string, any> = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (data[key] instanceof Timestamp) {
        newObj[key] = data[key].toDate();
      } else if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key]) && !(data[key] instanceof Date)) {
        newObj[key] = convertTimestampsToDates(data[key]);
      } else {
        newObj[key] = data[key];
      }
    }
  }
  return newObj;
};

const removeUndefinedProps = (obj: Record<string, any>): Record<string, any> => {
  const newObj: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (obj[key] !== undefined) {
        newObj[key] = obj[key];
      }
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
  const [isLoadingData, setIsLoadingData] = useState(true); // Start true until first load attempt
  const { toast } = useToast();

  useEffect(() => {
    console.log("AppDataContext: useEffect triggered. currentUser:", currentUser ? currentUser.uid : 'null');

    if (!currentUser || !currentUser.uid) { // More robust check for currentUser and its uid
      console.log("AppDataContext: No current user or UID is missing, clearing data and listeners.");
      setTasks([]);
      setPosts([]);
      setPrioritizedSuggestions([]);
      setIsLoadingData(false); // No data to load if no user
      // Return a cleanup function for listeners if they were somehow set previously
      return () => {
          // This function would ideally hold unsubscribe calls, but they're defined later.
          // If you have dedicated unsubscribe variables at a higher scope, call them here.
          console.log("AppDataContext: Cleanup from no user state.");
      };
    }

    console.log("AppDataContext: Valid currentUser.uid detected:", currentUser.uid, ".Proceeding to set up listeners.");
    setIsLoadingData(true); // Set loading true when we attempt to fetch

    const tasksCollectionPath = `users/${currentUser.uid}/tasks`;
    const postsCollectionPath = `users/${currentUser.uid}/posts`;

    console.log("AppDataContext: Listening to tasks at path:", tasksCollectionPath);
    const qTasks = query(collection(db, tasksCollectionPath)); 
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      console.log("AppDataContext: Tasks snapshot received. Docs count:", snapshot.docs.length);
      const fetchedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestampsToDates(doc.data()),
      } as Task));
      setTasks(fetchedTasks);
      setIsLoadingData(false); 
    }, (error: any) => { // Added 'any' type for error to access code/message
      console.error("AppDataContext: Error fetching tasks (onSnapshot). Path:", tasksCollectionPath, "Error Code:", error.code, "Message:", error.message, "Full Error:", error);
      toast({ title: "Error Fetching Tasks", description: `Could not fetch tasks: ${error.message}. Check console.`, variant: "destructive" });
      setIsLoadingData(false);
    });

    console.log("AppDataContext: Listening to posts at path:", postsCollectionPath);
    const qPosts = query(collection(db, postsCollectionPath));
    const unsubscribePosts = onSnapshot(qPosts, (snapshot) => {
      console.log("AppDataContext: Posts snapshot received. Docs count:", snapshot.docs.length);
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestampsToDates(doc.data()),
      } as SocialMediaPost));
      setPosts(fetchedPosts);
      // Note: isLoadingData might already be false from tasks, which is fine.
      // If tasks loaded but posts error, or vice-versa, isLoadingData should reflect overall status.
      // For simplicity, setting it false on first successful snapshot or any error.
      setIsLoadingData(false); 
    }, (error: any) => { // Added 'any' type for error to access code/message
      console.error("AppDataContext: Error fetching posts (onSnapshot). Path:", postsCollectionPath, "Error Code:", error.code, "Message:", error.message, "Full Error:", error);
      toast({ title: "Error Fetching Posts", description: `Could not fetch posts: ${error.message}. Check console.`, variant: "destructive" });
      setIsLoadingData(false);
    });

    return () => {
      console.log("AppDataContext: Cleaning up listeners for user UID:", currentUser?.uid);
      unsubscribeTasks();
      unsubscribePosts();
    };
  }, [currentUser, toast]); // `toast` is stable, `currentUser` is the key dependency.

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!currentUser || !currentUser.uid) {
      toast({ title: "Not Authenticated", description: "You must be logged in to add tasks.", variant: "destructive" });
      return;
    }
    try {
      const tasksCollectionPath = `users/${currentUser.uid}/tasks`;
      const cleanedTaskData = removeUndefinedProps(taskData);
      const newTaskPayload = {
        ...cleanedTaskData,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      console.log("AppDataContext: Adding task to path:", tasksCollectionPath, "Payload:", newTaskPayload);
      await addDoc(collection(db, tasksCollectionPath), newTaskPayload);
      toast({ title: "Task Added", description: `Task "${taskData.title}" has been successfully added.` });
    } catch (error: any) {
      console.error("AppDataContext: Error adding task. Path:", `users/${currentUser.uid}/tasks`, "Error Code:", error.code, "Message:", error.message, "Full Error:", error);
      toast({ title: "Error Adding Task", description: `Could not add task: ${error.message}`, variant: "destructive" });
    }
  };

  const updateTask = async (updatedTaskData: Partial<Task> & { id: string }) => {
     if (!currentUser || !currentUser.uid) {
      toast({ title: "Not Authenticated", description: "You must be logged in to update tasks.", variant: "destructive" });
      return;
    }
    try {
      const { id, ...restOfData } = updatedTaskData;
      const dataToUpdate = removeUndefinedProps(restOfData);
      
      const taskDocRef = doc(db, `users/${currentUser.uid}/tasks`, id);
      console.log("AppDataContext: Updating task at path:", taskDocRef.path, "Data:", dataToUpdate);
      await updateDoc(taskDocRef, {
        ...dataToUpdate,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Task Updated", description: `Task "${dataToUpdate.title || 'Task'}" has been successfully updated.` });
    } catch (error: any) {
      console.error("AppDataContext: Error updating task. Path:", `users/${currentUser.uid}/tasks/${updatedTaskData.id}`, "Error Code:", error.code, "Message:", error.message, "Full Error:", error);
      toast({ title: "Error Updating Task", description: `Could not update task: ${error.message}`, variant: "destructive" });
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!currentUser || !currentUser.uid) {
      toast({ title: "Not Authenticated", description: "You must be logged in to delete tasks.", variant: "destructive" });
      return;
    }
    const taskToDelete = tasks.find(t => t.id === taskId);
    try {
      const taskDocRef = doc(db, `users/${currentUser.uid}/tasks`, taskId);
      console.log("AppDataContext: Deleting task at path:", taskDocRef.path);
      await deleteDoc(taskDocRef);
      if (taskToDelete) {
        toast({ title: "Task Deleted", description: `Task "${taskToDelete.title}" has been deleted.`, variant: "destructive" });
      } else {
        toast({ title: "Task Deleted", description: "Task has been deleted.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("AppDataContext: Error deleting task. Path:", `users/${currentUser.uid}/tasks/${taskId}`, "Error Code:", error.code, "Message:", error.message, "Full Error:", error);
      toast({ title: "Error Deleting Task", description: `Could not delete task: ${error.message}`, variant: "destructive" });
    }
  };
  
  const addPost = async (postData: Omit<SocialMediaPost, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!currentUser || !currentUser.uid) {
      toast({ title: "Not Authenticated", description: "You must be logged in to add posts.", variant: "destructive" });
      return;
    }
    try {
      const postsCollectionPath = `users/${currentUser.uid}/posts`;
      const cleanedPostData = removeUndefinedProps(postData);
      const newPostPayload = {
        ...cleanedPostData,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      console.log("AppDataContext: Adding post to path:", postsCollectionPath, "Payload:", newPostPayload);
      await addDoc(collection(db, postsCollectionPath), newPostPayload);
      toast({ title: "Post Added", description: `A new post for ${postData.platform} has been added.` });
    } catch (error: any) {
      console.error("AppDataContext: Error adding post. Path:", `users/${currentUser.uid}/posts`, "Error Code:", error.code, "Message:", error.message, "Full Error:", error);
      toast({ title: "Error Adding Post", description: `Could not add post: ${error.message}`, variant: "destructive" });
    }
  };

  const updatePost = async (updatedPostData: Partial<SocialMediaPost> & { id: string }) => {
    if (!currentUser || !currentUser.uid) {
      toast({ title: "Not Authenticated", description: "You must be logged in to update posts.", variant: "destructive" });
      return;
    }
    try {
      const { id, ...restOfData } = updatedPostData;
      const dataToUpdate = removeUndefinedProps(restOfData);
      const postDocRef = doc(db, `users/${currentUser.uid}/posts`, id);
      console.log("AppDataContext: Updating post at path:", postDocRef.path, "Data:", dataToUpdate);
      await updateDoc(postDocRef, {
        ...dataToUpdate,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Post Updated", description: `Post for ${dataToUpdate.platform || 'platform'} has been updated.` });
    } catch (error: any) {
      console.error("AppDataContext: Error updating post. Path:", `users/${currentUser.uid}/posts/${updatedPostData.id}`, "Error Code:", error.code, "Message:", error.message, "Full Error:", error);
      toast({ title: "Error Updating Post", description: `Could not update post: ${error.message}`, variant: "destructive" });
    }
  };

  const deletePost = async (postId: string) => {
     if (!currentUser || !currentUser.uid) {
      toast({ title: "Not Authenticated", description: "You must be logged in to delete posts.", variant: "destructive" });
      return;
    }
    const postToDelete = posts.find(p => p.id === postId);
    try {
      const postDocRef = doc(db, `users/${currentUser.uid}/posts`, postId);
      console.log("AppDataContext: Deleting post at path:", postDocRef.path);
      await deleteDoc(postDocRef);
      if (postToDelete) {
        toast({ title: "Post Deleted", description: `Post for ${postToDelete.platform} has been deleted.`, variant: "destructive" });
      } else {
        toast({ title: "Post Deleted", description: "Post has been deleted.", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("AppDataContext: Error deleting post. Path:", `users/${currentUser.uid}/posts/${postId}`, "Error Code:", error.code, "Message:", error.message, "Full Error:", error);
      toast({ title: "Error Deleting Post", description: `Could not delete post: ${error.message}`, variant: "destructive" });
    }
  };

  const suggestTaskPrioritization = async () => {
    if (!currentUser || !currentUser.uid) {
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
          dueDate: task.dueDate ? task.dueDate.toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          impact: task.priority, 
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
    } catch (error: any) {
      console.error("AppDataContext: Error suggesting task prioritization. Error Code:", error.code, "Message:", error.message, "Full Error:", error);
      toast({ title: "AI Error", description: `Could not get task prioritization suggestions: ${error.message}`, variant: "destructive" });
    } finally {
      setIsLoadingAi(false);
    }
  };
  
  const updateTaskPriority = async (taskId: string, priority: Priority) => {
     if (!currentUser || !currentUser.uid) {
        toast({ title: "Not Authenticated", variant: "destructive" });
        return;
    }
    try {
        const taskDocRef = doc(db, `users/${currentUser.uid}/tasks`, taskId);
        await updateDoc(taskDocRef, {
            priority: priority,
            updatedAt: serverTimestamp()
        });
        setPrioritizedSuggestions(prev => prev.filter(s => s.taskId !== taskId));
        toast({ title: "Priority Updated", description: `Task priority set to ${priority}.` });
    } catch (error: any) {
        console.error("AppDataContext: Error updating task priority. Path:", `users/${currentUser.uid}/tasks/${taskId}`, "Error Code:", error.code, "Message:", error.message, "Full Error:", error);
        toast({ title: "Error Updating Priority", description: `Could not update task priority: ${error.message}`, variant: "destructive" });
    }
  };

  const generateSocialMediaPost = async (input: GenerateSocialMediaPostInput): Promise<string | null> => {
    if (!currentUser || !currentUser.uid) {
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
    } catch (error: any) {
      console.error("AppDataContext: Error generating social media post. Error Code:", error.code, "Message:", error.message, "Full Error:", error);
      toast({ title: "AI Error", description: `Could not generate social media post: ${error.message}`, variant: "destructive" });
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
