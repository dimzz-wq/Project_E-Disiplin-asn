const BASE = 'https://project-e-disiplin-asn.vercel.app/api';

const users = [
  { role: 'admin', nip: '198503152008011001' },
  { role: 'atasan', nip: '197812222005022003' },
  { role: 'pemeriksa', nip: '198807152015011002' },
  { role: 'bkpsdm', nip: '199102102019032001' },
  { role: 'pegawai', nip: '199506082020121003' },
  { role: 'inspektorat', nip: '197611102002121004' }
];

async function testBackend() {
  for (const u of users) {
    const loginRes = await fetch(BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nip: u.nip, password: 'abcd' })
    });
    const loginData = await loginRes.json();
    if (!loginData.success) {
      console.log('LOGIN FAILED for', u.role, loginData);
      continue;
    }
    const token = loginData.token;
    const authHeaders = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

    console.log(`\n=== Testing Role: ${u.role} (${loginData.user.name}) ===`);

    const endpoints = [
      { name: 'Dashboard Stats', url: BASE + '/dashboard/stats' },
      { name: 'Dashboard Chart', url: BASE + '/dashboard/charts' },
      { name: 'Employees List', url: BASE + '/employees' },
      { name: 'Attendance List', url: BASE + '/attendance' },
      { name: 'Reports List', url: BASE + '/reports' },
      { name: 'Cases List', url: BASE + '/cases' },
      { name: 'Examinations List', url: BASE + '/examinations' },
      { name: 'Decisions List', url: BASE + '/decisions' },
      { name: 'Audit Logs List', url: BASE + '/audit-logs' }
    ];

    for (const ep of endpoints) {
      try {
        const res = await fetch(ep.url, { headers: authHeaders });
        const json = await res.json().catch(() => ({}));
        const statusText = json.success !== false ? 'OK' : (json.message || 'FAILED');
        console.log(`  - ${ep.name}: HTTP ${res.status} (${statusText})`);
      } catch (err) {
        console.log(`  - ${ep.name}: ERROR ${err.message}`);
      }
    }
  }
}
testBackend();
