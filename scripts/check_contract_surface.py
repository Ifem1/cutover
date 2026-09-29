from pathlib import Path
src=Path("contracts/cutover.py").read_text()
writes=["create_migration","add_route","freeze_route","seal_baseline","set_candidate","assess_route","derive_candidate","open_challenge","reassess_challenge","authorize","cancel_migration"]
views=["get_config","get_stats","list_migrations","migrations_of","get_migration","get_route","get_route_assessment","get_challenge","get_authorization","get_events"]
missing=[x for x in writes+views if ("def "+x+"(") not in src]
if missing: raise SystemExit("Missing contract surface: "+", ".join(missing))
print("Contract surface OK:",len(writes),"writes,",len(views),"views")
