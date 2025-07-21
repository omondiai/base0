"use client";

import { useState, ChangeEvent, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateImageFromDescription, enhanceImage, improveImageGenerationPrompt, generateImageWithCharacter } from "@/ai/flows";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { Character } from "./character-panel";


const formSchema = z.object({
  description: z.string().optional(),
  images: z.array(z.any()).optional(),
  characterId: z.string().optional(),
}).refine(data => !!data.description || (data.images && data.images.length > 0), {
  message: "Please provide a description.",
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
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    async function fetchCharacters() {
      try {
        const response = await fetch('/api/characters');
        if (!response.ok) throw new Error("Failed to fetch characters");
        const data = await response.json();
        setCharacters(data.characters);
      } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Error", description: "Could not load saved characters."});
      }
    }
    fetchCharacters();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      images: [],
      characterId: undefined,
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const currentFiles = form.getValues('images') || [];
      const newFiles = Array.from(files);
      const combinedFiles = [...currentFiles, ...newFiles];
      
      form.setValue("images", combinedFiles, { shouldValidate: true });
      form.setValue("characterId", undefined); // Can't use character and upload enhancement images

      const newPreviews: string[] = [];
      const filePromises = newFiles.map(file => {
        return new Promise<void>(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => {
            newPreviews.push(reader.result as string);
            resolve();
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(filePromises).then(() => {
        setImagePreviews(prev => [...prev, ...newPreviews]);
      });
    }
  };

  const clearImage = (indexToRemove: number) => {
    const currentFiles = form.getValues('images') || [];
    const updatedFiles = currentFiles.filter((_, index) => index !== indexToRemove);
    form.setValue("images", updatedFiles, { shouldValidate: true });

    const updatedPreviews = imagePreviews.filter((_, index) => index !== indexToRemove);
    setImagePreviews(updatedPreviews);

    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if(fileInput) fileInput.value = "";
  }
  
  const cleanup = () => {
    form.setValue("images", [], { shouldValidate: true });
    setImagePreviews([]);
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if(fileInput) fileInput.value = "";
  }

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setImageUrl(null);

    if (!data.description) {
      toast({ variant: "destructive", title: "Description Required", description: "Please enter a prompt for the image." });
      setIsLoading(false);
      return;
    }

    try {
      let result;
      if (data.characterId) {
        const selectedCharacter = characters.find(c => c._id === data.characterId);
        if (!selectedCharacter) throw new Error("Selected character not found.");
        
        result = await generateImageWithCharacter({
          prompt: data.description,
          characterImages: selectedCharacter.images.map(img => img.dataUri),
        });

      } else if (data.images && data.images.length > 0) {
        const imageBase64s = await Promise.all(data.images.map(toBase64));
        result = await enhanceImage({
          images: imageBase64s,
          prompt: data.description,
        });
      } else {
        result = await generateImageFromDescription({ description: data.description });
      }

      if (result.imageUrl) {
        setImageUrl(result.imageUrl);
        cleanup();
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
  
  const images = form.watch("images");
  const characterId = form.watch("characterId");
  const hasImages = images && images.length > 0;
  const hasMultipleImages = hasImages && images.length > 1;
  const disableCharacterSelect = hasImages;
  const disableImageUpload = !!characterId;

  const getPlaceholder = () => {
    if (characterId) return "e.g., 'photo of my character reading a book in a cafe'";
    if (hasMultipleImages) return "e.g., 'Combine these into a photo grid'";
    if (hasImages) return "e.g., 'Make this photo look more vibrant'";
    return "A futuristic cityscape at sunset...";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Image Generation & Enhancement</CardTitle>
        <CardDescription>
          Use a character, describe a new image, or upload images to enhance.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="characterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Use Saved Character (Optional)</FormLabel>
                  <Select onValueChange={(value) => {
                      field.onChange(value);
                      cleanup(); // Clear uploaded images if a character is selected
                  }} defaultValue={field.value} disabled={disableCharacterSelect}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a character" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {characters.map(char => (
                        <SelectItem key={char._id} value={char._id}>
                          {char.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={getPlaceholder()}
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
                <span className="flex-shrink mx-4 text-muted-foreground text-xs">OR UPLOAD (ENHANCE)</span>
                <div className="flex-grow border-t border-muted"></div>
            </div>

            <FormField
              control={form.control}
              name="images"
              render={() => (
                <FormItem>
                  <FormLabel>Upload Images to Enhance/Combine</FormLabel>
                  <FormControl>
                    <Input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} multiple disabled={disableImageUpload} />
                  </FormControl>
                  {disableImageUpload && <p className="text-xs text-muted-foreground">Cannot upload images when a character is selected.</p>}
                  <FormMessage />
                </FormItem>
              )}
            />

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="w-full aspect-square relative rounded-md overflow-hidden border">
                    <Image src={preview} alt={`Image preview ${index + 1}`} fill style={{objectFit: 'cover'}} data-ai-hint="uploaded image" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 z-10 h-6 w-6"
                      onClick={() => clearImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2">
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              <Sparkles className="mr-2 h-4 w-4" />
              {isLoading ? "Generating..." : "Generate"}
            </Button>
            <Button type="button" variant="outline" onClick={handleImprovePrompt} disabled={isImproving || hasImages} className="w-full sm:w-auto">
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
