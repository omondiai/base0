"use client";

import { useState, ChangeEvent } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateNarration } from "@/ai/flows";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Video, Sparkles, Wand2, X, Download, FileAudio } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z
  .object({
    prompt: z.string().optional(),
    image: z.any().optional(),
    narration: z.string().optional(),
  })
  .refine((data) => !!data.prompt || !!data.image, {
    message: "Please provide a text prompt or upload an image.",
    path: ["prompt"],
  });

type FormValues = z.infer<typeof formSchema>;

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export function VideoGenerationPanel() {
  const { toast } = useToast();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      image: null,
      narration: "",
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("image", file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    form.setValue("image", null, { shouldValidate: true });
    setImagePreview(null);
    const fileInput = document.getElementById(
      "video-image-upload"
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setVideoUrl(null);
    setAudioUrl(null);

    try {
      if (data.narration) {
        const audioResult = await generateNarration({
          narrationText: data.narration,
        });
        if (audioResult.audioUrl) {
          setAudioUrl(audioResult.audioUrl);
        }
      }

      // Placeholder for actual video generation
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
      const placeholderVideo = "https://placehold.co/1280x720.png";
      setVideoUrl(placeholderVideo);

      toast({
        title: "Request Submitted",
        description: "Video generation is processing. Note: This is a placeholder.",
      });

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description:
          "Could not generate video or audio. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const image = form.watch("image");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Advanced Video Creator</CardTitle>
        <CardDescription>
          Generate a video from a text prompt or an image, with optional audio narration.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardContent className="space-y-4">
            <Alert>
              <Video className="h-4 w-4" />
              <AlertTitle>Video Generation Notice</AlertTitle>
              <AlertDescription>
                This feature is currently under development. A placeholder image will be generated instead of a video. Full video generation is coming soon.
              </AlertDescription>
            </Alert>
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A person giving a presentation..."
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-muted"></div>
              <span className="flex-shrink mx-4 text-muted-foreground text-xs">
                OR
              </span>
              <div className="flex-grow border-t border-muted"></div>
            </div>

            <FormField
              control={form.control}
              name="image"
              render={() => (
                <FormItem>
                  <FormLabel>Upload an Image for Image-to-Video</FormLabel>
                  <FormControl>
                    <Input
                      id="video-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {imagePreview && (
              <div className="w-full aspect-square relative rounded-md overflow-hidden border">
                <Image
                  src={imagePreview}
                  alt="Image preview for video"
                  fill
                  style={{ objectFit: "cover" }}
                  data-ai-hint="uploaded image"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 z-10 h-7 w-7"
                  onClick={clearImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="narration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audio Narration (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the text for the voiceover..."
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2">
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              <Sparkles className="mr-2 h-4 w-4" />
              {isLoading ? "Generating..." : "Generate Video"}
            </Button>
          </CardFooter>
        </form>
      </Form>
      {(isLoading || videoUrl) && (
        <CardContent className="space-y-4">
          <div className="aspect-video w-full rounded-lg overflow-hidden border">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Skeleton className="w-full h-full" />
              </div>
            ) : videoUrl && (
              <div className="relative w-full h-full">
                <Image
                  src={videoUrl}
                  alt="Generated Video by Omondi AI"
                  fill
                  style={{ objectFit: "contain" }}
                  data-ai-hint="video placeholder"
                />
                <Button
                  asChild
                  size="icon"
                  className="absolute top-2 right-2 z-10"
                >
                  <a href={videoUrl} download="omondi-ai-video-placeholder.png">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            )}
          </div>
          {audioUrl && !isLoading && (
             <div className="space-y-2">
                <Label>Generated Audio</Label>
                <audio controls src={audioUrl} className="w-full" />
                 <Button asChild variant="outline" size="sm">
                     <a href={audioUrl} download="omondi-ai-narration.wav">
                         <FileAudio className="mr-2 h-4 w-4" />
                         Download Audio
                     </a>
                 </Button>
             </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
