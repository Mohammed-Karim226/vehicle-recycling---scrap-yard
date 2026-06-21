"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import ScrapQuoteSection from "./ScrapQuoteSection";

interface ScrapQuoteDialogProps {
  triggerText?: string;
  onQuoteAdded?: () => void;
  children?: React.ReactNode;
}

export default function ScrapQuoteDialog({
  triggerText = "Get Scrap Value",
  onQuoteAdded,
  children,
}: ScrapQuoteDialogProps) {
  const [open, setOpen] = useState(false);

  const handleQuoteAdded = () => {
    onQuoteAdded?.();
    // Optional: close dialog after successful booking
    // setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            size="lg"
            className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold uppercase tracking-widest shadow-xl"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            {triggerText}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
     className="p-0 overflow-hidden border-0 bg-transparent shadow-2xl 
                   max-w-4xl w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw]"
        onInteractOutside={(e) => {
          // Optional: prevent closing when clicking inside the widget
          if ((e.target as HTMLElement).closest("#quote-widget-container")) {
            e.preventDefault();
          }
        }}
      >
        <div className="relative">
          <ScrapQuoteSection
            onQuoteAdded={handleQuoteAdded}
            inlineLayout={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}