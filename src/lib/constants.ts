import type { Priority, Status, Platform, PostStatus, Task, SocialMediaPost } from '@/types';

export const TASK_STATUSES: Status[] = ['To Do', 'In Progress', 'Done', 'Blocked'];
export const TASK_PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Urgent'];
export const SOCIAL_PLATFORMS: Platform[] = ['X', 'LinkedIn', 'Instagram', 'General'];
export const POST_STATUSES: PostStatus[] = ['Draft', 'Scheduled', 'Posted', 'Needs Approval'];

export const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Draft Q3 Marketing Plan',
    description: 'Outline key campaigns and objectives for Q3.',
    status: 'In Progress',
    priority: 'High',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    assignee: 'Jane Doe',
    channel: 'General',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Schedule LinkedIn posts for next week',
    description: 'Prepare and schedule 5 posts for LinkedIn.',
    status: 'To Do',
    priority: 'Medium',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 3)),
    assignee: 'John Smith',
    channel: 'LinkedIn',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    title: 'Review Instagram ad performance',
    description: 'Analyze the performance of current Instagram ads and suggest improvements.',
    status: 'To Do',
    priority: 'High',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
    assignee: 'Alice Brown',
    channel: 'Instagram',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const INITIAL_POSTS: SocialMediaPost[] = [
  {
    id: 'p1',
    platform: 'X',
    content: 'Excited to announce our new product launch next month! #NewProduct #Innovation',
    scheduledDate: new Date(new Date().setDate(new Date().getDate() + 10)),
    status: 'Scheduled',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'p2',
    platform: 'LinkedIn',
    content: 'Read our latest blog post on the future of AI in marketing. Link in bio.',
    status: 'Draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
