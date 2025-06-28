"use client";

import { useState, ChangeEvent } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { transferStyleFromImage } from "@/ai/flows";
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
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Download, Combine, FileImage } from "lucide-react";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";

const formSchema = z.object({
  baseImagePrompt: z.string().min(3, "Please enter a prompt."),
  styleImage: z.any().refine((file) => file, "Please upload a style image."),
  styleStrength: z.number().min(0).max(1),
});

type FormValues = z.infer<typeof formSchema>;

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

export function StyleTransferPanel() {
  const { toast } = useToast();
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [styleImagePreview, setStyleImagePreview] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      baseImagePrompt: "",
      styleImage: null,
      styleStrength: 0.5,
    },
  });
  
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("styleImage", file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onloadend = () => {
        setStyleImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setGeneratedImage(null);
    try {
      const styleImageBase64 = await toBase64(data.styleImage);
      const result = await transferStyleFromImage({
        baseImagePrompt: data.baseImagePrompt,
        styleImage: styleImageBase64,
        styleStrength: data.styleStrength,
      });

      if (result.generatedImage) {
        setGeneratedImage(result.generatedImage);
      } else {
        throw new Error("Style transfer failed to produce an image.");
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Style Transfer Failed",
        description: "Could not perform style transfer. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Style Transfer</CardTitle>
        <CardDescription>
          Blend the style of one image with the content of another.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="baseImagePrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content Prompt</FormLabel>
                  <FormControl>
                    <Input placeholder="A portrait of a cat" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
                control={form.control}
                name="styleImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Style Image</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/*" onChange={handleFileChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {styleImagePreview && (
                <div className="w-full aspect-square relative rounded-md overflow-hidden border">
                    <Image src={styleImagePreview} alt="Style preview" fill style={{objectFit: 'cover'}}/>
                </div>
              )}

            <FormField
              control={form.control}
              name="styleStrength"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Style Strength: {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={[field.value]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              <Combine className="mr-2 h-4 w-4" />
              {isLoading ? "Applying Style..." : "Transfer Style"}
            </Button>
          </CardFooter>
        </form>
      </Form>
      {(isLoading || generatedImage) && (
        <CardContent>
          <div className="aspect-square w-full rounded-lg overflow-hidden border">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Skeleton className="w-full h-full" />
              </div>
            ) : generatedImage && (
              <div className="relative w-full h-full">
                <Image src={generatedImage} alt="Style transfer result" fill style={{ objectFit: 'contain' }} data-ai-hint="painting portrait" />
                 <Button
                  asChild
                  size="icon"
                  className="absolute top-2 right-2 z-10"
                >
                  <a href={generatedImage} download="omondi-ai-styled.png">
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
