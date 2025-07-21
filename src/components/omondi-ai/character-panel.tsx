
"use client";

import { useState, ChangeEvent, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import { Loader2, Trash2, Users, Wand, X, TriangleAlert } from "lucide-react";
import { Progress } from "../ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";

const MAX_STORAGE_MB = 400;
const MAX_STORAGE_BYTES = MAX_STORAGE_MB * 1024 * 1024;

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  images: z.array(z.any())
    .min(5, "Please upload at least 5 images.")
    .max(10, "You can upload a maximum of 10 images."),
});

type FormValues = z.infer<typeof formSchema>;

export interface CharacterImage {
  dataUri: string;
  size: number;
}
export interface Character {
  _id: string;
  name: string;
  images: CharacterImage[];
  createdAt: string;
}

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export function CharacterPanel() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [totalSize, setTotalSize] = useState(0);

  const fetchCharacters = async () => {
    try {
      const response = await fetch('/api/characters');
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setCharacters(data.characters);
      setTotalSize(data.totalSize);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load saved characters.' });
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      images: [],
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      form.setValue("images", newFiles, { shouldValidate: true });

      const newPreviews: string[] = [];
      const filePromises = newFiles.map(file => toBase64(file));

      Promise.all(filePromises).then(base64Files => {
        setImagePreviews(base64Files);
      });
    }
  };

  const clearImages = () => {
    form.setValue("images", [], { shouldValidate: true });
    setImagePreviews([]);
    const fileInput = document.getElementById('character-image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    try {
      const imageUploads = data.images.map(async (file) => ({
        dataUri: await toBase64(file),
        size: file.size,
      }));

      const images = await Promise.all(imageUploads);
      
      const newCharacterSize = images.reduce((acc, img) => acc + img.size, 0);
      if (totalSize + newCharacterSize > MAX_STORAGE_BYTES) {
        toast({ variant: "destructive", title: "Storage Limit Exceeded", description: `Cannot add character. You need to free up space.` });
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, images }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create character.");
      }

      toast({ title: "Character Trained!", description: `Character "${data.name}" has been saved successfully.` });
      form.reset();
      clearImages();
      fetchCharacters(); // Refresh the list
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ variant: "destructive", title: "Training Failed", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteCharacter = async (characterId: string) => {
      try {
        const response = await fetch(`/api/characters/${characterId}`, { method: 'DELETE' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        toast({ title: "Character Deleted", description: "The character has been removed."});
        fetchCharacters();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ variant: 'destructive', title: 'Delete Failed', description: errorMessage });
      }
  }
  
  const storagePercentage = (totalSize / MAX_STORAGE_BYTES) * 100;
  const storageLimitReached = storagePercentage >= 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Train a New Character</CardTitle>
          <CardDescription>
            Upload 5-10 high-quality photos of a person to create a reusable character.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <CardContent className="space-y-4">
               {storageLimitReached && (
                <Alert variant="destructive">
                  <TriangleAlert className="h-4 w-4" />
                  <AlertTitle>Storage Full</AlertTitle>
                  <AlertDescription>
                    You have reached the {MAX_STORAGE_MB}MB storage limit. Please delete existing characters to train a new one.
                  </AlertDescription>
                </Alert>
              )}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Character Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Zuri Model" {...field} disabled={isLoading || storageLimitReached} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="images"
                render={() => (
                  <FormItem>
                    <FormLabel>Reference Images</FormLabel>
                    <FormControl>
                      <Input id="character-image-upload" type="file" accept="image/*" onChange={handleFileChange} multiple disabled={isLoading || storageLimitReached} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="w-full aspect-square relative rounded-md overflow-hidden border">
                      <Image src={preview} alt={`Preview ${index + 1}`} fill style={{ objectFit: 'cover' }} data-ai-hint="person photo" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading || storageLimitReached} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand className="mr-2 h-4 w-4" />}
                {isLoading ? "Training..." : "Train Character"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Users className="h-6 w-6 text-primary"/>Saved Characters</CardTitle>
          <CardDescription>
            Manage your trained characters. These can be used in the Image Generation tab.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                    <p>Storage</p>
                    <p>{(totalSize / 1024 / 1024).toFixed(2)}MB / {MAX_STORAGE_MB}MB</p>
                </div>
                <Progress value={storagePercentage} />
            </div>

            {characters.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">You have no saved characters.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {characters.map(char => (
                        <Card key={char._id} className="flex flex-col">
                           <CardHeader className="flex flex-row items-start justify-between">
                             <div>
                                <CardTitle className="text-lg">{char.name}</CardTitle>
                                <CardDescription>
                                    {(char.images.reduce((acc, img) => acc + img.size, 0) / 1024 / 1024).toFixed(2)} MB
                                </CardDescription>
                             </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete the character "{char.name}" and its images. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteCharacter(char._id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                           </CardHeader>
                           <CardContent className="flex-1 flex items-center justify-center">
                                <div className="grid grid-cols-3 gap-1">
                                {char.images.slice(0, 6).map((image, index) => (
                                    <div key={index} className="aspect-square relative rounded-md overflow-hidden border">
                                        <Image src={image.dataUri} alt={`${char.name} image ${index+1}`} fill style={{ objectFit: 'cover' }} data-ai-hint="person face" />
                                    </div>
                                ))}
                                </div>
                           </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
