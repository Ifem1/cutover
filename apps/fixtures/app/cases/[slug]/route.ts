import {fixtureHtml,fixtures} from "../../../lib/fixture-content";

export async function GET(request:Request,{params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;const fixture=fixtures[slug];
  if(!fixture)return new Response("Not found",{status:404,headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store"}});
  const origin=new URL(request.url).origin;const canonical=new URL(fixture.canonical||`/cases/${slug}`,origin).toString();
  return new Response(fixtureHtml(fixture,canonical),{status:200,headers:{"content-type":"text/html; charset=utf-8","cache-control":"public, max-age=60, s-maxage=60"}});
}
