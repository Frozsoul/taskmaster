
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { SocialMediaPost, Platform, PostStatus } from "@/types";
import { SOCIAL_PLATFORMS, POST_STATUSES } from "@/lib/constants";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const postSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS.filter(p => p !== 'General') as [Exclude<Platform, 'General'>, ...Exclude<Platform, 'General'>[]], { required_error: "Platform is required" }),
  content: z.string().min(1, "Content cannot be empty"),
  status: z.enum(POST_STATUSES as [PostStatus, ...PostStatus[]], { required_error: "Status is required" }),
  scheduledDate: z.date().optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  notes: z.string().optional(),
});

export type PostFormData = z.infer<typeof postSchema>;

interface PostFormProps {
  onSubmit: (data: PostFormData) => void;
  initialData?: SocialMediaPost;
  onCancel?: () => void;
}

export function PostForm({ onSubmit, initialData, onCancel }: PostFormProps) {
  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      platform: initialData?.platform || "X",
      content: initialData?.content || "",
      status: initialData?.status || "Draft",
      scheduledDate: initialData?.scheduledDate,
      imageUrl: initialData?.imageUrl || "",
      notes: initialData?.notes || "",
    },
  });

  const handleSubmit = (data: PostFormData) => {
    onSubmit(data);
    // form.reset(); // Do not reset if editing, handled by Dialog open state
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="platform"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Platform</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SOCIAL_PLATFORMS.filter(p => p !== 'General').map((platform) => (
                    <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea placeholder="Write your social media post here..." {...field} rows={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL (Optional)</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://example.com/image.png" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {POST_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scheduledDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Scheduled Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP HH:mm") : <span>Pick a date and time</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date(new Date().setDate(new Date().getDate()-1)) }
                      initialFocus
                    />
                    {/* Basic time picker - can be improved with dedicated component */}
                    <div className="p-2 border-t">
                      <Input 
                        type="time" 
                        defaultValue={field.value ? format(field.value, "HH:mm") : "09:00"}
                        onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(':');
                            const newDate = field.value ? new Date(field.value) : new Date();
                            newDate.setHours(parseInt(hours, 10));
                            newDate.setMinutes(parseInt(minutes, 10));
                            field.onChange(newDate);
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

         <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Internal notes about this post..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
          <Button type="submit">{initialData ? "Update Post" : "Create Post"}</Button>
        </div>
      </form>
    </Form>
  );
}
