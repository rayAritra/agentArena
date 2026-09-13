import { NextResponse } from "next/server";import { getAgent } from "@/lib/data/repository";
export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){const agent=await getAgent((await params).slug);return agent?NextResponse.json({data:agent,meta:{methodology:"FIFO",updatedAt:new Date().toISOString()}}):NextResponse.json({error:"Agent not found"},{status:404})}
