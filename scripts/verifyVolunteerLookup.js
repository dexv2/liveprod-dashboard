/*
  verifyVolunteerLookup.js

  Probes a running local Next dev server (tries ports 3000..3010 or uses PORT env)
  and checks three routes:
    - /volunteer/id/A313273  (expected: found / redirect)
    - /volunteer/id/A405975  (expected: found / redirect)
    - /volunteer/id/NOTFOUND  (expected: not found page)

  Exit codes: 0 = all checks passed; 1 = one or more failed.

  Usage: node scripts/verifyVolunteerLookup.js
*/

const fetch = global.fetch || require('node-fetch');

const probePorts = async () => {
  const start = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const ports = [];
  if (process.env.PORT) ports.push(start);
  for (let p = 3000; p <= 3010; p++) {
    if (!ports.includes(p)) ports.push(p);
  }
  return ports;
};

async function probeHost() {
  const ports = await probePorts();
  for (const port of ports) {
    const url = `http://localhost:${port}/_next/static/`;
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'manual' });
      // If we get any 2xx or 3xx, consider server present
      if (res.status >= 200 && res.status < 400) {
        return port;
      }
    } catch (err) {
      // ignore and continue
    }
  }
  return null;
}

async function runChecks(basePort) {
  const base = `http://localhost:${basePort}`;
  const cases = [
    { id: 'A313273', expectRedirect: true },
    { id: 'A405975', expectRedirect: true },
    { id: 'NOTFOUND', expectNotFound: true }
  ];

  let failed = 0;

  for (const c of cases) {
    const url = `${base}/volunteer/id/${encodeURIComponent(c.id)}`;
    console.log('\nChecking', url);
    try {
      const res = await fetch(url, { redirect: 'manual' });
      const text = await res.text();

      const foundRedirect = /NEXT_REDIRECT|refresh\s+content=\"1;url=\/volunteer\/profile\//.test(text) || res.status === 307 || res.status === 302 || /volunteer\/profile\//.test(text);
      const notFound = /Volunteer ID not found|This page could not be found|404: This page could not be found/.test(text) || res.status === 404;

      if (c.expectRedirect) {
        if (foundRedirect) {
          console.log(`OK: ${c.id} appears to redirect to profile (status=${res.status}).`);
        } else {
          console.error(`FAIL: ${c.id} did not redirect to profile. status=${res.status}`);
          failed++;
        }
      } else if (c.expectNotFound) {
        if (notFound) {
          console.log(`OK: ${c.id} returned not-found UI (status=${res.status}).`);
        } else {
          console.error(`FAIL: ${c.id} did not show not-found UI. status=${res.status}`);
          failed++;
        }
      } else {
        console.log('Unknown case', c);
      }
    } catch (err) {
      console.error('Error fetching', url, err.message);
      failed++;
    }
  }

  return failed;
}

(async function main(){
  console.log('Probing for a running Next server on localhost:3000-3010...');
  const port = await probeHost();
  if (!port) {
    console.error('No running Next server found on ports 3000-3010. Start dev server and retry.');
    process.exit(1);
  }
  console.log('Found server on port', port);

  const failed = await runChecks(port);
  if (failed === 0) {
    console.log('\nAll checks passed.');
    process.exit(0);
  } else {
    console.error(`\n${failed} check(s) failed.`);
    process.exit(1);
  }
})();
