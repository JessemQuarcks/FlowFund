"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Share2 } from "lucide-react";

// Shares the current page with the Web Share API where available (phones),
// and falls back to copying the link to the clipboard everywhere else.
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Cancelled or unsupported: fall through to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked; nothing else we can do without a URL.
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={share}
      aria-label="Share this fundraiser"
      title={copied ? "Link copied" : "Share"}
      className="border-primary-200 hover:bg-primary-50 hover:text-primary-700"
    >
      {copied ? (
        <Check className="h-4 w-4 text-primary-600" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
    </Button>
  );
}
