"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BarChart,
  LineChart,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
  Line,
  Area,
  Tooltip as RechartsTooltip,
} from "recharts";
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
import { chat, type ChatMessage, type ChartData } from "@/ai/flows";
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, User, BrainCircuit, Trash2, Loader2 } from "lucide-react";

const CHAT_HISTORY_KEY = "omondi_ai_chat_history_v2";

interface DisplayMessage {
  role: "user" | "model";
  content: string;
  chart?: ChartData;
}

const formSchema = z.object({
  message: z.string().min(1, "Message cannot be empty."),
});
type FormValues = z.infer<typeof formSchema>;

const ChatMessageChart = ({ chartData }: { chartData: ChartData }) => {
  const config = chartData.categories.reduce(
    (acc, category, i) => {
      acc[category] = {
        label: category,
        color: `hsl(var(--chart-${(i % 5) + 1}))`,
      };
      return acc;
    },
    {} as ChartConfig
  );

  const ChartComponent =
    {
      bar: BarChart,
      line: LineChart,
      area: AreaChart,
    }[chartData.type] || BarChart;

  const ChartElement =
    {
      bar: Bar,
      line: Line,
      area: Area,
    }[chartData.type] || Bar;

  return (
    <div className="mt-4 p-4 border rounded-lg bg-background/50">
      <h4 className="font-bold mb-4 text-sm text-center">{chartData.title}</h4>
      <ChartContainer config={config} className="h-[250px] w-full">
        <ChartComponent data={chartData.data} margin={{ left: 12, right: 12 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey={chartData.index}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={30}
          />
          <RechartsTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          {chartData.categories.map((category) => (
            <ChartElement
              key={category}
              dataKey={category}
              fill={`var(--color-${category})`}
              stroke={`var(--color-${category})`}
              type="monotone"
            />
          ))}
        </ChartComponent>
      </ChartContainer>
    </div>
  );
};

export function ChatPanel() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
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
    const originalMessages = [...messages];
    const userMessage: DisplayMessage = { role: "user", content: data.message };
    const historyForAPI: ChatMessage[] = messages.map(({ role, content }) => ({
      role,
      content,
    }));

    setMessages((prev) => [...prev, userMessage]);
    form.reset();
    setIsLoading(true);

    try {
      const result = await chat({
        history: historyForAPI,
        newMessage: data.message,
      });

      setIsLoading(false);
      setIsTyping(true);

      const modelMessage: DisplayMessage = { role: "model", content: "" };
      setMessages((prev) => [...prev, modelMessage]);

      const responseText = result.response;
      const chars = responseText.split('');

      let currentContent = "";
      for (const char of chars) {
        currentContent += char;
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessageIndex = newMessages.length - 1;
          if (newMessages[lastMessageIndex]?.role === "model") {
            newMessages[lastMessageIndex] = {
              ...newMessages[lastMessageIndex],
              content: currentContent,
            };
          }
          return newMessages;
        });
        await new Promise((r) => setTimeout(r, 2));
      }

      if (result.chart) {
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessageIndex = newMessages.length - 1;
          if (newMessages[lastMessageIndex]?.role === "model") {
            newMessages[lastMessageIndex] = {
              ...newMessages[lastMessageIndex],
              chart: result.chart,
            };
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Failed to get a response. Please try again.",
      });
      setMessages(originalMessages);
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
          <CardDescription>
            Your creative partner is here to help.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleClearChat}
          aria-label="Clear chat history"
          disabled={disabled}
        >
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
                    "rounded-xl px-4 py-2 max-w-[80%] break-words",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <ReactMarkdown
                    className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-table:w-full prose-th:p-2 prose-th:border prose-td:p-2 prose-td:border"
                    remarkPlugins={[remarkGfm]}
                  >
                    {message.content}
                  </ReactMarkdown>
                  {message.chart && <ChatMessageChart chartData={message.chart} />}
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
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex w-full items-start gap-2"
          >
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
