"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { chat, type ChatMessage } from "@/ai/flows";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, User, BrainCircuit, Trash2, Loader2 } from "lucide-react";

const CHAT_HISTORY_KEY = "omondi_ai_chat_history_v1";

const formSchema = z.object({
  message: z.string().min(1, "Message cannot be empty."),
});
type FormValues = z.infer<typeof formSchema>;

export function ChatPanel() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
      if (savedHistory) {
        setMessages(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Failed to load chat history from local storage:", error);
    }
  }, []);

  useEffect(() => {
    try {
      if (!isTyping) {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
      }
    } catch (error) {
      console.error("Failed to save chat history to local storage:", error);
    }
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });

  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
    toast({
      title: "Chat Cleared",
      description: "Your conversation history has been deleted.",
    });
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const userMessage: ChatMessage = { role: "user", content: data.message };
    const historyForAPI = [...messages];
    setMessages(prev => [...prev, userMessage]);
    form.reset();
    setIsLoading(true);

    try {
      const result = await chat({
        history: historyForAPI,
        newMessage: data.message,
      });
      setIsLoading(false);
      setIsTyping(true);

      const modelMessage: ChatMessage = { role: "model", content: "" };
      setMessages(prev => [...prev, modelMessage]);
      
      const responseText = result.response;
      const words = responseText.split(/(\s+)/);
      
      let currentContent = "";
      for (const word of words) {
          currentContent += word;
          setMessages(prev => {
              const newMessages = [...prev];
              const lastMessageIndex = newMessages.length - 1;
              if (newMessages[lastMessageIndex]?.role === 'model') {
                newMessages[lastMessageIndex] = {
                    ...newMessages[lastMessageIndex],
                    content: currentContent
                };
              }
              return newMessages;
          });
          await new Promise(r => setTimeout(r, 50));
      }

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Failed to get a response. Please try again.",
      });
      setMessages(historyForAPI);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const disabled = isLoading || isTyping;

  return (
    <Card className="flex flex-col h-[75vh]">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline">Chat with Omondi AI</CardTitle>
          <CardDescription>Your creative partner is here to help.</CardDescription>
        </div>
        <Button variant="outline" size="icon" onClick={handleClearChat} aria-label="Clear chat history" disabled={disabled}>
            <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "model" && (
                  <Avatar className="w-8 h-8 border border-primary">
                    <AvatarFallback className="bg-primary/20">
                      <BrainCircuit className="w-5 h-5 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "rounded-xl px-4 py-2 max-w-[80%] whitespace-pre-wrap",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
                {message.role === "user" && (
                  <Avatar className="w-8 h-8 border">
                    <AvatarFallback>
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                  <Avatar className="w-8 h-8 border border-primary">
                    <AvatarFallback className="bg-primary/20">
                      <BrainCircuit className="w-5 h-5 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-xl px-4 py-2 max-w-[80%] bg-muted flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-6 flex flex-col items-start w-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full items-start gap-2">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Textarea
                      placeholder="Ask for ideas, feedback, or help with a design..."
                      rows={1}
                      {...field}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (!disabled) {
                            form.handleSubmit(onSubmit)();
                          }
                        }
                      }}
                      className="resize-none"
                      disabled={disabled}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" disabled={disabled} size="icon">
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </Form>
        <p className="text-xs text-muted-foreground mt-2 text-center w-full">
            Omondi AI can make mistakes. Check important info.
        </p>
      </CardFooter>
    </Card>
  );
}
