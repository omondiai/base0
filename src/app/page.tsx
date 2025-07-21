
import { AIToolsTabs } from "@/components/omondi-ai/ai-tools-tabs";
import { DrawingCanvas } from "@/components/omondi-ai/drawing-canvas";
import { Header } from "@/components/omondi-ai/header";
import { WelcomeDialog } from "@/components/omondi-ai/welcome-dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Paintbrush } from "lucide-react";

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center">
      <Header />
      <WelcomeDialog />
      <main className="container flex-1 gap-8 p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-4 xl:col-span-3">
          <AIToolsTabs />
        </div>
        <div className="lg:col-span-8 xl:col-span-9">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Paintbrush className="h-6 w-6 text-primary" />
                Drawing Board
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DrawingCanvas />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
