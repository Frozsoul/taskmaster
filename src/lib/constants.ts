
import type { Priority, Status, Platform, PostStatus, Task, SocialMediaPost } from '@/types';

export const TASK_STATUSES: Status[] = ['To Do', 'In Progress', 'Done', 'Blocked'];
export const TASK_PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Urgent'];
export const SOCIAL_PLATFORMS: Platform[] = ['X', 'LinkedIn', 'Instagram', 'General'];
export const POST_STATUSES: PostStatus[] = ['Draft', 'Scheduled', 'Posted', 'Needs Approval'];

// Define static dates for consistency
const ثابتBaseDate = new Date('2024-06-01T00:00:00Z'); // A fixed "current" date for relative calculations if needed, but direct ISO strings are better.

export const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Draft Q3 Marketing Plan',
    description: 'Outline key campaigns and objectives for Q3.',
    status: 'In Progress',
    priority: 'High',
    // dueDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Original problematic line
    dueDate: new Date('2024-06-08T10:00:00Z'), // Static date
    assignee: 'Jane Doe',
    channel: 'General',
    // createdAt: new Date(), // Original
    // updatedAt: new Date(), // Original
    createdAt: new Date('2024-05-25T09:00:00Z'),
    updatedAt: new Date('2024-05-28T11:00:00Z'),
  },
  {
    id: '2',
    title: 'Schedule LinkedIn posts for next week',
    description: 'Prepare and schedule 5 posts for LinkedIn.',
    status: 'To Do',
    priority: 'Medium',
    // dueDate: new Date(new Date().setDate(new Date().getDate() + 3)), // Original
    dueDate: new Date('2024-06-04T14:30:00Z'), // Static date
    assignee: 'John Smith',
    channel: 'LinkedIn',
    // createdAt: new Date(), // Original
    // updatedAt: new Date(), // Original
    createdAt: new Date('2024-05-26T15:00:00Z'),
    updatedAt: new Date('2024-05-27T16:00:00Z'),
  },
  {
    id: '3',
    title: 'Review Instagram ad performance',
    description: 'Analyze the performance of current Instagram ads and suggest improvements.',
    status: 'To Do',
    priority: 'High',
    // dueDate: new Date(new Date().setDate(new Date().getDate() + 5)), // Original
    dueDate: new Date('2024-06-06T17:00:00Z'), // Static date
    assignee: 'Alice Brown',
    channel: 'Instagram',
    // createdAt: new Date(), // Original
    // updatedAt: new Date(), // Original
    createdAt: new Date('2024-05-24T10:20:00Z'),
    updatedAt: new Date('2024-05-29T09:10:00Z'),
  },
];

export const INITIAL_POSTS: SocialMediaPost[] = [
  {
    id: 'p1',
    platform: 'X',
    content: 'Excited to announce our new product launch next month! #NewProduct #Innovation',
    // scheduledDate: new Date(new Date().setDate(new Date().getDate() + 10)), // Original problematic line (example from error trace)
    scheduledDate: new Date('2024-06-11T12:18:00Z'), // Static date, matching one of the error values for testing if needed
    status: 'Scheduled',
    // createdAt: new Date(), // Original
    // updatedAt: new Date(), // Original
    createdAt: new Date('2024-05-20T08:00:00Z'),
    updatedAt: new Date('2024-05-21T10:30:00Z'),
  },
  {
    id: 'p2',
    platform: 'LinkedIn',
    content: 'Read our latest blog post on the future of AI in marketing. Link in bio.',
    status: 'Draft',
    // createdAt: new Date(), // Original
    // updatedAt: new Date(), // Original
    createdAt: new Date('2024-05-19T13:45:00Z'),
    updatedAt: new Date('2024-05-19T13:45:00Z'),
    // No scheduledDate for a draft post, so no dynamic date issue here unless one is added dynamically.
  },
];
