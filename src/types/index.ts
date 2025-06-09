
export type Status = 'To Do' | 'In Progress' | 'Done' | 'Blocked';
export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type Platform = 'X' | 'LinkedIn' | 'Instagram' | 'General';
export type PostStatus = 'Draft' | 'Scheduled' | 'Posted' | 'Needs Approval';

export interface Task {
  id: string;
  userId: string; // Added userId
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  dueDate?: Date;
  assignee?: string;
  channel: Platform; // For tasks related to specific platforms or general tasks
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialMediaPost {
  id: string;
  userId: string; // Added userId
  platform: Platform;
  content: string;
  scheduledDate?: Date;
  status: PostStatus;
  imageUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// For AI Task Prioritization
export interface PrioritizedTaskSuggestion {
  taskId: string;
  title: string;
  currentPriority: Priority;
  suggestedPriority: Priority;
  reason: string;
}
