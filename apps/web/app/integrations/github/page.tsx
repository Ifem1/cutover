export default function Page(){
  const workflow=`- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: '24'
- run: npm install
- run: npm run build -w @cutover/gate
- uses: ./packages/gate
  with:
    contract-address: \${{ vars.CUTOVER_CONTRACT }}
    migration-id: '12'
    expected-candidate-ref: \${{ github.sha }}`;

  return <main className="wrap section">
    <div className="eyebrow">Release infrastructure</div>
    <h1>GitHub deployment gate</h1>
    <p>Read-only. No private key. It reads finalized Studionet state and fails unless the migration is AUTHORIZED for the current candidate generation and the authorized ref exactly equals the expected ref.</p>
    <p className="muted">When using the development source tree locally, build the self-contained action bundle before invoking <code>./packages/gate</code>. The packaged handoff already contains that generated bundle.</p>
    <pre className="panel mono" style={{whiteSpace:"pre-wrap"}}>{workflow}</pre>
  </main>;
}
