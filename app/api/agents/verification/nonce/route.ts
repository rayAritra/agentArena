import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { nonceRequestSchema } from "@/lib/validation/agent";
import { issueNonce } from "@/lib/security/wallet-verification";
import { rateLimit,requestKey } from "@/lib/security/rate-limit";
import { hasTrustedOrigin } from "@/lib/security/origin";

export async function POST(request:Request){
  if(!hasTrustedOrigin(request))return NextResponse.json({error:"Untrusted request origin"},{status:403});
  if(!rateLimit(`nonce:${requestKey(request)}`,5).allowed)return NextResponse.json({error:"Too many requests"},{status:429});
  try{
    if(!await getCurrentUser())return NextResponse.json({error:"Authentication required"},{status:401});
    const{address}=nonceRequestSchema.parse(await request.json());
    return NextResponse.json(await issueNonce(address),{headers:{"Cache-Control":"no-store"}});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invalid request"},{status:400})}
}
