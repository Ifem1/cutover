export async function POST(request:Request){
  const form=await request.formData();const email=String(form.get("email")||"");
  if(!/^\S+@\S+\.\S+$/.test(email))return new Response("A valid email is required.",{status:400,headers:{"content-type":"text/plain; charset=utf-8","cache-control":"no-store"}});
  const html="<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>Trial request received</title></head><body><main><h1>Trial request received</h1><p>The public proof fixture accepted the form submission.</p></main></body></html>";
  return new Response(html,{status:200,headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store"}});
}
