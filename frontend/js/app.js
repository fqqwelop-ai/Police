// ============ أدوات مساعدة ============
async function api(path, opts = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (res.status === 401) {
    window.location.href = 'index.html';
    return null;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'صار خطأ');
  return data;
}

function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'الآن';
  if (diff < 3600) return `قبل ${Math.floor(diff/60)} د`;
  if (diff < 86400) return `قبل ${Math.floor(diff/3600)} س`;
  return `قبل ${Math.floor(diff/86400)} يوم`;
}

const STATUS_LABELS = { active: 'نشط', suspended: 'موقوف', fired: 'مفصول', vacation: 'إجازة', pending: 'قيد المراجعة', approved: 'مقبول', rejected: 'مرفوض' };

function rankChevrons(level, color) {
  const count = Math.max(1, 5 - Math.min(level, 4));
  let html = '<span class="chevrons">';
  for (let i = 0; i < count; i++) html += `<span class="chevron" style="background:${color}"></span>`;
  return html + '</span>';
}

// ============ الحالة العامة ============
let STATE = { me: null, officers: [], ranks: [], reports: [], requests: [] };

// ============ التنقل بين الصفحات ============
document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
  btn.addEventListener('click', () => switchPage(btn.dataset.page));
});
function switchPage(page) {
  document.querySelectorAll('.nav-item[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('hidden', p.id !== `page-${page}`));
}

// ============ الساعة ============
function tickClock() {
  document.getElementById('opsClock').textContent = new Date().toLocaleString('ar-SA', { hour: '2-digit', minute: '2-digit', weekday: 'short' });
}
setInterval(tickClock, 1000); tickClock();

// ============ تحميل البيانات ============
async function loadAll() {
  try {
    const [me, officers, ranks, reports, requests] = await Promise.all([
      api('/api/officers/me'),
      api('/api/officers'),
      api('/api/ranks'),
      api('/api/reports'),
      api('/api/requests'),
    ]);
    if (!me) return;
    STATE = { me, officers, ranks, reports, requests };
    renderMe();
    renderOverview();
    renderOfficers();
    renderRanks();
    renderReports();
    renderRequests();
    renderOpsStrip();
  } catch (err) {
    console.error(err);
  }
}

function perm(name) {
  return !!STATE.me?.rank?.permissions?.[name];
}

// ============ بطاقتي ============
function renderMe() {
  const el = document.getElementById('meCard');
  const av = STATE.me.avatar
    ? `<img src="${STATE.me.avatar}" alt="">`
    : `<div class="avatar-fallback">${escapeHtml(STATE.me.username[0] || '?')}</div>`;
  el.innerHTML = `${av}<div><div class="who">${escapeHtml(STATE.me.username)}</div><div class="rank-tag">${escapeHtml(STATE.me.rank?.name || 'بدون رتبة')}</div></div>`;
}

// ============ شريط العمليات ============
function renderOpsStrip() {
  document.getElementById('opsActive').textContent = STATE.officers.filter(o => o.status === 'active').length;
  const pendingReports = STATE.reports.filter(r => r.status === 'pending').length;
  const pendingRequests = STATE.requests.filter(r => r.status === 'pending').length;
  document.getElementById('opsReports').textContent = pendingReports;
  document.getElementById('opsRequests').textContent = pendingRequests;

  const rc = document.getElementById('navReportsCount');
  const qc = document.getElementById('navRequestsCount');
  rc.textContent = pendingReports; rc.classList.toggle('hidden', pendingReports === 0);
  qc.textContent = pendingRequests; qc.classList.toggle('hidden', pendingRequests === 0);
}

// ============ نظرة عامة ============
function renderOverview() {
  const grid = document.getElementById('statGrid');
  grid.innerHTML = `
    <div class="stat-card c-gold"><div class="label">إجمالي الضباط</div><div class="value">${STATE.officers.length}</div></div>
    <div class="stat-card c-green"><div class="label">نشطين الآن</div><div class="value">${STATE.officers.filter(o=>o.status==='active').length}</div></div>
    <div class="stat-card c-amber"><div class="label">تقارير معلّقة</div><div class="value">${STATE.reports.filter(r=>r.status==='pending').length}</div></div>
    <div class="stat-card c-steel"><div class="label">طلبات معلّقة</div><div class="value">${STATE.requests.filter(r=>r.status==='pending').length}</div></div>
  `;

  const top = [...STATE.officers].sort((a,b) => b.points - a.points).slice(0, 6);
  document.getElementById('topOfficersBody').innerHTML = top.map(o => `
    <tr>
      <td>${officerCell(o)}</td>
      <td>${rankChip(o.rank)}</td>
      <td class="points-tag">${o.points}</td>
      <td>${statusPill(o.status)}</td>
    </tr>
  `).join('') || emptyRow(4);
}

function officerCell(o) {
  const av = o.avatar ? `<img src="${o.avatar}">` : `<div class="avatar-fallback">${escapeHtml((o.username||'?')[0])}</div>`;
  return `<div class="officer-cell">${av}<div><div class="name">${escapeHtml(o.username)}</div><div class="badge-no">#${o._id.slice(-5).toUpperCase()}</div></div></div>`;
}
function rankChip(rank) {
  if (!rank) return `<span class="rank-chip" style="color:var(--muted)">بدون رتبة</span>`;
  return `<span class="rank-chip" style="color:${rank.color}">${rankChevrons(rank.level, rank.color)} ${escapeHtml(rank.name)}</span>`;
}
function statusPill(status) {
  return `<span class="status-pill ${status}">${STATUS_LABELS[status] || status}</span>`;
}
function emptyRow(cols) {
  return `<tr><td colspan="${cols}"><div class="empty-state"><div class="ico">∅</div>لا توجد بيانات حالياً</div></td></tr>`;
}

// ============ الضباط ============
function renderOfficers() {
  document.getElementById('officersCount').textContent = `${STATE.officers.length} ضابط`;
  const canManage = perm('manageOfficers');
  const canPoints = perm('sendPoints');

  document.getElementById('officersBody').innerHTML = STATE.officers.map(o => `
    <tr>
      <td>${officerCell(o)}</td>
      <td>${rankChip(o.rank)}</td>
      <td class="points-tag">${o.points}</td>
      <td>${statusPill(o.status)}</td>
      <td>
        ${canPoints ? `<button class="icon-btn ok" onclick="openPointsModal('${o._id}')">± نقاط</button>` : ''}
        ${canManage ? `<button class="icon-btn" onclick="openRankModal('${o._id}')">تغيير رتبة</button>` : ''}
        ${canManage ? `<button class="icon-btn" onclick="openStatusModal('${o._id}')">الحالة</button>` : ''}
      </td>
    </tr>
  `).join('') || emptyRow(5);
}

window.openPointsModal = function(officerId) {
  showModal(`
    <h3>تعديل النقاط</h3>
    <div class="field"><label>العدد (استخدم سالب للخصم)</label><input type="number" id="mAmount" value="10"></div>
    <div class="field"><label>السبب</label><input type="text" id="mReason" placeholder="مثال: أداء ممتاز في دورية"></div>
    <div class="modal-actions">
      <button class="btn-ghost" onclick="closeModal()">إلغاء</button>
      <button class="btn" onclick="submitPoints('${officerId}')">حفظ</button>
    </div>
  `);
};
window.submitPoints = async function(officerId) {
  const amount = Number(document.getElementById('mAmount').value);
  const reason = document.getElementById('mReason').value;
  try {
    await api(`/api/officers/${officerId}/points`, { method: 'PATCH', body: JSON.stringify({ amount, reason }) });
    closeModal(); loadAll();
  } catch (err) { alert(err.message); }
};

window.openRankModal = function(officerId) {
  const options = STATE.ranks.map(r => `<option value="${r._id}">${escapeHtml(r.name)}</option>`).join('');
  showModal(`
    <h3>تغيير الرتبة</h3>
    <div class="field"><label>الرتبة الجديدة</label><select id="mRank">${options}</select></div>
    <div class="modal-actions">
      <button class="btn-ghost" onclick="closeModal()">إلغاء</button>
      <button class="btn" onclick="submitRank('${officerId}')">حفظ</button>
    </div>
  `);
};
window.submitRank = async function(officerId) {
  const rankId = document.getElementById('mRank').value;
  try {
    await api(`/api/officers/${officerId}/rank`, { method: 'PATCH', body: JSON.stringify({ rankId }) });
    closeModal(); loadAll();
  } catch (err) { alert(err.message); }
};

window.openStatusModal = function(officerId) {
  showModal(`
    <h3>تغيير الحالة</h3>
    <div class="field"><label>الحالة</label>
      <select id="mStatus">
        <option value="active">نشط</option>
        <option value="suspended">موقوف</option>
        <option value="vacation">إجازة</option>
        <option value="fired">مفصول</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-ghost" onclick="closeModal()">إلغاء</button>
      <button class="btn" onclick="submitStatus('${officerId}')">حفظ</button>
    </div>
  `);
};
window.submitStatus = async function(officerId) {
  const status = document.getElementById('mStatus').value;
  try {
    await api(`/api/officers/${officerId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    closeModal(); loadAll();
  } catch (err) { alert(err.message); }
};

// ============ الرتب ============
function renderRanks() {
  document.getElementById('addRankBtn').classList.toggle('hidden', !perm('manageRanks'));
  document.getElementById('ranksBody').innerHTML = [...STATE.ranks].sort((a,b)=>a.level-b.level).map(r => `
    <tr>
      <td class="points-tag">${r.level}</td>
      <td>${rankChip(r)}</td>
      <td class="points-tag">${r.minPoints || 0}</td>
      <td style="font-size:11px;color:var(--muted)">${activePerms(r.permissions)}</td>
      <td>${perm('manageRanks') ? `<button class="icon-btn no" onclick="deleteRank('${r._id}')">حذف</button>` : ''}</td>
    </tr>
  `).join('') || emptyRow(5);
}
function activePerms(p = {}) {
  const labels = { manageOfficers: 'إدارة ضباط', manageRanks: 'إدارة رتب', reviewReports: 'مراجعة تقارير', reviewRequests: 'مراجعة طلبات', sendPoints: 'إرسال نقاط' };
  const active = Object.keys(labels).filter(k => p[k]);
  return active.length ? active.map(k => labels[k]).join(' · ') : '—';
}
document.getElementById('addRankBtn').addEventListener('click', () => {
  showModal(`
    <h3>إضافة رتبة جديدة</h3>
    <div class="field"><label>اسم الرتبة</label><input type="text" id="rName" placeholder="مثال: نقيب"></div>
    <div class="field"><label>المستوى (1 = الأعلى)</label><input type="number" id="rLevel" value="${STATE.ranks.length + 1}"></div>
    <div class="field"><label>اللون</label><input type="text" id="rColor" value="#C9A24B"></div>
    <div class="field"><label>الصلاحيات</label>
      <select id="rPerms" multiple style="min-height:100px">
        <option value="manageOfficers">إدارة ضباط</option>
        <option value="manageRanks">إدارة رتب</option>
        <option value="reviewReports">مراجعة تقارير</option>
        <option value="reviewRequests">مراجعة طلبات</option>
        <option value="sendPoints">إرسال نقاط</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="btn-ghost" onclick="closeModal()">إلغاء</button>
      <button class="btn" onclick="submitRankCreate()">إضافة</button>
    </div>
  `);
});
window.submitRankCreate = async function() {
  const name = document.getElementById('rName').value.trim();
  const level = Number(document.getElementById('rLevel').value);
  const color = document.getElementById('rColor').value.trim() || '#C9A24B';
  const selected = [...document.getElementById('rPerms').selectedOptions].map(o => o.value);
  const permissions = Object.fromEntries(selected.map(k => [k, true]));
  if (!name) return alert('اكتب اسم الرتبة');
  try {
    await api('/api/ranks', { method: 'POST', body: JSON.stringify({ name, level, color, permissions }) });
    closeModal(); loadAll();
  } catch (err) { alert(err.message); }
};
window.deleteRank = async function(id) {
  if (!confirm('متأكد تبي تحذف هذي الرتبة؟')) return;
  try { await api(`/api/ranks/${id}`, { method: 'DELETE' }); loadAll(); }
  catch (err) { alert(err.message); }
};

// ============ التقارير ============
function renderReports() {
  const canReview = perm('reviewReports');
  document.getElementById('reportsBody').innerHTML = STATE.reports.map(r => `
    <tr>
      <td>${escapeHtml(r.title)}</td>
      <td>${escapeHtml(r.type)}</td>
      <td>${officerCell(r.officer || { username: 'محذوف', _id: '00000' })}</td>
      <td>${statusPill(r.status)}</td>
      <td style="font-family:var(--font-mono);font-size:11px;color:var(--muted)">${timeAgo(r.createdAt)}</td>
      <td>
        ${canReview && r.status === 'pending' ? `
          <button class="icon-btn ok" onclick="reviewReport('${r._id}','approved')">قبول</button>
          <button class="icon-btn no" onclick="reviewReport('${r._id}','rejected')">رفض</button>
        ` : ''}
      </td>
    </tr>
  `).join('') || emptyRow(6);
}
document.getElementById('addReportBtn').addEventListener('click', () => {
  showModal(`
    <h3>تقرير جديد</h3>
    <div class="field"><label>النوع</label>
      <select id="repType">
        <option>يومي</option><option>حادثة</option><option>دورية</option><option>إداري</option>
      </select>
    </div>
    <div class="field"><label>العنوان</label><input type="text" id="repTitle" placeholder="عنوان مختصر"></div>
    <div class="field"><label>التفاصيل</label><textarea id="repContent" placeholder="تفاصيل التقرير..."></textarea></div>
    <div class="modal-actions">
      <button class="btn-ghost" onclick="closeModal()">إلغاء</button>
      <button class="btn" onclick="submitReport()">إرسال</button>
    </div>
  `);
});
window.submitReport = async function() {
  const type = document.getElementById('repType').value;
  const title = document.getElementById('repTitle').value.trim();
  const content = document.getElementById('repContent').value.trim();
  if (!title || !content) return alert('عبّي العنوان والتفاصيل');
  try {
    await api('/api/reports', { method: 'POST', body: JSON.stringify({ type, title, content }) });
    closeModal(); loadAll();
  } catch (err) { alert(err.message); }
};
window.reviewReport = async function(id, status) {
  try { await api(`/api/reports/${id}/review`, { method: 'PATCH', body: JSON.stringify({ status }) }); loadAll(); }
  catch (err) { alert(err.message); }
};

// ============ الطلبات ============
function renderRequests() {
  const canReview = perm('reviewRequests');
  document.getElementById('requestsBody').innerHTML = STATE.requests.map(r => `
    <tr>
      <td>${escapeHtml(r.type)}</td>
      <td>${escapeHtml(r.applicantUsername)}</td>
      <td>${statusPill(r.status)}</td>
      <td style="font-family:var(--font-mono);font-size:11px;color:var(--muted)">${timeAgo(r.createdAt)}</td>
      <td>
        ${canReview && r.status === 'pending' ? `
          <button class="icon-btn ok" onclick="reviewRequest('${r._id}','approved')">قبول</button>
          <button class="icon-btn no" onclick="reviewRequest('${r._id}','rejected')">رفض</button>
        ` : ''}
      </td>
    </tr>
  `).join('') || emptyRow(5);
}
window.reviewRequest = async function(id, status) {
  try { await api(`/api/requests/${id}/review`, { method: 'PATCH', body: JSON.stringify({ status }) }); loadAll(); }
  catch (err) { alert(err.message); }
};

// ============ النوافذ المنبثقة ============
function showModal(innerHtml) {
  document.getElementById('modalRoot').innerHTML = `
    <div class="modal-backdrop" onclick="if(event.target===this) closeModal()">
      <div class="modal">${innerHtml}</div>
    </div>
  `;
}
window.closeModal = function() { document.getElementById('modalRoot').innerHTML = ''; };

// ============ تسجيل الخروج ============
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await api('/auth/logout', { method: 'POST' });
  window.location.href = 'index.html';
});

// ============ بدء التشغيل ============
loadAll();
setInterval(loadAll, 30000);
