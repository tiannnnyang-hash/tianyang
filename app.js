const STORAGE_KEY = 'travel-sales-records';
const form = document.querySelector('#recordForm');
const fields = ['recordId', 'date', 'employee', 'consultations', 'followers', 'deals', 'amount', 'spend'];
const recordsBody = document.querySelector('#recordsBody');
const employeeSummaryBody = document.querySelector('#employeeSummaryBody');
const emptyState = document.querySelector('#emptyState');
const employeeEmptyState = document.querySelector('#employeeEmptyState');
const searchInput = document.querySelector('#search');
const employeeFilter = document.querySelector('#employeeFilter');

let records = loadRecords();

document.querySelector('#date').valueAsDate = new Date();
form.addEventListener('submit', saveRecord);
document.querySelector('#resetBtn').addEventListener('click', resetForm);
document.querySelector('#exportBtn').addEventListener('click', exportCsv);
searchInput.addEventListener('input', render);
employeeFilter.addEventListener('change', render);
render();

function loadRecords() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function saveRecord(event) {
  event.preventDefault();
  const record = {
    id: document.querySelector('#recordId').value || createId(),
    date: document.querySelector('#date').value,
    employee: document.querySelector('#employee').value.trim(),
    consultations: Number(document.querySelector('#consultations').value),
    followers: Number(document.querySelector('#followers').value),
    deals: Number(document.querySelector('#deals').value),
    amount: Number(document.querySelector('#amount').value),
    spend: Number(document.querySelector('#spend').value),
  };

  const existingIndex = records.findIndex((item) => item.id === record.id);
  if (existingIndex >= 0) records[existingIndex] = record;
  else records.unshift(record);

  persist();
  resetForm();
  render();
}

function resetForm() {
  form.reset();
  document.querySelector('#recordId').value = '';
  document.querySelector('#date').valueAsDate = new Date();
  document.querySelector('#saveBtn').textContent = '保存记录';
}

function render() {
  renderEmployeeOptions();
  const keyword = searchInput.value.trim().toLowerCase();
  const selectedEmployee = employeeFilter.value;
  const filtered = records.filter((record) => {
    const matchesKeyword = `${record.date} ${record.employee}`.toLowerCase().includes(keyword);
    const matchesEmployee = !selectedEmployee || record.employee === selectedEmployee;
    return matchesKeyword && matchesEmployee;
  });
  recordsBody.innerHTML = filtered.map(rowTemplate).join('');
  emptyState.hidden = filtered.length > 0;
  renderEmployeeSummary(records);
  renderSummary(filtered);
}

function renderEmployeeOptions() {
  const current = employeeFilter.value;
  const employees = [...new Set(records.map((record) => record.employee).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  employeeFilter.innerHTML = '<option value="">全部员工</option>' + employees.map((employee) => `<option value="${escapeHtml(employee)}">${escapeHtml(employee)}</option>`).join('');
  if (employees.includes(current)) employeeFilter.value = current;
}

function renderEmployeeSummary(list) {
  const grouped = list.reduce((result, record) => {
    if (!result[record.employee]) result[record.employee] = { employee: record.employee, consultations: 0, followers: 0, deals: 0, amount: 0, spend: 0 };
    result[record.employee].consultations += record.consultations;
    result[record.employee].followers += record.followers;
    result[record.employee].deals += record.deals;
    result[record.employee].amount += record.amount;
    result[record.employee].spend += Number(record.spend || 0);
    return result;
  }, {});
  const rows = Object.values(grouped).sort((a, b) => b.amount - a.amount || b.deals - a.deals);
  employeeSummaryBody.innerHTML = rows.map((employee) => `<tr>
    <td>${escapeHtml(employee.employee)}</td>
    <td>${employee.consultations}</td>
    <td>${employee.followers}</td>
    <td>${employee.deals}</td>
    <td>${formatRate(employee)}</td>
    <td>${formatCurrency(employee.amount)}</td>
    <td>${formatCurrency(employee.spend)}</td>
  </tr>`).join('');
  employeeEmptyState.hidden = rows.length > 0;
}

function rowTemplate(record) {
  return `<tr>
    <td>${record.date}</td>
    <td>${escapeHtml(record.employee)}</td>
    <td>${record.consultations}</td>
    <td>${record.followers}</td>
    <td>${record.deals}</td>
    <td>${formatRate(record)}</td>
    <td>${formatCurrency(record.amount)}</td>
    <td>${formatCurrency(record.spend || 0)}</td>
    <td class="actions">
      <button onclick="editRecord('${record.id}')">编辑</button>
      <button class="delete" onclick="deleteRecord('${record.id}')">删除</button>
    </td>
  </tr>`;
}

function renderSummary(list) {
  const totals = list.reduce((sum, record) => ({
    consultations: sum.consultations + record.consultations,
    followers: sum.followers + record.followers,
    deals: sum.deals + record.deals,
    amount: sum.amount + record.amount,
    spend: sum.spend + Number(record.spend || 0),
  }), { consultations: 0, followers: 0, deals: 0, amount: 0, spend: 0 });

  document.querySelector('#totalConsultations').textContent = totals.consultations;
  document.querySelector('#totalFollowers').textContent = totals.followers;
  document.querySelector('#totalDeals').textContent = totals.deals;
  document.querySelector('#avgRate').textContent = totals.consultations ? `${((totals.deals / totals.consultations) * 100).toFixed(1)}%` : '0%';
  document.querySelector('#totalAmount').textContent = formatCurrency(totals.amount);
  document.querySelector('#totalSpend').textContent = formatCurrency(totals.spend);
}

function editRecord(id) {
  const record = records.find((item) => item.id === id);
  if (!record) return;
  for (const field of fields) {
    const value = field === 'recordId' ? record.id : (record[field] ?? 0);
    document.querySelector(`#${field}`).value = value;
  }
  document.querySelector('#saveBtn').textContent = '更新记录';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteRecord(id) {
  if (!confirm('确定删除这条记录吗？')) return;
  records = records.filter((item) => item.id !== id);
  persist();
  render();
}

function exportCsv() {
  const header = ['日期', '员工', '咨询量', '加粉量', '成交单数', '成交率', '成交金额', '消费'];
  const rows = records.map((record) => [record.date, record.employee, record.consultations, record.followers, record.deals, formatRate(record), record.amount, record.spend || 0]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `旅游员工数据-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
  return `record-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function formatRate(record) {
  return record.consultations ? `${((record.deals / record.consultations) * 100).toFixed(1)}%` : '0%';
}

function formatCurrency(value) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(value);
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}
