
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
  FirestoreError, // Import FirestoreError for better typing
} from 'firebase/firestore';

interface AppDataContextType {
  tasks: Task[];
  posts: SocialMediaPost[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateTask: (updatedTaskData: Partial<Task> & { id: string }) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addPost: (post: Omit<SocialMediaPost, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updatePost: (updatedPostData: Partial<SocialMediaPost> & { id: string }) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  prioritizedSuggestions: PrioritizedTaskSuggestion[];
  suggestTaskPrioritization: () => Promise<void>;
  updateTaskPriority: (taskId: string, priority: Priority) => Promise<void>;
  generateSocialMediaPost: (input: GenerateSocialMediaPostInput) => Promise<string | null>;
  isLoadingAi: boolean;
  isLoadingData: boolean;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// Helper to convert Firestore Timestamps to JS Date objects
const convertTimestampsToDates = (data: Record<string, any>): Record<string, any> => {
  const newObj: Record<string, any> = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      if (data[key] instanceof Timestamp) {
        newObj[key] = data[key].toDate();
      } else if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key]) && !(data[key] instanceof Date)) {
        // Recursively convert nested objects, but not arrays or existing Date objects
        newObj[key] = convertTimestampsToDates(data[key]);
      } else {
        newObj[key] = data[key];
      }
    }
  }
  return newObj;
};

// Helper to remove undefined properties from an object before Firestore write
const removeUndefinedProps = (obj: Record<string, any>): Record<string, any> => {
  const newObj: Record<string, any> = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
};


