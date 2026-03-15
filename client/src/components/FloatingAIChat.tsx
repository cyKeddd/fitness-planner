import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { trpc } from "@/lib/trpc";
import { MessageCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SUGGESTED_PROMPTS = [
  "5-minute upper-body warm-up",
  "How do I progress my bench press?",
  "Top 3 deadlift form cues",
  "Quick cool-down after leg day",
];

export function FloatingAIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (response) => {
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    },
    onError: (err) => {
      toast.error("AI chat failed", { description: err.message });
    },
  });

  const handleSend = (content: string) => {
    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    chatMutation.mutate({
      messages: newMessages.filter(m => m.role !== "system").map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg glow-primary z-40"
          aria-label="Open AI fitness assistant"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Fitness Assistant
          </SheetTitle>
          <SheetDescription>
            Ask specific questions about form, workouts, and recovery.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 min-h-0">
          <AIChatBox
            messages={messages}
            onSendMessage={handleSend}
            isLoading={chatMutation.isPending}
            placeholder="Ask a specific fitness question..."
            height="100%"
            emptyStateMessage="Ask a specific fitness question"
            suggestedPrompts={SUGGESTED_PROMPTS}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
