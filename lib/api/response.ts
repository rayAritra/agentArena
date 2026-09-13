import{NextResponse}from"next/server";import{randomUUID}from"node:crypto";
export function ok<T>(data:T,meta:Record<string,unknown>={},status=200){const requestId=String(meta.requestId??randomUUID());return NextResponse.json({data,meta:{...meta,requestId},error:null},{status,headers:{"x-request-id":requestId}})}
export function fail(code:string,message:string,status=400,requestId=randomUUID()){return NextResponse.json({data:null,meta:{},error:{code,message,requestId}},{status,headers:{"x-request-id":requestId}})}
