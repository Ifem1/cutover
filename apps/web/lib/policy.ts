export type MigrationState="DRAFT"|"BASELINED"|"CANDIDATE"|"READY"|"BLOCKED"|"INCONCLUSIVE"|"CHALLENGED"|"AUTHORIZED"|"CANCELLED";
export type PolicyInput={
  state:MigrationState;
  isOwner:boolean;
  routeCount:number;
  allRoutesFrozen:boolean;
  candidateGeneration:number;
  assessedGeneration:number;
  challengeOpen:boolean;
  challengeCount:number;
  reviewDeadline:number;
  now:number;
  authorized:boolean;
  networkOk:boolean;
};
export function actionPolicy(x:PolicyInput){return{
  addRoute:x.isOwner&&x.state==="DRAFT",
  freezeRoute:x.isOwner&&x.state==="DRAFT"&&x.routeCount>0,
  sealBaseline:x.isOwner&&x.state==="DRAFT"&&x.routeCount>0&&x.allRoutesFrozen,
  setCandidate:x.isOwner&&["BASELINED","CANDIDATE","READY","BLOCKED","INCONCLUSIVE","CHALLENGED"].includes(x.state),
  derive:x.candidateGeneration>0&&["CANDIDATE","READY","BLOCKED","INCONCLUSIVE"].includes(x.state),
  challenge:!x.isOwner&&x.state==="READY"&&!x.challengeOpen&&x.challengeCount<3&&x.now<x.reviewDeadline&&x.networkOk,
  reassess:x.state==="CHALLENGED"&&x.challengeOpen&&x.networkOk,
  authorize:x.state==="READY"&&!x.challengeOpen&&x.assessedGeneration===x.candidateGeneration&&x.now>=x.reviewDeadline&&!x.authorized&&x.networkOk,
  cancel:x.isOwner&&!x.authorized&&x.state!=="CANCELLED",
};}
