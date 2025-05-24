
"use client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SOCIAL_PLATFORMS } from "@/lib/constants";
import type { Platform } from "@/types";
import { useAppData } from "@/context/AppDataContext";
import { Sparkles } from "lucide-react";
import type { GenerateSocialMediaPostInput } from "@/ai/flows/generate-social-media-post";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const generatePostSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS.filter(p => p !== 'General') as [Exclude<Platform, 'General'>, ...Exclude<Platform, 'General'>[]], { required_error: "Platform is required" }),
  topic: z.string().min(5, "Topic must be at least 5 characters"),
  tone: z.string().min(3, "Tone is required (e.g., Professional, Casual, Witty)"),
});

type GeneratePostFormData = z.infer<typeof generatePostSchema>;

interface GeneratePostFormProps {
  onPostGenerated: (platform: Platform, content: string) => void;
}

export function GeneratePostForm({ onPostGenerated }: GeneratePostFormProps) {
  const { generateSocialMediaPost, isLoadingAi } = useAppData();
  const form = useForm<GeneratePostFormData>({
    resolver: zodResolver(generatePostSchema),
    defaultValues: {
      platform: "X",
      topic: "",
      tone: "Professional",
    },
  });

  const handleSubmit = async (data: GeneratePostFormData) => {
    const input: GenerateSocialMediaPostInput = {
        platform: data.platform as 'X' | 'LinkedIn' | 'Instagram', // Cast needed due to Zod enum from filtered array
        topic: data.topic,
        tone: data.tone,
    };
    const generatedContent = await generateSocialMediaPost(input);
    if (generatedContent) {
      onPostGenerated(data.platform, generatedContent);
      form.resetField("topic"); // Optionally reset topic
    }
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
          name="topic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Topic / Idea</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Benefits of our new product feature" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="tone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tone</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Professional, Casual, Witty" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoadingAi} className="w-full">
          <Sparkles className="mr-2 h-5 w-5" /> 
          {isLoadingAi ? "Generating..." : "Generate Post"}
        </Button>
      </form>
    </Form>
  );
}
