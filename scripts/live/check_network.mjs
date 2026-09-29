#!/usr/bin/env node
const rpc=process.env.GENLAYER_RPC||"https://studio.genlayer.com/api";
const r=await fetch(rpc,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",method:"eth_chainId",params:[],id:1})});
if(!r.ok) throw new Error(`RPC HTTP ${r.status}`);
const j=await r.json();
if(j.error) throw new Error(JSON.stringify(j.error));
const id=Number.parseInt(j.result,16);
if(id!==61999) throw new Error(`Refusing non-Studionet chain ${id}; expected 61999`);
console.log(`Studionet network guard OK: chain ${id} via ${rpc}`);
