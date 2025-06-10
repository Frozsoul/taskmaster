
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
  getDocs,
  // onSnapshot, // Temporarily disabled for diagnostics
  // addDoc, // Temporarily disabled
  // doc, // Temporarily disabled
  // updateDoc, // Temporarily disabled
  // deleteDoc, // Temporarily disabled
  // serverTimestamp, // Temporarily disabled
  Timestamp,
  FirestoreError
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

const convertTimestampsToDates = (data: Record<string, any>): Record<string, any> => {
  const newObj: Record<string, any> = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (value instanceof Timestamp) {
        newObj[key] = value.toDate();
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
        newObj[key] = convertTimestampsToDates(value); // Recurse for nested objects
      } else {
        newObj[key] = value;
      }
    }
  }
  return newObj;
};

// const removeUndefinedProps = (obj: Record<string, any>): Record<string, any> => {
//   const newObj: Record<string, any> = {};
//   Object.keys(obj).forEach(key => {
//     if (obj[key] !== undefined) {
//       newObj[key] = obj[key];
//     }
//   });
//   return newObj;
// };

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [prioritizedSuggestions, setPrioritizedSuggestions] = useState<PrioritizedTaskSuggestion[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log("AppDataContext: useEffect triggered. currentUser:", currentUser ? currentUser.uid : 'null', "Loading state:", isLoadingData);

    if (!currentUser || !currentUser.uid) {
      console.log("AppDataContext: No current user or UID is missing. Clearing data.");
      setTasks([]);
      setPosts([]);
      setPrioritizedSuggestions([]);
      setIsLoadingData(false);
      return; // No further operations if no user
    }

    console.log(`AppDataContext: Valid currentUser.uid detected: ${currentUser.uid}. Proceeding to fetch data using getDocs.`);
    setIsLoadingData(true);

    const fetchData = async () => {
      const tasksCollectionPath = `users/${currentUser.uid}/tasks`;
      const postsCollectionPath = `users/${currentUser.uid}/posts`;
      
      try {
        console.log(`AppDataContext: Attempting getDocs for tasks at path: ${tasksCollectionPath}`);
        const tasksQuery = query(collection(db, tasksCollectionPath));
        const tasksSnapshot = await getDocs(tasksQuery);
        console.log(`AppDataContext: Tasks getDocs received for ${currentUser.uid}. Docs count: ${tasksSnapshot.docs.length}.`);
        const fetchedTasks = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...convertTimestampsToDates(doc.data()),
        } as Task));
        setTasks(fetchedTasks);

        console.log(`AppDataContext: Attempting getDocs for posts at path: ${postsCollectionPath}`);
        const postsQuery = query(collection(db, postsCollectionPath));
        const postsSnapshot = await getDocs(postsQuery);
        console.log(`AppDataContext: Posts getDocs received for ${currentUser.uid}. Docs count: ${postsSnapshot.docs.length}.`);
        const fetchedPosts = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...convertTimestampsToDates(doc.data()),
        } as SocialMediaPost));
        setPosts(fetchedPosts);

        toast({ title: "Data Loaded", description: "Tasks and posts have been fetched.", variant: "default" });
      } catch (error) {
        const firestoreError = error as FirestoreError;
        console.error(`AppDataContext: Error fetching data with getDocs. Path: ${tasksCollectionPath} or ${postsCollectionPath}. Code: ${firestoreError.code}, Message: ${firestoreError.message}`, firestoreError);
        toast({ title: "Error Fetching Data", description: `Could not fetch data: ${firestoreError.message}. Check console.`, variant: "destructive" });
      } finally {
        setIsLoadingData(false);
        console.log("AppDataContext: Finished fetching data, isLoadingData set to false.");
      }
    };

    fetchData();

    // Real-time listeners are temporarily disabled for diagnostics.
    // const tasksCollectionPath = `users/${currentUser.uid}/tasks`;
    // console.log(`AppDataContext: (Listeners Disabled) Would listen to tasks at path: ${tasksCollectionPath}`);
    // const qTasks = query(collection(db, tasksCollectionPath));
    // const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
    //   console.log(`AppDataContext: Tasks snapshot received for ${currentUser.uid}. Docs count: ${snapshot.docs.length}. Has pending writes: ${snapshot.metadata.hasPendingWrites}`);
    //   const fetchedTasks = snapshot.docs.map(doc => ({
    //     id: doc.id,
    //     ...convertTimestampsToDates(doc.data()),
    //   } as Task));
    //   setTasks(fetchedTasks);
    // }, (error: FirestoreError) => {
    //   console.error(`AppDataContext: Error fetching tasks (onSnapshot) for path ${tasksCollectionPath}. Code: ${error.code}, Message: ${error.message}`, error);
    //   toast({ title: "Error Fetching Tasks", description: `Could not fetch tasks: ${error.message}. Check console.`, variant: "destructive" });
    // });

    // const postsCollectionPath = `users/${currentUser.uid}/posts`;
    // console.log(`AppDataContext: (Listeners Disabled) Would listen to posts at path: ${postsCollectionPath}`);
    // const qPosts = query(collection(db, postsCollectionPath));
    // const unsubscribePosts = onSnapshot(qPosts, (snapshot) => {
    //   console.log(`AppDataContext: Posts snapshot received for ${currentUser.uid}. Docs count: ${snapshot.docs.length}. Has pending writes: ${snapshot.metadata.hasPendingWrites}`);
    //   const fetchedPosts = snapshot.docs.map(doc => ({
    //     id: doc.id,
    //     ...convertTimestampsToDates(doc.data()),
    //   } as SocialMediaPost));
    //   setPosts(fetchedPosts);
    // }, (error: FirestoreError) => {
    //   console.error(`AppDataContext: Error fetching posts (onSnapshot) for path ${postsCollectionPath}. Code: ${error.code}, Message: ${error.message}`, error);
    //   toast({ title: "Error Fetching Posts", description: `Could not fetch posts: ${error.message}. Check console.`, variant: "destructive" });
    // });
    
    return () => {
      console.log(`AppDataContext: useEffect cleanup for user UID: ${currentUser?.uid}. (Listeners were disabled)`);
      // unsubscribeTasks();
      // unsubscribePosts();
    };
  }, [currentUser, toast]); // Removed isLoadingData from dependencies as it's set within this effect.

  // Write operations are temporarily disabled for diagnostics
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    toast({title: "Write Operations Disabled", description: "Task creation is temporarily disabled for diagnostics.", variant: "default"});
    console.warn("AppDataContext: addTask called, but write operations are disabled for diagnostics.", taskData);
    // Manually add to local state for UI testing if needed, but it won't persist.
    // const newTask = { ...taskData, id: `temp-${Date.now()}`, createdAt: new Date(), updatedAt: new Date(), userId: currentUser?.uid || "unknown" } as Task;
    // setTasks(prev => [...prev, newTask]);
    return Promise.resolve();
  };
  const updateTask = async (updatedTaskData: Partial<Task> & { id: string }) => {
     toast({title: "Write Operations Disabled", description: "Task updates are temporarily disabled for diagnostics.", variant: "default"});
     console.warn("AppDataContext: updateTask called, but write operations are disabled for diagnostics.", updatedTaskData);
    return Promise.resolve();
  };
  const deleteTask = async (taskId: string) => {
    toast({title: "Write Operations Disabled", description: "Task deletion is temporarily disabled for diagnostics.", variant: "default"});
    console.warn("AppDataContext: deleteTask called, but write operations are disabled for diagnostics.", taskId);
    return Promise.resolve();
  };
  const addPost = async (postData: Omit<SocialMediaPost, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
     toast({title: "Write Operations Disabled", description: "Post creation is temporarily disabled for diagnostics.", variant: "default"});
     console.warn("AppDataContext: addPost called, but write operations are disabled for diagnostics.", postData);
    return Promise.resolve();
  };
  const updatePost = async (updatedPostData: Partial<SocialMediaPost> & { id: string }) => {
     toast({title: "Write Operations Disabled", description: "Post updates are temporarily disabled for diagnostics.", variant: "default"});
     console.warn("AppDataContext: updatePost called, but write operations are disabled for diagnostics.", updatedPostData);
    return Promise.resolve();
  };
  const deletePost = async (postId: string) => {
     toast({title: "Write Operations Disabled", description: "Post deletion is temporarily disabled for diagnostics.", variant: "default"});
     console.warn("AppDataContext: deletePost called, but write operations are disabled for diagnostics.", postId);
    return Promise.resolve();
  };
   const updateTaskPriority = async (taskId: string, priority: Priority) => {
     toast({title: "Write Operations Disabled", description: "Task priority updates are temporarily disabled for diagnostics.", variant: "default"});
     console.warn("AppDataContext: updateTaskPriority called, but write operations are disabled for diagnostics.", taskId, priority);
    return Promise.resolve();
  };


  const suggestTaskPrioritization = async () => {
    if (!currentUser || !currentUser.uid) {
      toast({ title: "Not Authenticated", description: "Please log in.", variant: "destructive" });
      return;
    }
    if (tasks.length === 0) {
      toast({ title: "No Tasks", description: "Add some tasks before using AI prioritization.", variant: "default" });
      setPrioritizedSuggestions([]);
      return;
    }
    setIsLoadingAi(true);
    setPrioritizedSuggestions([]);
    try {
      const input: SuggestTaskPrioritizationInput = {
        tasks: tasks.map(task => ({
          title: task.title,
          description: task.description || '',
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
            taskId: originalTask?.id || `temp_id_${Math.random().toString(36).substr(2, 9)}`,
            title: pt.title,
            currentPriority: originalTask?.priority || 'Medium',
            suggestedPriority: pt.priority as Priority,
            reason: pt.reason,
          };
        }).filter(s => !s.taskId.startsWith('temp_id_'));
        
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
      console.error("AppDataContext: Error suggesting task prioritization. Error:", error);
      toast({ title: "AI Error", description: `Could not get task prioritization suggestions: ${error.message || 'Unknown AI error'}`, variant: "destructive" });
    } finally {
      setIsLoadingAi(false);
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
      console.error("AppDataContext: Error generating social media post. Error:", error);
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

    