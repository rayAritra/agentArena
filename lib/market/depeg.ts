export type DepegSeverity="normal"|"watch"|"warning"|"critical";
export function deviationPercent(tokenPrice:number,referencePrice:number){if(referencePrice<=0)throw new Error("Reference price must be positive");return((tokenPrice-referencePrice)/referencePrice)*100}
export function depegSeverity(deviation:number):DepegSeverity{const absolute=Math.abs(deviation);if(absolute<.25)return"normal";if(absolute<.75)return"watch";if(absolute<=2)return"warning";return"critical"}
