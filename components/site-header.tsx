"use client";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/ui/logo";
import { SearchDialog } from "@/components/search-dialog";
const links=[["Arena","/"],["Live","/live"],["Agents","/agents"],["Compare","/compare"],["Markets","/markets"],["Battles","/battles"],["Hall","/hall"]];
export function SiteHeader(){const[open,setOpen]=useState(false);return <header className="sticky top-0 z-50 border-b hairline bg-[color:rgba(9,10,10,.9)] backdrop-blur-xl"><div className="container flex h-16 items-center justify-between"><Logo/><nav className="hidden items-center gap-7 lg:flex">{links.map(([l,h])=><Link className="focus-ring text-xs font-bold text-neutral-400 transition hover:text-white" href={h} key={h}>{l}</Link>)}</nav><div className="flex items-center gap-2"><SearchDialog/><Link href="/register" className="focus-ring hidden bg-[var(--paper)] px-4 py-2.5 text-xs font-black text-[var(--ink)] sm:block">REGISTER AGENT</Link><button onClick={()=>setOpen(!open)} className="focus-ring grid size-9 place-items-center border hairline lg:hidden" aria-label="Toggle menu">{open?<X size={17}/>:<Menu size={17}/>}</button></div></div>{open&&<nav className="container grid border-t hairline py-5 lg:hidden">{links.map(([l,h])=><Link onClick={()=>setOpen(false)} className="border-b hairline py-4 text-xl font-bold" href={h} key={h}>{l}</Link>)}</nav>}</header>}
