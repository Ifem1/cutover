type ErrorRecord={
  code?:unknown;
  message?:unknown;
  shortMessage?:unknown;
  details?:unknown;
  data?:unknown;
  cause?:unknown;
};

function textValue(value:unknown):string{
  return typeof value==="string"&&value.trim()?value.trim():"";
}

function nestedRecords(error:unknown):ErrorRecord[]{
  if(!error||typeof error!=="object")return [];
  const root=error as ErrorRecord;
  const out=[root];
  if(root.cause&&typeof root.cause==="object")out.push(root.cause as ErrorRecord);
  if(root.data&&typeof root.data==="object")out.push(root.data as ErrorRecord);
  return out;
}

export function isWalletSignatureRejection(error:unknown):boolean{
  for(const candidate of nestedRecords(error)){
    if(candidate.code===4001||candidate.code==="4001")return true;
    const message=[candidate.message,candidate.shortMessage,candidate.details].map(textValue).filter(Boolean).join(" ");
    if(/user rejected|user denied|request rejected|rejected the request/i.test(message))return true;
  }
  return false;
}

export function describeError(error:unknown):string{
  if(error instanceof Error&&error.message.trim())return error.message.trim();
  if(typeof error==="string"&&error.trim())return error.trim();

  if(error&&typeof error==="object"){
    const messages:string[]=[];
    let code:unknown;

    for(const candidate of nestedRecords(error)){
      if(code===undefined&&candidate.code!==undefined)code=candidate.code;
      for(const value of [candidate.shortMessage,candidate.message,candidate.details]){
        const text=textValue(value);
        if(text&&!messages.includes(text))messages.push(text);
      }
    }

    if(messages.length){
      return code!==undefined?`${messages.join(" — ")} (code ${String(code)})`:messages.join(" — ");
    }

    try{
      const seen=new WeakSet<object>();
      const serialized=JSON.stringify(error,(_key,value)=>{
        if(typeof value==="bigint")return value.toString();
        if(value&&typeof value==="object"){
          if(seen.has(value))return "[Circular]";
          seen.add(value);
        }
        return value;
      });
      if(serialized&&serialized!=="{}")return serialized;
    }catch{/* fall through */}
  }

  return String(error??"Unknown transaction error");
}
