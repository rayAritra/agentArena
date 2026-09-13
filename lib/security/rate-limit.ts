type Entry={count:number;reset:number};const buckets=new Map<string,Entry>();
export function rateLimit(key:string,limit=10,windowMs=60_000){const now=Date.now();const entry=buckets.get(key);if(!entry||entry.reset<=now){buckets.set(key,{count:1,reset:now+windowMs});return{allowed:true,remaining:limit-1}}entry.count++;return{allowed:entry.count<=limit,remaining:Math.max(0,limit-entry.count)}}
export function requestKey(request:Request){return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()??"local"}
