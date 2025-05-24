
"use client";
import type { SocialMediaPost } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Twitter, Linkedin, Instagram, Edit3, Trash2, Send, CalendarClock, MoreVertical } from "lucide-react";
import Image from "next/image";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface PostCardProps {
  post: SocialMediaPost;
  onEdit: (post: SocialMediaPost) => void;
  onDelete: (postId: string) => void;
  onSchedule?: (post: SocialMediaPost) => void; // If scheduling is separate action
}

const platformIcons = {
  X: Twitter,
  LinkedIn: Linkedin,
  Instagram: Instagram,
  General: Send, // Fallback
};

export function PostCard({ post, onEdit, onDelete, onSchedule }: PostCardProps) {
  const PlatformIcon = platformIcons[post.platform] || Send;

  const getStatusBadgeVariant = (status: SocialMediaPost['status']) => {
    switch (status) {
      case 'Posted': return 'default';
      case 'Scheduled': return 'secondary';
      case 'Draft': return 'outline';
      case 'Needs Approval': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <PlatformIcon className="h-6 w-6 text-primary" />
            <CardTitle className="text-lg">{post.platform} Post</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(post)}>
                <Edit3 className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              {onSchedule && post.status !== 'Scheduled' && post.status !== 'Posted' && (
                <DropdownMenuItem onClick={() => onSchedule(post)}>
                  <CalendarClock className="mr-2 h-4 w-4" /> Schedule
                </DropdownMenuItem>
              )}
               <AlertDialog>
                <AlertDialogTrigger asChild>
                   <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                     <Trash2 className="mr-2 h-4 w-4" />Delete
                   </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this post.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(post.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription>
          Status: <Badge variant={getStatusBadgeVariant(post.status)}>{post.status}</Badge>
          {post.scheduledDate && (post.status === 'Scheduled' || post.status === 'Posted') && (
            <span className="ml-2 text-xs"> | Scheduled: {format(post.scheduledDate, "MMM dd, yyyy HH:mm")}</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {post.imageUrl && (
          <div className="mb-4 rounded-md overflow-hidden aspect-video relative">
            <Image src={post.imageUrl} alt={`Post image for ${post.platform}`} layout="fill" objectFit="cover" data-ai-hint={`${post.platform} post image`} />
          </div>
        )}
        <p className="text-sm whitespace-pre-line">{post.content}</p>
        {post.notes && <p className="text-xs text-muted-foreground mt-2">Notes: {post.notes}</p>}
      </CardContent>
      <CardFooter className="flex justify-between items-center text-xs text-muted-foreground border-t pt-4 mt-auto">
        <span>Created: {format(post.createdAt, "MMM dd, yyyy")}</span>
        <span>Updated: {format(post.updatedAt, "MMM dd, yyyy")}</span>
      </CardFooter>
    </Card>
  );
}
