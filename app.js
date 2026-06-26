const STORAGE_KEY = 'travel-simple-dashboard-v1';
const OLD_KEYS = ['travel-dashboard-v3', 'travel-sales-records'];
const form = document.querySelector('#recordForm');
const fields = ['recordId', 'date', 'employee', 'adAccount', 'consultations', 'followers', 'deals', 'amount', 'adSpend', 'note'];
let records = loadRecords();

document.querySelector('#date').valueAsDate = new Date();
form.addEventListener('submit', saveRecord);
document.querySelector('#resetBtn').addEventListener('click', resetForm);
document.querySelector('#exportBtn').addEventListener('click', exportCsv);
document.querySelector('#clearAllBtn').addEventListener('click', clearAllData);
document.querySelector('#queryBtn').addEventListener('click', render);
document.querySelector('#resetFilterBtn').addEventListener('click', resetFilters);
['employeeFilter', 'startDate', 'endDate', 'search'].forEach((id) => document.querySelector(`#${id}`).addEventListener('input', render));
render();

function loadRecords() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  const oldV3 = JSON.parse(localStorage.getItem(OLD_KEYS[0]) || 'null');
  if (oldV3?.records?.length) return oldV3.records.map((item) => ({
    id: item.id || createId(), date: item.date, employee: item.salesperson || '未命名', adAccount: item.accountName || '未命名账户',
    consultations: Number(item.accountLeads || item.handledLeads || 0), followers: Number(item.handledFans || 0), deals: Number(item.orders || 0),
    amount: Number(item.collected || 0), adSpend: Number(item.salesSpend || item.accountSpend || 0), note: item.note || '',
  }));
  const legacy = JSON.parse(localStorage.getItem(OLD_KEYS[1]) || '[]');
  return legacy.map((item) => ({
    id: item.id || createId(), date: item.date, employee: item.employee || '未命名', adAccount: item.adAccount || '未命名账户',
    consultations: Number(item.consultations || 0), followers: Number(item.followers || 0), deals: Number(item.deals || 0),
    amount: Number(item.amount || 0), adSpend: Number(item.adSpend || item.spend || 0), note: item.note || '',
  }));
}

function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }

function saveRecord(event) {
  event.preventDefault();
  const record = {
    id: document.querySelector('#recordId').value || createId(),
    date: document.querySelector('#date').value,
    employee: document.querySelector('#employee').value.trim(),
    adAccount: document.querySelector('#adAccount').value.trim(),
    consultations: Number(document.querySelector('#consultations').value),
    followers: Number(document.querySelector('#followers').value),
    deals: Number(document.querySelector('#deals').value),
    amount: Number(document.querySelector('#amount').value),
    adSpend: Number(document.querySelector('#adSpend').value),
    note: document.querySelector('#note').value.trim(),
  };
  const index = records.findIndex((item) => item.id === record.id);
  if (index >= 0) records[index] = record;
  else records.unshift(record);
  persist(); resetForm(); render();
}

function resetForm() {
  form.reset();
  document.querySelector('#recordId').value = '';
  document.querySelector('#date').valueAsDate = new Date();
  document.querySelector('#saveBtn').textContent = '保存记录';
}

function resetFilters() {
  document.querySelector('#employeeFilter').value = '';
  document.querySelector('#startDate').value = '';
  document.querySelector('#endDate').value = '';
  document.querySelector('#search').value = '';
  render();
}

function filteredRecords() {
  const employee = document.querySelector('#employeeFilter').value;
  const start = document.querySelector('#startDate').value;
  const end = document.querySelector('#endDate').value;
  const keyword = document.querySelector('#search').value.trim().toLowerCase();
  return records.filter((record) => {
    const matchEmployee = !employee || record.employee === employee;
    const matchStart = !start || record.date >= start;
    const matchEnd = !end || record.date <= end;
    const matchKeyword = !keyword || `${record.employee} ${record.adAccount} ${record.note}`.toLowerCase().includes(keyword);
    return matchEmployee && matchStart && matchEnd && matchKeyword;
  });
}

function render() {
  renderEmployeeOptions();
  const list = filteredRecords();
  renderTotals(list);
  renderGrouped('employeeSummaryBody', groupBy(list, 'employee'), true);
  renderGrouped('accountSummaryBody', groupBy(list, 'adAccount'), false);
  renderSchedule(list);
  renderRows(list);
  document.querySelector('#resultCount').textContent = `共 ${list.length} 条`;
}