export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [prioritizedSuggestions, setPrioritizedSuggestions] = useState<PrioritizedTaskSuggestion[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true); // Start true until first load attempt for a user
  const { toast } = useToast();

  useEffect(() => {
    console.log("AppDataContext: useEffect triggered. currentUser:", currentUser ? currentUser.uid : 'null', "Loading state:", isLoadingData);

    if (!currentUser || !currentUser.uid) {
      console.log("AppDataContext: No current user or UID is missing. Clearing data and stopping listeners.");
      setTasks([]);
      setPosts([]);
      setPrioritizedSuggestions([]);
      setIsLoadingData(false); // No data to load if no user
      return; // No listeners to set up
    }

    console.log(`AppDataContext: Valid currentUser.uid detected: ${currentUser.uid}. Proceeding to set up listeners.`);
    setIsLoadingData(true); 

    const tasksCollectionPath = `users/${currentUser.uid}/tasks`;
    const postsCollectionPath = `users/${currentUser.uid}/posts`;

    console.log(`AppDataContext: Listening to tasks at path: ${tasksCollectionPath}`);
    const qTasks = query(collection(db, tasksCollectionPath)); 
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      console.log(`AppDataContext: Tasks snapshot received for ${currentUser.uid}. Docs count: ${snapshot.docs.length}`);
      const fetchedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestampsToDates(doc.data()),
      } as Task));
      setTasks(fetchedTasks);
      setIsLoadingData(false); // Data loaded (or confirmed empty)
    }, (error: FirestoreError) => {
      console.error(`AppDataContext: Error fetching tasks (onSnapshot) for path ${tasksCollectionPath}. Code: ${error.code}, Message: ${error.message}`, error);
      toast({ title: "Error Fetching Tasks", description: `Could not fetch tasks: ${error.message}. Check console.`, variant: "destructive" });
      setIsLoadingData(false); // Error occurred
    });

    console.log(`AppDataContext: Listening to posts at path: ${postsCollectionPath}`);
    const qPosts = query(collection(db, postsCollectionPath));
    const unsubscribePosts = onSnapshot(qPosts, (snapshot) => {
      console.log(`AppDataContext: Posts snapshot received for ${currentUser.uid}. Docs count: ${snapshot.docs.length}`);
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestampsToDates(doc.data()),
      } as SocialMediaPost));
      setPosts(fetchedPosts);
      // Note: isLoadingData might already be false from tasks, which is fine.
      setIsLoadingData(false); // Data loaded (or confirmed empty)
    }, (error: FirestoreError) => {
      console.error(`AppDataContext: Error fetching posts (onSnapshot) for path ${postsCollectionPath}. Code: ${error.code}, Message: ${error.message}`, error);
      toast({ title: "Error Fetching Posts", description: `Could not fetch posts: ${error.message}. Check console.`, variant: "destructive" });
      setIsLoadingData(false); // Error occurred
    });

    return () => {
      console.log(`AppDataContext: Cleaning up listeners for user UID: ${currentUser?.uid}`);
      unsubscribeTasks();
      unsubscribePosts();
    };
  }, [currentUser, toast]); // `toast` is stable, `currentUser` is the key dependency.

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!currentUser || !currentUser.uid) {
      toast({ title: "Not Authenticated", description: "You must be logged in to add tasks.", variant: "destructive" });
      return;
    }
    const tasksCollectionPath = `users/${currentUser.uid}/tasks`;
    const cleanedTaskData = removeUndefinedProps(taskData);
    const newTaskPayload = {
      ...cleanedTaskData,
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      console.log(`AppDataContext: Adding task to path: ${tasksCollectionPath}`, "Payload:", newTaskPayload);
      await addDoc(collection(db, tasksCollectionPath), newTaskPayload);
      toast({ title: "Task Added", description: `Task "${taskData.title}" has been successfully added.` });
    } catch (error: any) { // Using 'any' for FirestoreError specifics
      const firestoreError = error as FirestoreError;
      console.error(`AppDataContext: Error adding task to ${tasksCollectionPath}. Code: ${firestoreError.code}, Message: ${firestoreError.message}`, firestoreError);
      toast({ title: "Error Adding Task", description: `Could not add task: ${firestoreError.message}`, variant: "destructive" });
    }
  };

  const updateTask = async (updatedTaskData: Partial<Task> & { id: string }) => {
     if (!currentUser || !currentUser.uid) {
      toast({ title: "Not Authenticated", description: "You must be logged in to update tasks.", variant: "destructive" });
      return;
    }
    const { id, ...restOfData } = updatedTaskData;
    const dataToUpdate = removeUndefinedProps(restOfData);
    const taskDocRef = doc(db, `users/${currentUser.uid}/tasks`, id);
    try {
      console.log(`AppDataContext: Updating task at path: ${taskDocRef.path}`, "Data:", dataToUpdate);
      await updateDoc(taskDocRef, {
        ...dataToUpdate,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Task Updated", description: `Task "${dataToUpdate.title || 'Task'}" has been successfully updated.` });
    } catch (error: any) {
      const firestoreError = error as FirestoreError;
      console.error(`AppDataContext: Error updating task at ${taskDocRef.path}. Code: ${firestoreError.code}, Message: ${firestoreError.message}`, firestoreError);
      toast({ title: "Error Updating Task", description: `Could not update task: ${firestoreError.message}`, variant: "destructive" });
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!currentUser || !currentUser.uid) {
      toast({ title: "Not Authenticated", description: "You must be logged in to delete tasks.", variant: "destructive" });
      return;
    }
    const taskToDelete = tasks.find(t => t.id === taskId);
    const taskDocRef = doc(db, `users/${currentUser.uid}/tasks`, taskId);
    try {
      console.log(`AppDataContext: Deleting task at path: ${taskDocRef.path}`);
      await deleteDoc(taskDocRef);
      toast({ title: "Task Deleted", description: `Task "${taskToDelete?.title || 'Task'}" has been deleted.`, variant: "destructive" });
    } catch (error: any) {
      const firestoreError = error as FirestoreError;
      console.error(`AppDataContext: Error deleting task at ${taskDocRef.path}. Code: ${firestoreError.code}, Message: ${firestoreError.message}`, firestoreError);
      toast({ title: "Error Deleting Task", description: `Could not delete task: ${firestoreError.message}`, variant: "destructive" });
    }
  };
  
  const addPost = async (postData: Omit<SocialMediaPost, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!currentUser || !currentUser.uid) {
      toast({ title: "Not Authenticated", description: "You must be logged in to add posts.", variant: "destructive" });
      return;
    }
    const postsCollectionPath = `users/${currentUser.uid}/posts`;
    const cleanedPostData = removeUndefinedProps(postData);
    const newPostPayload = {
      ...cleanedPostData,
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      console.log(`AppDataContext: Adding post to path: ${postsCollectionPath}`, "Payload:", newPostPayload);
      await addDoc(collection(db, postsCollectionPath), newPostPayload);
      toast({ title: "Post Added", description: `A new post for ${postData.platform} has been added.` });
    } catch (error: any) {
      const firestoreError = error as FirestoreError;
      console.error(`AppDataContext: Error adding post to ${postsCollectionPath}. Code: ${firestoreError.code}, Message: ${firestoreError.message}`, firestoreError);
      toast({ title: "Error Adding Post", description: `Could not add post: ${firestoreError.message}`, variant: "destructive" });
    }
  };

  const updatePost = async (updatedPostData: Partial<SocialMediaPost> & { id: string }) => {
    if (!currentUser || !currentUser.uid) {
      toast({ title: "Not Authenticated", description: "You must be logged in to update posts.", variant: "destructive" });
      return;
    }
    const { id, ...restOfData } = updatedPostData;
    const dataToUpdate = removeUndefinedProps(restOfData);
    const postDocRef = doc(db, `users/${currentUser.uid}/posts`, id);
    try {
      console.log(`AppDataContext: Updating post at path: ${postDocRef.path}`, "Data:", dataToUpdate);
      await updateDoc(postDocRef, {
        ...dataToUpdate,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Post Updated", description: `Post for ${dataToUpdate.platform || 'platform'} has been updated.` });
    } catch (error: any) {
      const firestoreError = error as FirestoreError;
      console.error(`AppDataContext: Error updating post at ${postDocRef.path}. Code: ${firestoreError.code}, Message: ${firestoreError.message}`, firestoreError);
      toast({ title: "Error Updating Post", description: `Could not update post: ${firestoreError.message}`, variant: "destructive" });
    }
  };

  const deletePost = async (postId: string) => {
     if (!currentUser || !currentUser.uid) {
      toast({ title: "Not Authenticated", description: "You must be logged in to delete posts.", variant: "destructive" });
      return;
    }
    const postToDelete = posts.find(p => p.id === postId);
    const postDocRef = doc(db, `users/${currentUser.uid}/posts`, postId);
    try {
      console.log(`AppDataContext: Deleting post at path: ${postDocRef.path}`);
      await deleteDoc(postDocRef);
      toast({ title: "Post Deleted", description: `Post for ${postToDelete?.platform || 'Post'} has been deleted.`, variant: "destructive" });
    } catch (error: any) {
      const firestoreError = error as FirestoreError;
      console.error(`AppDataContext: Error deleting post at ${postDocRef.path}. Code: ${firestoreError.code}, Message: ${firestoreError.message}`, firestoreError);
      toast({ title: "Error Deleting Post", description: `Could not delete post: ${firestoreError.message}`, variant: "destructive" });
    }
  };

  const suggestTaskPrioritization = async () => {
    if (!currentUser || !currentUser.uid) {
      toast({ title: "Not Authenticated", description: "Please log in.", variant: "destructive" });
      return;
    }
    if (tasks.length === 0) {
      toast({ title: "No Tasks", description: "Add some tasks before using AI prioritization.", variant: "default" });
      setPrioritizedSuggestions([]); // Clear previous suggestions if any
      return;
    }
    setIsLoadingAi(true);
    setPrioritizedSuggestions([]); // Clear previous suggestions
    try {
      const input: SuggestTaskPrioritizationInput = {
        tasks: tasks.map(task => ({
          title: task.title,
          description: task.description || '',
          // Ensure dueDate is a string; use a far future date if undefined for AI to process
          dueDate: task.dueDate ? task.dueDate.toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          impact: task.priority, 
        })),
      };
      console.log("AppDataContext: Suggesting task prioritization with input:", input);
      const result = await aiSuggestTaskPrioritization(input);
      if (result && result.prioritizedTasks) {
        const suggestions: PrioritizedTaskSuggestion[] = result.prioritizedTasks.map(pt => {
          const originalTask = tasks.find(t => t.title === pt.title); 
          return {
            taskId: originalTask?.id || `temp_id_${Math.random().toString(36).substr(2, 9)}`, // Handle if task not found by title
            title: pt.title,
            currentPriority: originalTask?.priority || 'Medium',
            suggestedPriority: pt.priority as Priority, 
            reason: pt.reason,
          };
        }).filter(s => s.taskId.startsWith('temp_id_') ? false : true); // Filter out tasks that couldn't be matched by title
        
        setPrioritizedSuggestions(suggestions);
        if (suggestions.length > 0) {
            toast({ title: "Prioritization Suggested", description: "AI has suggested task priorities." });
        } else if (result.prioritizedTasks.length > 0) {
            toast({ title: "Prioritization Note", description: "AI provided suggestions, but some could not be matched to existing tasks by title.", variant: "default" });
        } else {
            toast({ title: "No Suggestions", description: "AI did not provide any new prioritization suggestions.", variant: "default" });
        }
      } else {
         toast({ title: "No Suggestions", description: "AI did not return any prioritization suggestions.", variant: "default" });
      }
    } catch (error: any) {
      console.error("AppDataContext: Error suggesting task prioritization.", error);
      toast({ title: "AI Error", description: `Could not get task prioritization suggestions: ${error.message || 'Unknown AI error'}`, variant: "destructive" });
    } finally {
      setIsLoadingAi(false);
    }
  };
  
  const updateTaskPriority = async (taskId: string, priority: Priority) => {
     if (!currentUser || !currentUser.uid) {
        toast({ title: "Not Authenticated", variant: "destructive" });
        return;
    }
    const taskDocRef = doc(db, `users/${currentUser.uid}/tasks`, taskId);
    try {
        console.log(`AppDataContext: Updating task priority for ${taskId} to ${priority} at path: ${taskDocRef.path}`);
        await updateDoc(taskDocRef, {
            priority: priority,
            updatedAt: serverTimestamp()
        });
        // Remove the suggestion for this task, as it's now acted upon (or dismissed by setting current priority)
        setPrioritizedSuggestions(prev => prev.filter(s => s.taskId !== taskId));
        toast({ title: "Priority Updated", description: `Task priority set to ${priority}.` });
    } catch (error: any) {
        const firestoreError = error as FirestoreError;
        console.error(`AppDataContext: Error updating task priority for ${taskId} at ${taskDocRef.path}. Code: ${firestoreError.code}, Message: ${firestoreError.message}`, firestoreError);
        toast({ title: "Error Updating Priority", description: `Could not update task priority: ${firestoreError.message}`, variant: "destructive" });
    }
  };

  const generateSocialMediaPost = async (input: GenerateSocialMediaPostInput): Promise<string | null> => {
    if (!currentUser || !currentUser.uid) {
        toast({ title: "Not Authenticated", variant: "destructive" });
        return null;
    }
    setIsLoadingAi(true);
    try {
      console.log("AppDataContext: Generating social media post with input:", input);
      const result = await aiGenerateSocialMediaPost(input);
      if (result && result.post) {
        toast({ title: "Post Generated", description: `AI has generated a post for ${input.platform}.` });
        return result.post;
      }
      toast({ title: "Post Generation Failed", description: "AI did not return post content.", variant: "default" });
      return null;
    } catch (error: any) {
      console.error("AppDataContext: Error generating social media post.", error);
      toast({ title: "AI Error", description: `Could not generate social media post: ${error.message || 'Unknown AI error'}`, variant: "destructive" });
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

    