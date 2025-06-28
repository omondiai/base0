"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageGenerationPanel } from "./image-generation-panel";
import { StyleTransferPanel } from "./style-transfer-panel";
import { ChatPanel } from "./chat-panel";
import { Sparkles, Combine, MessageCircle } from "lucide-react";

export function AIToolsTabs() {
  return (
    <Tabs defaultValue="generate" className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-muted/60">
        <TabsTrigger value="generate" className="gap-2">
          <Sparkles className="h-4 w-4" /> Generate
        </TabsTrigger>
        <TabsTrigger value="style-transfer" className="gap-2">
          <Combine className="h-4 w-4" /> Style Transfer
        </TabsTrigger>
        <TabsTrigger value="chat" className="gap-2">
          <MessageCircle className="h-4 w-4" /> Chat
        </TabsTrigger>
      </TabsList>
      <TabsContent value="generate">
        <ImageGenerationPanel />
      </TabsContent>
      <TabsContent value="style-transfer">
        <StyleTransferPanel />
      </TabsContent>
      <TabsContent value="chat">
        <ChatPanel />
      </TabsContent>
    </Tabs>
  );
}
