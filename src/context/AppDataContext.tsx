
"use client";

import type { Task, SocialMediaPost, Priority, PrioritizedTaskSuggestion, Status, Platform, PostStatus } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { suggestTaskPrioritization as aiSuggestTaskPrioritization, SuggestTaskPrioritizationInput } from '@/ai/flows/suggest-task-prioritization';
import { generateSocialMediaPost as aiGenerateSocialMediaPost, GenerateSocialMediaPostInput } from '@/ai/flows/generate-social-media-post';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { app as firebaseApp } from '@/lib/firebase'; // Import the initialized app
import { 
  getFirestore,
  collection, 
  query, 
  getDocs,
  // onSnapshot, // Temporarily disabled
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  Timestamp,
  FirestoreError,
  type Firestore
  // where // For potential future use if needed, not active now
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
        newObj[key] = convertTimestampsToDates(value); 
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
//     const value = obj[key];
//     if (value !== undefined) {
//       if (typeof value === 'object' && value !== null && !(value instanceof Date) && !(value instanceof Timestamp) && !Array.isArray(value)) {
//         newObj[key] = removeUndefinedProps(value);
//       } else {
//         newObj[key] = value;
//       }
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
  
  const [dbInstance, setDbInstance] = useState<Firestore | null>(null);

  useEffect(() => {
    console.log("AppDataContext: useEffect for DB init triggered. currentUser:", currentUser ? currentUser.uid : 'null');
    if (currentUser && currentUser.uid) {
      console.log("AppDataContext: currentUser available, initializing Firestore instance.");
      setDbInstance(getFirestore(firebaseApp));
    } else {
      console.log("AppDataContext: No currentUser, Firestore instance not initialized yet or user logged out.");
      setDbInstance(null); 
    }
  }, [currentUser]);


  useEffect(() => {
    console.log("AppDataContext: useEffect for data fetching triggered. currentUser:", currentUser ? currentUser.uid : 'null', "dbInstance:", dbInstance ? 'initialized' : 'null', "isLoadingData (start):", isLoadingData);

    if (!currentUser || !currentUser.uid || !dbInstance) {
      console.log("AppDataContext: No current user, UID, or DB instance. Clearing data.");
      setTasks([]);
      setPosts([]);
      setPrioritizedSuggestions([]);
      if (currentUser === null && !isLoadingData) { // Only set to false if we explicitly know there's no user and we weren't already loading
        // This prevents flicker if dbInstance is not yet ready but currentUser is.
      } else if (!currentUser) {
         setIsLoadingData(false);
      }
      return () => {}; 
    }
    
    console.log(`AppDataContext: Valid currentUser.uid detected: ${currentUser.uid} and DB instance initialized. Proceeding to fetch data using getDocs.`);
    
    // Set loading true only if we are actually going to fetch
    if (isLoadingData === false) setIsLoadingData(true);


    const fetchData = async () => {
      try {
        const tasksCollectionPath = `users/${currentUser.uid}/tasks`;
        console.log(`AppDataContext: Attempting getDocs for tasks at path: ${tasksCollectionPath}`);
        const qTasks = query(collection(dbInstance, tasksCollectionPath));
        const tasksSnapshot = await getDocs(qTasks);
        const fetchedTasks = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...convertTimestampsToDates(doc.data()),
        } as Task));
        setTasks(fetchedTasks);
        console.log(`AppDataContext: Tasks getDocs received for ${currentUser.uid}. Docs count: ${fetchedTasks.length}.`);

        const postsCollectionPath = `users/${currentUser.uid}/posts`;
        console.log(`AppDataContext: Attempting getDocs for posts at path: ${postsCollectionPath}`);
        const qPosts = query(collection(dbInstance, postsCollectionPath));
        const postsSnapshot = await getDocs(qPosts);
        const fetchedPosts = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...convertTimestampsToDates(doc.data()),
        } as SocialMediaPost));
        setPosts(fetchedPosts);
        console.log(`AppDataContext: Posts getDocs received for ${currentUser.uid}. Docs count: ${fetchedPosts.length}.`);

      } catch (error) {
        const firestoreError = error as FirestoreError;
        console.error(`AppDataContext: Error fetching data with getDocs. Code: ${firestoreError.code}, Message: ${firestoreError.message}`, firestoreError);
        toast({ title: "Error Fetching Data", description: `Could not fetch initial data: ${firestoreError.message}. Code: ${firestoreError.code}`, variant: "destructive" });
      } finally {
        setIsLoadingData(false);
        console.log("AppDataContext: Finished fetching data (getDocs), isLoadingData set to false.");
      }
    };

    fetchData();

    return () => {
      console.log("AppDataContext: Cleanup for data fetching useEffect (getDocs version).");
    };

  }, [currentUser, dbInstance, toast]); // Removed isLoadingData from deps to avoid re-triggering


  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    toast({ title: "Diagnostic Mode", description: "Task creation is temporarily disabled.", variant: "default" });
    console.log("AppDataContext: addTask called, but write operations are disabled for diagnostics.", taskData);
  };

  const updateTask = async (updatedTaskData: Partial<Task> & { id: string }) => {
    toast({ title: "Diagnostic Mode", description: "Task update is temporarily disabled.", variant: "default" });
    console.log("AppDataContext: updateTask called, but write operations are disabled for diagnostics.", updatedTaskData);
  };

  const deleteTask = async (taskId: string) => {
    toast({ title: "Diagnostic Mode", description: "Task deletion is temporarily disabled.", variant: "default" });
    console.log("AppDataContext: deleteTask called, but write operations are disabled for diagnostics.", taskId);
  };
  
  const updateTaskPriority = async (taskId: string, priority: Priority) => {
     toast({ title: "Diagnostic Mode", description: "Task priority update is temporarily disabled.", variant: "default" });
    console.log("AppDataContext: updateTaskPriority called, but write operations are disabled for diagnostics.", {taskId, priority});
  };

  const addPost = async (postData: Omit<SocialMediaPost, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    toast({ title: "Diagnostic Mode", description: "Post creation is temporarily disabled.", variant: "default" });
    console.log("AppDataContext: addPost called, but write operations are disabled for diagnostics.", postData);
  };

  const updatePost = async (updatedPostData: Partial<SocialMediaPost> & { id: string }) => {
     toast({ title: "Diagnostic Mode", description: "Post update is temporarily disabled.", variant: "default" });
    console.log("AppDataContext: updatePost called, but write operations are disabled for diagnostics.", updatedPostData);
  };

  const deletePost = async (postId: string) => {
    toast({ title: "Diagnostic Mode", description: "Post deletion is temporarily disabled.", variant: "default" });
    console.log("AppDataContext: deletePost called, but write operations are disabled for diagnostics.", postId);
  };
  
  const suggestTaskPrioritization = async () => {
    toast({ title: "Diagnostic Mode", description: "AI Task Prioritization is temporarily disabled.", variant: "default" });
    console.log("AppDataContext: suggestTaskPrioritization called, but AI features are effectively disabled due to Firestore diagnostic.");
  };
  
  const generateSocialMediaPost = async (input: GenerateSocialMediaPostInput): Promise<string | null> => {
    toast({ title: "Diagnostic Mode", description: "AI Post Generation is temporarily disabled.", variant: "default" });
    console.log("AppDataContext: generateSocialMediaPost called, but AI features are effectively disabled due to Firestore diagnostic.", input);
    return null;
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

    