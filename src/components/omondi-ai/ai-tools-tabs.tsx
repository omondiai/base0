"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageGenerationPanel } from "./image-generation-panel";
import { StyleTransferPanel } from "./style-transfer-panel";
import { ChatPanel } from "./chat-panel";
import { VideoGenerationPanel } from "./video-generation-panel";
import { CharacterPanel } from "./character-panel";
import { Sparkles, Combine, MessageCircle, Video, Users } from "lucide-react";

export function AIToolsTabs() {
  return (
    <Tabs defaultValue="generate" className="w-full">
      <TabsList className="grid w-full grid-cols-5 bg-muted/60">
        <TabsTrigger value="generate" className="gap-2">
          <Sparkles className="h-4 w-4" /> Image
        </TabsTrigger>
        <TabsTrigger value="video" className="gap-2">
          <Video className="h-4 w-4" /> Video
        </TabsTrigger>
        <TabsTrigger value="style-transfer" className="gap-2">
          <Combine className="h-4 w-4" /> Style
        </TabsTrigger>
        <TabsTrigger value="characters" className="gap-2">
          <Users className="h-4 w-4" /> Characters
        </TabsTrigger>
        <TabsTrigger value="chat" className="gap-2">
          <MessageCircle className="h-4 w-4" /> Chat
        </TabsTrigger>
      </TabsList>
      <TabsContent value="generate">
        <ImageGenerationPanel />
      </TabsContent>
      <TabsContent value="video">
        <VideoGenerationPanel />
      </TabsContent>
      <TabsContent value="style-transfer">
        <StyleTransferPanel />
      </TabsContent>
       <TabsContent value="characters">
        <CharacterPanel />
      </TabsContent>
      <TabsContent value="chat">
        <ChatPanel />
      </TabsContent>
    </Tabs>
  );
}
