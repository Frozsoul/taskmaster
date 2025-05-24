
"use client";
import { useState, useMemo } from "react";
import { useAppData } from "@/context/AppDataContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { GeneratePostForm } from "@/components/content/GeneratePostForm";
import { PostCard } from "@/components/content/PostCard";
import { PostForm, PostFormData } from "@/components/content/PostForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Share2, Wand2, Filter } from "lucide-react";
import type { SocialMediaPost, Platform, PostStatus } from "@/types";
import { SOCIAL_PLATFORMS, POST_STATUSES } from "@/lib/constants";

export default function ContentStudioPage() {
  const { posts, addPost, updatePost, deletePost, isLoadingAi } = useAppData();
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialMediaPost | undefined>(undefined);
  
  const [generatedContent, setGeneratedContent] = useState<{ platform: Platform, content: string} | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState<Platform | "All">("All");
  const [statusFilter, setStatusFilter] = useState<PostStatus | "All">("All");

  const handleEdit = (post: SocialMediaPost) => {
    setEditingPost(post);
    setIsFormOpen(true);
  };

  const handleDelete = (postId: string) => {
    deletePost(postId);
  };

  const handlePostGenerated = (platform: Platform, content: string) => {
    setGeneratedContent({ platform, content });
    setIsGeneratorOpen(false); // Close generator
    setEditingPost(undefined); // Ensure it's a new post
    setIsFormOpen(true); // Open manual post form with generated content
  };

  const handleSubmit = (data: PostFormData) => {
    if (editingPost) {
      updatePost({ ...editingPost, ...data });
    } else {
      addPost(data);
    }
    setIsFormOpen(false);
    setEditingPost(undefined);
    setGeneratedContent(null); // Clear generated content after use
  };
  
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (post.notes && post.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesPlatform = platformFilter === "All" || post.platform === platformFilter;
      const matchesStatus = statusFilter === "All" || post.status === statusFilter;
      return matchesSearch && matchesPlatform && matchesStatus;
    });
  }, [posts, searchTerm, platformFilter, statusFilter]);


  return (
    <div className="space-y-6">
      <PageHeader 
        title="Content Studio"
        description="Generate, manage, and schedule your social media content."
        icon={Share2}
        actionButtons={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsGeneratorOpen(true)}>
              <Wand2 className="mr-2 h-5 w-5" /> AI Generate Post
            </Button>
            <Button onClick={() => { setEditingPost(undefined); setGeneratedContent(null); setIsFormOpen(true); }}>
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Post
            </Button>
          </div>
        }
      />

      <div className="p-4 bg-card rounded-lg border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
           <div className="flex flex-col gap-1.5">
             <label htmlFor="platform-filter" className="text-sm font-medium text-muted-foreground">Platform</label>
             <Select value={platformFilter} onValueChange={(value) => setPlatformFilter(value as Platform | "All")}>
              <SelectTrigger id="platform-filter"><SelectValue placeholder="Filter by platform" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Platforms</SelectItem>
                {SOCIAL_PLATFORMS.filter(p=>p !== 'General').map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
           <div className="flex flex-col gap-1.5">
            <label htmlFor="status-filter" className="text-sm font-medium text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PostStatus | "All")}>
              <SelectTrigger id="status-filter"><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                {POST_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {filteredPosts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <Card className="col-span-full">
          <CardContent className="pt-6 text-center text-muted-foreground">
            No posts found. Try adjusting filters or create a new post.
          </CardContent>
        </Card>
      )}


      <Dialog open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>AI Post Generator</DialogTitle>
            <DialogDescription>
              Let AI help you craft engaging social media posts.
            </DialogDescription>
          </DialogHeader>
          <GeneratePostForm onPostGenerated={handlePostGenerated} />
        </DialogContent>
      </Dialog>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
        setIsFormOpen(isOpen);
        if (!isOpen) {
          setEditingPost(undefined);
          setGeneratedContent(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Edit Post" : (generatedContent ? "Finalize Generated Post" : "Create New Post")}</DialogTitle>
            <DialogDescription>
              {editingPost ? "Update the details of your social media post." : "Fill in the details for your new post."}
            </DialogDescription>
          </DialogHeader>
          <PostForm 
            onSubmit={handleSubmit} 
            initialData={editingPost || (generatedContent ? { ...generatedContent, status: 'Draft' } as SocialMediaPost : undefined)}
            onCancel={() => { setIsFormOpen(false); setEditingPost(undefined); setGeneratedContent(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
