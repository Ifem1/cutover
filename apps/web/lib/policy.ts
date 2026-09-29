export type MigrationState="DRAFT"|"BASELINED"|"CANDIDATE"|"READY"|"BLOCKED"|"INCONCLUSIVE"|"CHALLENGED"|"AUTHORIZED"|"CANCELLED";
export type PolicyInput={state:MigrationState,isOwner:boolean,baselineSealed:boolean,candidateGeneration:number,assessedGeneration:number,challengeOpen:boolean,reviewDeadline:number,now:number,authorized:boolean,networkOk:boolean};
export function actionPolicy(x:PolicyInput){return{
addRoute:x.isOwner&&x.state==="DRAFT",
sealBaseline:x.isOwner&&x.state==="DRAFT"&&!x.baselineSealed,
setCandidate:x.isOwner&&["BASELINED","CANDIDATE","READY","BLOCKED","INCONCLUSIVE"].includes(x.state),
assess:x.candidateGeneration>0&&["CANDIDATE","READY","BLOCKED","INCONCLUSIVE"].includes(x.state),
challenge:x.state==="READY"&&!x.challengeOpen,
authorize:x.state==="READY"&&!x.challengeOpen&&x.assessedGeneration===x.candidateGeneration&&x.now>=x.reviewDeadline&&!x.authorized&&x.networkOk,
cancel:x.isOwner&&!x.authorized&&x.state!=="CANCELLED"}}
