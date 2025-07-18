"use client";

import { useState, ChangeEvent } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateVideo } from "@/ai/flows/generate-video-flow";
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
import { Video, Sparkles, X, Download, FileAudio, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z
  .object({
    prompt: z.string().optional(),
    image: z.any().optional(),
    narration: z.string().optional(),
  })
  .refine((data) => !!data.image, {
    message: "Please upload an image to generate a video.",
    path: ["image"],
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
    if (!data.image) {
        toast({
            variant: "destructive",
            title: "Image Required",
            description: "You must upload an image to generate a video."
        });
        return;
    }

    setIsLoading(true);
    setVideoUrl(null);
    setAudioUrl(null);

    try {
      const imageBase64 = await toBase64(data.image);
      
      const result = await generateVideo({
        image: imageBase64,
        narration: data.narration,
        prompt: data.prompt
      });
      
      if (result.videoUrl) {
          setVideoUrl(result.videoUrl);
      }
      if (result.audioUrl) {
          setAudioUrl(result.audioUrl);
      }

      toast({
        title: "Video Generated!",
        description: "Your video has been created successfully.",
      });

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description:
          "Could not generate video. Please try again.",
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
          Generate a video from an image, with optional audio narration.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardContent className="space-y-4">
             <FormField
              control={form.control}
              name="image"
              render={() => (
                <FormItem>
                  <FormLabel>Upload an Image</FormLabel>
                  <FormControl>
                    <Input
                      id="video-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      required
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
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video Prompt (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A short description for the video's theme or action..."
                      rows={2}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
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
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Generating video... this may take a moment.</p>
                </div>
              </div>
            ) : videoUrl && (
              <div className="relative w-full h-full bg-black">
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full object-contain"
                />
                <Button
                  asChild
                  size="icon"
                  className="absolute top-2 right-2 z-10"
                >
                  <a href={videoUrl} download="omondi-ai-video.mp4">
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
