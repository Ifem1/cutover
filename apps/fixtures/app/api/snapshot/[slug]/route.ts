import {fixtureText,fixtures} from "../../../../lib/fixture-content";

export async function GET(request:Request,{params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;const fixture=fixtures[slug];const url=new URL(request.url);
  const routeId=url.searchParams.get("route_id")||"";const capturedAt=url.searchParams.get("captured_at")||"";
  if(!fixture||!routeId||routeId.length>80||!capturedAt||Number.isNaN(Date.parse(capturedAt)))return Response.json({error:"Use a known fixture slug, route_id and ISO captured_at."},{status:400,headers:{"cache-control":"no-store"}});
  const sourceUrl=new URL(`/baseline/${slug}`,url.origin).toString();
  const snapshot={schema_version:"cutover.baseline.v1",route_id:routeId,source_url:sourceUrl,captured_at:capturedAt,title:fixture.title,canonical_url:sourceUrl,headings:[fixture.title],visible_text:fixtureText(fixture),important_links:[],forms:fixture.form?["POST /api/signup"]:[],claims:[fixture.price,fixture.legal].filter(Boolean)};
  return new Response(JSON.stringify(snapshot),{status:200,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
}
