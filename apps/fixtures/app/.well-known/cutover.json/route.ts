export function GET(){
 const raw=process.env.CUTOVER_CANDIDATE_MANIFEST_JSON;
 if(!raw)return Response.json({error:"CUTOVER_CANDIDATE_MANIFEST_JSON is required for live candidate provenance"},{status:503,headers:{"cache-control":"no-store"}});
 try{return new Response(JSON.stringify(JSON.parse(raw)),{status:200,headers:{"content-type":"application/json","cache-control":"no-store"}})}catch{return Response.json({error:"invalid candidate manifest configuration"},{status:500,headers:{"cache-control":"no-store"}})}
}
