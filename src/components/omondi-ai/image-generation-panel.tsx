"use client";

import { useState, ChangeEvent } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateImageFromDescription, improveImageGenerationPrompt, enhanceImage } from "@/ai/flows";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Download, Sparkles, Wand2, X } from "lucide-react";

const formSchema = z.object({
  description: z.string().optional(),
  image: z.any().optional(),
}).refine(data => !!data.description || !!data.image, {
  message: "Please provide a description or upload an image.",
  path: ["description"],
});

type FormValues = z.infer<typeof formSchema>;

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export function ImageGenerationPanel() {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      image: null,
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
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if(fileInput) fileInput.value = "";
  }

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setImageUrl(null);
    try {
      let result;
      if (data.image) {
        const imageBase64 = await toBase64(data.image);
        result = await enhanceImage({
          image: imageBase64,
          prompt: data.description,
        });
      } else if (data.description) {
        result = await generateImageFromDescription({ description: data.description });
      } else {
        toast({
          variant: "destructive",
          title: "Invalid Input",
          description: "Please provide a description or an image.",
        });
        setIsLoading(false);
        return;
      }

      if (result.imageUrl) {
        setImageUrl(result.imageUrl);
      } else {
        throw new Error("Image generation failed to produce an image.");
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate image. Please try a different prompt.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImprovePrompt = async () => {
    const currentPrompt = form.getValues("description");
    if (!currentPrompt) {
        toast({ title: "Prompt is empty", description: "Please enter a description to improve."})
        return;
    }
    setIsImproving(true);
    try {
        const result = await improveImageGenerationPrompt({ originalPrompt: currentPrompt });
        form.setValue("description", result.improvedPrompt, { shouldValidate: true });
        toast({ title: "Prompt Improved!", description: "Your prompt has been enhanced for better results."})
    } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Failed to Improve", description: "Could not improve the prompt."});
    } finally {
        setIsImproving(false);
    }
  }
  
  const image = form.watch("image");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Image Generation & Enhancement</CardTitle>
        <CardDescription>
          Describe the image you want to create, or upload an image to enhance.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={image ? "Describe how you'd like to improve the image..." : "A futuristic cityscape at sunset..."}
                      rows={3}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="relative flex items-center">
                <div className="flex-grow border-t border-muted"></div>
                <span className="flex-shrink mx-4 text-muted-foreground text-xs">OR</span>
                <div className="flex-grow border-t border-muted"></div>
            </div>

            <FormField
              control={form.control}
              name="image"
              render={() => (
                <FormItem>
                  <FormLabel>Upload an Image to Enhance</FormLabel>
                  <FormControl>
                    <Input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {imagePreview && (
              <div className="w-full aspect-square relative rounded-md overflow-hidden border">
                  <Image src={imagePreview} alt="Image preview" fill style={{objectFit: 'cover'}} data-ai-hint="uploaded image" />
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

          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2">
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              <Sparkles className="mr-2 h-4 w-4" />
              {isLoading ? "Generating..." : "Generate"}
            </Button>
            <Button type="button" variant="outline" onClick={handleImprovePrompt} disabled={isImproving || !!image} className="w-full sm:w-auto">
                <Wand2 className="mr-2 h-4 w-4" />
                {isImproving ? "Improving..." : "Improve Prompt"}
            </Button>
          </CardFooter>
        </form>
      </Form>
      {(isLoading || imageUrl) && (
        <CardContent>
          <div className="aspect-square w-full rounded-lg overflow-hidden border">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Skeleton className="w-full h-full" />
              </div>
            ) : imageUrl && (
              <div className="relative w-full h-full">
                <Image src={imageUrl} alt="Generated by Omondi AI" fill style={{ objectFit: 'contain' }} data-ai-hint="abstract art"/>
                <Button
                  asChild
                  size="icon"
                  className="absolute top-2 right-2 z-10"
                >
                  <a href={imageUrl} download="omondi-ai-generated.png">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
