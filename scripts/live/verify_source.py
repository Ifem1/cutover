#!/usr/bin/env python3
"""Fetch finalized deployed CUTOVER source and compare exact bytes/SHA-256."""
import argparse,base64,hashlib,json
from pathlib import Path
from urllib.request import Request,urlopen
DEFAULT_RPC="https://studio.genlayer.com/api"
def rpc(url,method,params):
 body=json.dumps({"jsonrpc":"2.0","method":method,"params":params,"id":1}).encode();req=Request(url,data=body,headers={"Content-Type":"application/json"})
 with urlopen(req,timeout=30) as resp: payload=json.load(resp)
 if "error" in payload: raise RuntimeError(payload["error"])
 return payload["result"]
def main():
 p=argparse.ArgumentParser();p.add_argument("--address",required=True);p.add_argument("--source",default="contracts/cutover.py");p.add_argument("--rpc",default=DEFAULT_RPC);p.add_argument("--write-deployed");args=p.parse_args()
 local=Path(args.source).read_bytes();encoded=rpc(args.rpc,"gen_getContractCode",[{"address":args.address,"status":"finalized"}]);deployed=base64.b64decode(encoded)
 local_hash=hashlib.sha256(local).hexdigest();deployed_hash=hashlib.sha256(deployed).hexdigest();print(json.dumps({"address":args.address,"rpc":args.rpc,"local_sha256":local_hash,"deployed_sha256":deployed_hash,"exact_match":local==deployed},indent=2))
 if args.write_deployed:Path(args.write_deployed).write_bytes(deployed)
 raise SystemExit(0 if local==deployed else 2)
if __name__=="__main__":main()
