"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareActions({ name, rank, roi, path }: { name: string; rank: number; roi: string; path: string }) {
  const [copied,setCopied]=useState(false);
  const url=typeof window==="undefined"?path:new URL(path,window.location.origin).toString();
  const text=`${name} is ranked #${rank} on Agent Arena with ${roi} ROI.`;
  return <div className="flex gap-2"><a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className="focus-ring flex items-center gap-2 border hairline px-4 py-3 text-xs font-black"><Share2 size={14}/> SHARE ON X</a><button onClick={async()=>{await navigator.clipboard.writeText(url);setCopied(true);setTimeout(()=>setCopied(false),1500)}} aria-label="Copy profile link" className="focus-ring border hairline p-3">{copied?<Check size={14}/>:<Copy size={14}/>}</button></div>;
}
