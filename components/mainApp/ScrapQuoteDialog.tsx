"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mobile keyboards resize the visual viewport even when 100dvh stays unchanged.
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!open || !viewport) return;
    const syncViewport = () => {
      dialogRef.current?.style.setProperty("--quote-viewport-height", `${viewport.height}px`);
      dialogRef.current?.style.setProperty("--quote-viewport-top", `${viewport.offsetTop}px`);
    };
    syncViewport();
    viewport.addEventListener("resize", syncViewport);
    viewport.addEventListener("scroll", syncViewport);
    return () => {
      viewport.removeEventListener("resize", syncViewport);
      viewport.removeEventListener("scroll", syncViewport);
    };
  }, [open]);

  const resetScroll = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const handleQuoteAdded = () => {
    onQuoteAdded?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            size="lg"
            className="min-h-11 whitespace-normal bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-bold uppercase tracking-widest shadow-xl"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            {triggerText}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        ref={dialogRef}
        className="scrap-quote-dialog flex flex-col gap-0 overflow-hidden border border-white/10 bg-slate-950 p-0 shadow-2xl sm:p-0"
        showCloseButton={false}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          titleRef.current?.focus({ preventScroll: true });
        }}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-2 sm:px-6">
          <div className="min-w-0">
            <DialogTitle ref={titleRef} tabIndex={-1} className="text-lg text-white outline-none">Your scrap quote</DialogTitle>
            <DialogDescription className="mt-1 text-xs text-slate-400">
              Vehicle details, valuation and free collection.
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="size-11 shrink-0 rounded-full text-slate-300 hover:bg-white/10 hover:text-white">
              <X className="size-5" />
              <span className="sr-only">Close quote</span>
            </Button>
          </DialogClose>
        </div>
        <div ref={scrollRef} className="app-scrollbar min-h-0 overflow-y-auto overscroll-contain [overflow-anchor:none]">
          <ScrapQuoteSection
            onQuoteAdded={handleQuoteAdded}
            inlineLayout={false}
            onStepChange={resetScroll}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
