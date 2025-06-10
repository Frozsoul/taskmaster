
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
  // getDocs, // Replaced by onSnapshot for real-time
  onSnapshot,
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  Timestamp,
  FirestoreError,
  where // For potential future use if needed, not active now
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

const removeUndefinedProps = (obj: Record<string, any>): Record<string, any> => {
  const newObj: Record<string, any> = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined) {
      // If the value is an object (but not a Date or Timestamp, which are handled by serverTimestamp or already converted), recurse.
      // This is important for nested objects if any, though not directly used in current Task/Post types.
      if (typeof value === 'object' && value !== null && !(value instanceof Date) && !(value instanceof Timestamp) && !Array.isArray(value)) {
        newObj[key] = removeUndefinedProps(value);
      } else {
        newObj[key] = value;
      }
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
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log("AppDataContext: useEffect triggered. currentUser:", currentUser ? currentUser.uid : 'null', "isLoadingData:", isLoadingData);

    if (!currentUser || !currentUser.uid) {
      console.log("AppDataContext: No current user or UID is missing. Clearing data and stopping listeners.");
      setTasks([]);
      setPosts([]);
      setPrioritizedSuggestions([]);
      setIsLoadingData(false); 
      return;
    }
    
    console.log(`AppDataContext: Valid currentUser.uid detected: ${currentUser.uid}. Proceeding to set up listeners.`);
    setIsLoadingData(true);

    const tasksCollectionPath = `users/${currentUser.uid}/tasks`;
    console.log(`AppDataContext: Listening to tasks at path: ${tasksCollectionPath}`);
    const qTasks = query(collection(db, tasksCollectionPath));
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      console.log(`AppDataContext: Tasks snapshot received for ${currentUser.uid}. Docs count: ${snapshot.docs.length}. Has pending writes: ${snapshot.metadata.hasPendingWrites}`);
      const fetchedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestampsToDates(doc.data()),
      } as Task));
      setTasks(fetchedTasks);
      setIsLoadingData(false); // Consider data loaded after first successful snapshot
    }, (error: FirestoreError) => {
      console.error(`AppDataContext: Error fetching tasks (onSnapshot) for path ${tasksCollectionPath}. Code: ${error.code}, Message: ${error.message}`, error);
      toast({ title: "Error Fetching Tasks", description: `Could not fetch tasks: ${error.message}. Code: ${error.code}`, variant: "destructive" });
      setIsLoadingData(false);
    });

    const postsCollectionPath = `users/${currentUser.uid}/posts`;
    console.log(`AppDataContext: Listening to posts at path: ${postsCollectionPath}`);
    const qPosts = query(collection(db, postsCollectionPath));
    const unsubscribePosts = onSnapshot(qPosts, (snapshot) => {
      console.log(`AppDataContext: Posts snapshot received for ${currentUser.uid}. Docs count: ${snapshot.docs.length}. Has pending writes: ${snapshot.metadata.hasPendingWrites}`);
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestampsToDates(doc.data()),
      } as SocialMediaPost));
      setPosts(fetchedPosts);
      // Consider data loaded after tasks are loaded or manage separately if posts are critical for initial view
    }, (error: FirestoreError) => {
      console.error(`AppDataContext: Error fetching posts (onSnapshot) for path ${postsCollectionPath}. Code: ${error.code}, Message: ${error.message}`, error);
      toast({ title: "Error Fetching Posts", description: `Could not fetch posts: ${error.message}. Code: ${error.code}`, variant: "destructive" });
    });
    
    return () => {
      console.log(`AppDataContext: Cleaning up listeners for user UID: ${currentUser?.uid}`);
      unsubscribeTasks();
      unsubscribePosts();
    };
  }, [currentUser, toast]);


  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!currentUser || !currentUser.uid) {
      toast({ title: "Not Authenticated", description: "Please log in to add tasks.", variant: "destructive" });
      return;
    }
    const tasksCollectionPath = `users/${currentUser.uid}/tasks`;
    const fullTaskData = { 
      ...taskData, 
      userId: currentUser.uid, 
      createdAt: serverTimestamp(), 
      updatedAt: serverTimestamp() 
    };
    const cleanedTaskData = removeUndefinedProps(fullTaskData);
    console.log(`AppDataContext: Adding task to path: ${tasksCollectionPath} Payload:`, cleanedTaskData);
    try {
      await addDoc(collection(db, tasksCollectionPath), cleanedTaskData);
      toast({ title: "Task Added", description: "Your new task has been saved." });
    } catch (error) {
      const firestoreError = error as FirestoreError;
      console.error(`AppDataContext: Error adding task. Code: ${firestoreError.code}, Message: ${firestoreError.message}`, firestoreError);
      toast({ title: "Error Adding Task", description: `Could not save task: ${firestoreError.message}. Code: ${firestoreError.code}`, variant: "destructive" });
    }
  };

  const updateTask = async (updatedTaskData: Partial<Task> & { id: string }) => {
     if (!currentUser || !currentUser.uid) {
      toast({ title: "Not Authenticated", variant: "destructive" });
      return;
    }
    const { id, ...dataToUpdate } = updatedTaskData;
    const taskRef = doc(db, `users/${currentUser.uid}/tasks`, id);
    const updatePayload = { ...dataToUpdate, updatedAt: serverTimestamp() };
    const cleanedUpdatePayload = removeUndefinedProps(updatePayload);
    console.log(`AppDataContext: Updating task at path: ${taskRef.path} Payload:`, cleanedUpdatePayload);
    try {
      await updateDoc(taskRef, cleanedUpdatePayload);
      toast({ title: "Task Updated", description: "Your task has been updated." });
    } catch (error) {
      const firestoreError = error as FirestoreError;
      console.error(`AppDataContext: Error updating task. Code: ${firestoreError.code}, Message: ${firestoreError.message}`, firestoreError);
      toast({ title: "Error Updating Task", description: `Could not update task: ${firestoreError.message}. Code: ${firestoreError.code}`, variant: "destructive" });
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!currentUser || !currentUser.uid) {
      toast({ title: "Not Authenticated", variant: "destructive" });
      return;
    }
    const taskRef = doc(db, `users/${currentUser.uid}/tasks`, taskId);
    console.log(`AppDataContext: Deleting task at path: ${taskRef.path}`);
    try {
      await deleteDoc(taskRef);
      toast({ title: "Task Deleted", description: "The task has been removed." });
    } catch (error) {
      const firestoreError = error as FirestoreError;
      console.error(`AppDataContext: Error deleting task. Code: ${firestoreError.code}, Message: ${firestoreError.message}`, firestoreError);
      toast({ title: "Error Deleting Task", description: `Could not delete task: ${firestoreError.message}. Code: ${firestoreError.code}`, variant: "destructive" });
    }
  };
  
  const updateTaskPriority = async (taskId: string, priority: Priority) => {
    if (!currentUser || !currentUser.uid) {
      toast({ title: "Not Authenticated", variant: "destructive" });
      return;
    }
    const taskRef = doc(db, `users/${currentUser.uid}/tasks`, taskId);
    const updatePayload = { priority, updatedAt: serverTimestamp() };
    console.log(`AppDataContext: Updating task priority at path: ${taskRef.path} Payload:`, updatePayload);
    try {
      await updateDoc(taskRef, updatePayload);
      setPrioritizedSuggestions(prev => prev.filter(s => s.taskId !== taskId));
      toast({ title: "Task Priority Updated", description: `Task priority set to ${priority}.` });
    } catch (error) {
      const firestoreError = error as FirestoreError;
      console.error(`AppDataContext: Error updating task priority. Code: ${firestoreError.code}, Message: ${firestoreError.message}`, firestoreError);
      toast({ title: "Error Updating Priority", description: `Could not update priority: ${firestoreError.message}. Code: ${firestoreError.code}`, variant: "destructive" });
    }
  };

  const addPost = async (postData: Omit<SocialMediaPost, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!currentUser || !currentUser.uid) {
      toast({ title: "Not Authenticated", variant: "destructive" });
      return;
    }
    const postsCollectionPath = `users/${currentUser.uid}/posts`;
    const fullPostData = { 
      ...postData, 
      userId: currentUser.uid, 
      createdAt: serverTimestamp(), 
      updatedAt: serverTimestamp() 
    };
    const cleanedPostData = removeUndefinedProps(fullPostData);
    console.log(`AppDataContext: Adding post to path: ${postsCollectionPath} Payload:`, cleanedPostData);
    try {
      await addDoc(collection(db, postsCollectionPath), cleanedPostData);
      toast({ title: "Post Added", description: "Your new post has been saved." });
    } catch (error) {
      const firestoreError = error as FirestoreError;
      console.error(`AppDataContext: Error adding post. Code: ${firestoreError.code}, Message: ${firestoreError.message}`, firestoreError);
      toast({ title: "Error Adding Post", description: `Could not save post: ${firestoreError.message}. Code: ${firestoreError.code}`, variant: "destructive" });
    }
  };

  const updatePost = async (updatedPostData: Partial<SocialMediaPost> & { id: string }) => {
    if (!currentUser || !currentUser.uid) {
      toast({ title: "Not Authenticated", variant: "destructive" });
      return;
    }
    const { id, ...dataToUpdate } = updatedPostData;
    const postRef = doc(db, `users/${currentUser.uid}/posts`, id);
    const updatePayload = { ...dataToUpdate, updatedAt: serverTimestamp() };
    const cleanedUpdatePayload = removeUndefinedProps(updatePayload);
    console.log(`AppDataContext: Updating post at path: ${postRef.path} Payload:`, cleanedUpdatePayload);
    try {
      await updateDoc(postRef, cleanedUpdatePayload);
      toast({ title: "Post Updated", description: "Your post has been updated." });
    } catch (error) {
      const firestoreError = error as FirestoreError;
      console.error(`AppDataContext: Error updating post. Code: ${firestoreError.code}, Message: ${firestoreError.message}`, firestoreError);
      toast({ title: "Error Updating Post", description: `Could not update post: ${firestoreError.message}. Code: ${firestoreError.code}`, variant: "destructive" });
    }
  };

  const deletePost = async (postId: string) => {
    if (!currentUser || !currentUser.uid) {
      toast({ title: "Not Authenticated", variant: "destructive" });
      return;
    }
    const postRef = doc(db, `users/${currentUser.uid}/posts`, postId);
    console.log(`AppDataContext: Deleting post at path: ${postRef.path}`);
    try {
      await deleteDoc(postRef);
      toast({ title: "Post Deleted", description: "The post has been removed." });
    } catch (error) {
      const firestoreError = error as FirestoreError;
      console.error(`AppDataContext: Error deleting post. Code: ${firestoreError.code}, Message: ${firestoreError.message}`, firestoreError);
      toast({ title: "Error Deleting Post", description: `Could not delete post: ${firestoreError.message}. Code: ${firestoreError.code}`, variant: "destructive" });
    }
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
            taskId: originalTask?.id || `temp_id_${Math.random().toString(36).substr(2, 9)}`, // Should always find an ID
            title: pt.title,
            currentPriority: originalTask?.priority || 'Medium',
            suggestedPriority: pt.priority as Priority,
            reason: pt.reason,
          };
        }).filter(s => !s.taskId.startsWith('temp_id_')); // Filter out any temp IDs if a task wasn't matched
        
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
    