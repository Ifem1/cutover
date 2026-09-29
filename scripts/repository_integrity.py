from pathlib import Path
import json,re,sys
root=Path('.')
forbidden_runtime=['61997','studio-dev.genlayer.com','studioDevnet']
runtime_allow={'README.md','docs/TOOLCHAIN.md','docs/SECURITY.md','scripts/repository_integrity.py','scripts/check-network.mjs'}
viol=[]
for p in root.rglob('*'):
    if not p.is_file() or any(x in p.parts for x in ('node_modules','.git','.next')): continue
    rel=p.as_posix()
    try:text=p.read_text()
    except UnicodeDecodeError:continue
    if rel not in runtime_allow:
        for token in forbidden_runtime:
            if token in text:viol.append((rel,token))
    if rel.startswith(('apps/web/','packages/gate/')) and '/tests/' not in rel and ('127.0.0.1' in text or 'localhost' in text):viol.append((rel,'localhost production config'))
    if rel!='.env.example' and not rel.startswith(('docs/','proof/')) and re.search(r'(?i)(private[_-]?key|mnemonic|seed[_-]?phrase)\s*[:=]\s*[\'\"]?[A-Za-z0-9+/=_-]{20,}',text):viol.append((rel,'possible secret/private key'))
if viol:print('Repository integrity violations:',*viol,sep='\n');sys.exit(1)
config=Path('apps/web/lib/config.ts').read_text();assert 'chainId:61999' in config and 'https://studio.genlayer.com/api' in config and 'https://explorer-studio.genlayer.com' in config
assert 'createAccount(' not in '\n'.join(p.read_text(errors='ignore') for p in Path('apps/web').rglob('*.ts*'))
requirements=Path('requirements.txt').read_text();assert 'genlayer-py@v0.16.3' in requirements and 'genlayer-testing-suite@v0.29.2' in requirements and 'genvm-linter@v0.11.0' in requirements;assert '@main' not in requirements and '-rc' not in requirements.lower()
root_package=json.loads(Path('package.json').read_text());assert root_package['devDependencies']['genlayer']=='0.39.1'
web_package=json.loads(Path('apps/web/package.json').read_text());assert web_package['dependencies']['genlayer-js']=='1.1.8'
contract=Path('contracts/cutover.py').read_text()
for required in ['gl.nondet.web.get(','mode="html"','mode="text"','cutover.candidate.v1','candidate_manifest_digest','assessment_attempts','challenge_route_used','evidence_root','owner_migration_index','MAX_ORDINARY_ATTEMPTS','owner cannot challenge own candidate']:
    assert required in contract,required
assert 'CUTOVER observation stage' not in contract
assert 'evidence_text:str' not in contract
assert 'candidate_ref:str' not in contract
mutation=Path('scripts/contract_mutation.py').read_text();assert 'contracts/cutover.py' in mutation and 'UNMODIFIED CONTROL PASS' in mutation and 'core_logic.py' not in mutation
surface=json.loads(Path('contracts/surface.json').read_text());assert surface['writes']['set_candidate']==['migration_id','candidate_origin','manifest_url','expected_manifest_sha256'];assert surface['writes']['open_challenge']==['migration_id','route_id','evidence_url'];assert surface['views']['migrations_of']==['address','offset','limit']
fixture=Path('apps/fixtures/app/api/unavailable/route.ts').read_text();assert 'status:503' in fixture
plan=json.loads(Path('proof/cases.json').read_text());assert plan['chain_id']==61999 and any(x['fixture']=='/api/unavailable' for x in plan['cases'])
print('Repository integrity OK')