function renderEmployeeOptions() {
  const current = document.querySelector('#employeeFilter').value;
  const employees = [...new Set(records.map((record) => record.employee).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  document.querySelector('#employeeFilter').innerHTML = '<option value="">全部</option>' + employees.map((employee) => `<option value="${escapeHtml(employee)}">${escapeHtml(employee)}</option>`).join('');
  if (employees.includes(current)) document.querySelector('#employeeFilter').value = current;
}

function renderTotals(list) {
  const total = list.reduce((sum, record) => addRecord(sum, record), emptyTotal());
  document.querySelector('#totalConsultations').textContent = total.consultations;
  document.querySelector('#totalFollowers').textContent = total.followers;
  document.querySelector('#totalDeals').textContent = total.deals;
  document.querySelector('#avgRate').textContent = formatRate(total);
  document.querySelector('#totalAmount').textContent = formatCurrency(total.amount);
  document.querySelector('#totalAdSpend').textContent = formatCurrency(total.adSpend);
  document.querySelector('#totalProfit').textContent = formatCurrency(total.amount - total.adSpend);
}

function groupBy(list, key) {
  return Object.values(list.reduce((map, record) => {
    const name = record[key] || '未命名';
    if (!map[name]) map[name] = { name, ...emptyTotal() };
    addRecord(map[name], record);
    return map;
  }, {})).sort((a, b) => (b.amount - b.adSpend) - (a.amount - a.adSpend));
}

function renderGrouped(targetId, rows, showRate) {
  document.querySelector(`#${targetId}`).innerHTML = rows.map((row) => showRate
    ? `<tr><td><b>${escapeHtml(row.name)}</b></td><td>${row.consultations}</td><td>${row.followers}</td><td>${row.deals}</td><td>${formatRate(row)}</td><td>${formatCurrency(row.amount)}</td><td>${formatCurrency(row.adSpend)}</td><td>${formatCurrency(row.amount - row.adSpend)}</td></tr>`
    : `<tr><td><b>${escapeHtml(row.name)}</b></td><td>${row.consultations}</td><td>${row.followers}</td><td>${row.deals}</td><td>${formatCurrency(row.adSpend)}</td><td>${formatCurrency(row.amount - row.adSpend)}</td></tr>`
  ).join('') || `<tr><td colspan="${showRate ? 8 : 6}" class="empty">暂无数据</td></tr>`;
}

function renderSchedule(list) {
  const employees = groupBy(list, 'employee');
  if (!employees.length) {
    document.querySelector('#scheduleBody').innerHTML = '<p class="muted">录入数据后，会自动给出排班建议。</p>';
    return;
  }
  document.querySelector('#scheduleBody').innerHTML = employees.map((employee, index) => {
    const rate = employee.consultations ? employee.deals / employee.consultations : 0;
    const level = rate >= 0.08 ? '主力班' : rate >= 0.03 ? '稳定班' : '培养班';
    const advice = index === 0 ? '优先安排高质量广告账户' : rate < 0.03 ? '建议减少承接量并安排带教' : '正常排班，关注消费成本';
    return `<article><strong>${escapeHtml(employee.name)} · ${level}</strong><span>成交率 ${formatRate(employee)}，利润 ${formatCurrency(employee.amount - employee.adSpend)}</span><p>${advice}</p></article>`;
  }).join('');
}

function renderRows(list) {
  document.querySelector('#recordsBody').innerHTML = list.map((record) => `<tr>
    <td>${record.date}</td><td><b>${escapeHtml(record.employee)}</b></td><td>${escapeHtml(record.adAccount)}</td>
    <td>${record.consultations}</td><td>${record.followers}</td><td>${record.deals}</td><td>${formatRate(record)}</td>
    <td class="green">${formatCurrency(record.amount)}</td><td class="orange">${formatCurrency(record.adSpend)}</td><td class="blue-text">${formatCurrency(record.amount - record.adSpend)}</td><td>${escapeHtml(record.note || '-')}</td>
    <td class="actions"><button class="icon" onclick="editRecord('${record.id}')">✎</button><button class="icon danger-text" onclick="deleteRecord('${record.id}')">×</button></td>
  </tr>`).join('');
  document.querySelector('#emptyState').hidden = list.length > 0;
}

function editRecord(id) {
  const record = records.find((item) => item.id === id);
  if (!record) return;
  for (const field of fields) document.querySelector(`#${field}`).value = field === 'recordId' ? record.id : (record[field] ?? '');
  document.querySelector('#saveBtn').textContent = '更新记录';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function deleteRecord(id) { if (confirm('确定删除这条记录吗？')) { records = records.filter((item) => item.id !== id); persist(); render(); } }
function clearAllData() { if (confirm('确定清空所有数据吗？此操作不可恢复。')) { records = []; persist(); render(); } }
function exportCsv() {
  const header = ['日期', '销售员', '广告账户', '咨询量', '加粉量', '成交单数', '成交率', '成交金额', '广告账户当天消费', '利润', '备注'];
  const rows = filteredRecords().map((record) => [record.date, record.employee, record.adAccount, record.consultations, record.followers, record.deals, formatRate(record), record.amount, record.adSpend, record.amount - record.adSpend, record.note]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `旅游员工数据-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(link.href);
}
function emptyTotal() { return { consultations: 0, followers: 0, deals: 0, amount: 0, adSpend: 0 }; }
function addRecord(sum, record) { sum.consultations += Number(record.consultations || 0); sum.followers += Number(record.followers || 0); sum.deals += Number(record.deals || 0); sum.amount += Number(record.amount || 0); sum.adSpend += Number(record.adSpend || 0); return sum; }
function createId() { return window.crypto?.randomUUID ? window.crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function csvCell(value) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }
function formatRate(record) { return record.consultations ? `${((record.deals / record.consultations) * 100).toFixed(1)}%` : '0%'; }
function formatCurrency(value) { return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(Number(value || 0)); }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
