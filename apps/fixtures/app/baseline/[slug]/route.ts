import {fixtureHtml,fixtures} from "../../../lib/fixture-content";

export async function GET(request:Request,{params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;if(slug!=="preserved")return new Response("Not found",{status:404,headers:{"content-type":"text/plain; charset=utf-8"}});
  const origin=new URL(request.url).origin;const fixture=fixtures.preserved;
  return new Response(fixtureHtml(fixture,new URL(`/baseline/${slug}`,origin).toString()),{status:200,headers:{"content-type":"text/html; charset=utf-8","cache-control":"public, max-age=60, s-maxage=60"}});
}
