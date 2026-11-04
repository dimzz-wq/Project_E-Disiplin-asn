const BASE = 'https://project-e-disiplin-asn.vercel.app/api';

async function loginAs(nip) {
  const res = await fetch(BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nip, password: 'abcd' })
  });
  return await res.json();
}

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE ACTION & BUTTON TESTS ---');

  // 1. Pegawai: Record attendance (Presensi)
  console.log('\n[1] Testing Attendance (Check-in/Presensi Pegawai)...');
  const pegLogin = await loginAs('199506082020121003');
  const pegToken = pegLogin.token;

  const todayStr = new Date().toISOString().split('T')[0];
  const attRes = await fetch(BASE + '/attendance', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + pegToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employee_id: pegLogin.user.id,
      date: todayStr,
      check_in: '07:35:00',
      status: 'present',
      notes: 'Presensi otomatis sistem test'
    })
  });
  const attData = await attRes.json();
  console.log('Attendance POST status:', attRes.status, attData.success ? 'SUCCESS (ID: ' + (attData.data?.id || 'ok') + ')' : attData.message);

  // 2. Pegawai / Atasan: Create Report (Buat Laporan Pelanggaran)
  console.log('\n[2] Testing Create Violation Report (Buat Laporan)...');
  const repRes = await fetch(BASE + '/reports', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + pegToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reported_nip: '198201012006041005', // Dra. Novi Lestari
      reported_name: 'Dra. Novi Lestari',
      title: 'Laporan Dugaan Pelanggaran Disiplin Jam Kerja',
      description: 'Pegawai terlambat dan tidak hadir tanpa keterangan pada jam kerja operasional kantor.',
      category: 'disiplin_kerja',
      location: 'Gedung A Ruang Subag',
      incident_date: todayStr,
      is_anonymous: false
    })
  });
  const repData = await repRes.json();
  console.log('Report POST status:', repRes.status, repData.success ? 'SUCCESS (Report ID: ' + (repData.data?.id || repData.reportId || 'ok') + ')' : repData.message);
  const createdReportId = repData.data?.id || repData.reportId;

  // 3. Atasan: Disposisi / Update Report Status
  console.log('\n[3] Testing Report Status Update / Disposition by Atasan...');
  const ataLogin = await loginAs('197812222005022003'); // Ir. Siti Rahmawati
  const ataToken = ataLogin.token;

  if (createdReportId) {
    const dispRes = await fetch(`${BASE}/reports/${createdReportId}/status`, {
      method: 'PATCH',
      headers: { 'Authorization': 'Bearer ' + ataToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'investigating',
        notes: 'Laporan ditindaklanjuti untuk pembentukan tim klarifikasi.'
      })
    });
    const dispData = await dispRes.json();
    console.log('Report Update status:', dispRes.status, dispData.success ? 'SUCCESS' : dispData.message);
  }

  // 4. Admin / Pemeriksa: Create & Update Case
  console.log('\n[4] Testing Case Management (Buat & Perbarui Kasus)...');
  const admLogin = await loginAs('198503152008011001'); // Dr. Ahmad Suryadi
  const admToken = admLogin.token;

  const caseRes = await fetch(BASE + '/cases', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + admToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employee_id: 2, // Ir. Siti Rahmawati
      case_number: `KASUS/${Date.now().toString().slice(-6)}/2026`,
      title: 'Penanganan Kasus Dugaan Ketidakhadiran Berulang',
      violation_type: 'Kehadiran',
      severity_level: 'sedang',
      description: 'Kasus tindak lanjut atas akumulasi anomali kehadiran pegawai.',
      incident_date: todayStr,
      report_id: createdReportId || null
    })
  });
  const caseData = await caseRes.json();
  console.log('Case POST status:', caseRes.status, caseData.success ? 'SUCCESS (Case ID: ' + (caseData.data?.id || 'ok') + ')' : caseData.message);
  const createdCaseId = caseData.data?.id;

  if (createdCaseId) {
    // Update case status
    const updateCaseRes = await fetch(`${BASE}/cases/${createdCaseId}`, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + admToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'in_progress',
        notes: 'Pemeriksaan saksi sedang berlangsung.'
      })
    });
    const updateCaseData = await updateCaseRes.json();
    console.log('Case PUT status:', updateCaseRes.status, updateCaseData.success ? 'SUCCESS' : updateCaseData.message);
  }

  // 5. Pemeriksa: Examination / BAP
  console.log('\n[5] Testing Pemeriksaan / BAP by Pemeriksa...');
  const pemLogin = await loginAs('198807152015011002'); // Bambang Prakoso
  const pemToken = pemLogin.token;

  if (createdCaseId) {
    const examRes = await fetch(BASE + '/examinations', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + pemToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_id: createdCaseId,
        examiner_id: pemLogin.user.id,
        examination_date: todayStr,
        location: 'Ruang Pemeriksaan Inspektorat',
        questions_answers: [
          { q: 'Apakah benar Anda tidak hadir pada tanggal tersebut?', a: 'Benar, karena ada urusan keluarga mendadak.' }
        ],
        conclusion: 'Terperiksa mengakui perbuatan dan bersedia menerima pembinaan.',
        recommendation: 'Penjatuhan hukuman disiplin ringan berupa teguran tertulis.'
      })
    });
    const examData = await examRes.json();
    console.log('Examination POST status:', examRes.status, examData.success ? 'SUCCESS (Exam ID: ' + (examData.data?.id || 'ok') + ')' : examData.message);
  }

  // 6. BKPSDM / Admin: Decision / SK Hukuman Disiplin
  console.log('\n[6] Testing Penerbitan Keputusan / SK Disiplin...');
  const bkpLogin = await loginAs('199102102019032001'); // Dewi Anggraeni
  const bkpToken = bkpLogin.token;

  if (createdCaseId) {
    const decRes = await fetch(BASE + '/decisions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + bkpToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_id: createdCaseId,
        decision_number: `SK-DIS/${Date.now().toString().slice(-5)}/2026`,
        decision_date: todayStr,
        punishment_type: 'teguran_tertulis',
        severity: 'ringan',
        effective_date: todayStr,
        description: 'Berdasarkan hasil pemeriksaan, dijatuhi hukuman disiplin teguran tertulis.'
      })
    });
    const decData = await decRes.json();
    console.log('Decision POST status:', decRes.status, decData.success ? 'SUCCESS (SK ID: ' + (decData.data?.id || 'ok') + ')' : decData.message);
  }

  // 7. Admin: Employees CRUD (Tambah Pegawai Baru & Cari)
  console.log('\n[7] Testing Employee CRUD by Admin...');
  const testNip = '19991231' + Math.floor(100000 + Math.random() * 900000);
  const empRes = await fetch(BASE + '/employees', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + admToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nip: testNip,
      name: 'Pegawai Uji Sistem, S.Tr.Kom',
      unit_id: 1,
      position: 'Pengelola Sistem Informasi',
      type: 'PNS',
      rank_grade: 'III/a',
      status: 'active',
      join_date: '2026-01-01'
    })
  });
  const empData = await empRes.json();
  console.log('Employee POST status:', empRes.status, empData.success ? 'SUCCESS (NIP: ' + testNip + ')' : empData.message);

  // Search created employee
  const searchRes = await fetch(`${BASE}/employees?search=${testNip}`, {
    headers: { 'Authorization': 'Bearer ' + admToken }
  });
  const searchData = await searchRes.json();
  const found = (searchData.data || []).some(e => e.nip === testNip);
  console.log('Employee Search Verification:', found ? 'SUCCESS (Found in DB)' : 'NOT FOUND');

  console.log('\n--- ALL ACTION TESTS COMPLETED ---');
}

runTests();
