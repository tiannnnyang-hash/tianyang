const STORAGE_KEY = 'travel-dashboard-v3';
const legacyKey = 'travel-sales-records';
const state = loadState();

const $ = (id) => document.querySelector(`#${id}`);
const accountForm = $('accountForm');
const recordForm = $('recordForm');
const accountFields = ['accountId', 'accountName', 'platform', 'accountSpend', 'accountFans', 'accountLeads'];
const recordFields = ['recordId', 'date', 'recordAccount', 'salesperson', 'handledFans', 'handledLeads', 'orders', 'collected', 'note'];

$('date').valueAsDate = new Date();
accountForm.addEventListener('submit', saveAccount);
recordForm.addEventListener('submit', saveRecord);
$('recordAccount').addEventListener('change', fillAccountFields);
['handledLeads', 'orders', 'collected'].forEach((id) => $(id).addEventListener('input', updateLiveCalc));
$('resetBtn').addEventListener('click', resetRecordForm);
$('queryBtn').addEventListener('click', render);
$('resetFilterBtn').addEventListener('click', resetFilters);
$('exportBtn').addEventListener('click', exportCsv);
$('clearAllBtn').addEventListener('click', clearAllData);
$('accountFilter').addEventListener('change', render);
$('salesFilter').addEventListener('change', render);
$('textFilter').addEventListener('input', render);
$('startDate').addEventListener('change', render);
$('endDate').addEventListener('change', render);

render();

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  const legacyRecords = JSON.parse(localStorage.getItem(legacyKey) || '[]');
  if (!legacyRecords.length) return { accounts: [], records: [] };
  return {
    accounts: [],
    records: legacyRecords.map((item) => ({
      id: item.id || createId(),
      date: item.date,
      accountId: '',
      accountName: '旧数据',
      platform: '其他',
      accountSpend: Number(item.spend || 0),
      accountFans: Number(item.followers || 0),
      accountLeads: Number(item.consultations || 0),
      unitPrice: Number(item.consultations || 0) ? Number(item.spend || 0) / Number(item.consultations || 0) : 0,
      salesperson: item.employee || '未命名',
      handledFans: Number(item.followers || 0),
      handledLeads: Number(item.consultations || 0),
      salesSpend: Number(item.spend || 0),
      orders: Number(item.deals || 0),
      collected: Number(item.amount || 0),
      profit: Number(item.amount || 0) - Number(item.spend || 0),
      note: '由旧版本数据迁移',
    })),
  };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveAccount(event) {
  event.preventDefault();
  const account = {
    id: $('accountId').value || createId(),
    name: $('accountName').value.trim(),
    platform: $('platform').value,
    spend: Number($('accountSpend').value),
    fans: Number($('accountFans').value),
    leads: Number($('accountLeads').value),
  };
  const index = state.accounts.findIndex((item) => item.id === account.id);
  if (index >= 0) state.accounts[index] = account;
  else state.accounts.push(account);
  persist();
  accountForm.reset();
  $('accountId').value = '';
  render();
}

function saveRecord(event) {
  event.preventDefault();
  const account = selectedAccount();
  if (!account) return alert('请先选择账户');
  const computed = computeRecordValues(account);
  const record = {
    id: $('recordId').value || createId(),
    date: $('date').value,
    accountId: account.id,
    accountName: account.name,
    platform: account.platform,
    accountSpend: account.spend,
    accountFans: account.fans,
    accountLeads: account.leads,
    unitPrice: computed.unitPrice,
    salesperson: $('salesperson').value.trim(),
    handledFans: Number($('handledFans').value),
    handledLeads: Number($('handledLeads').value),
    salesSpend: computed.salesSpend,
    orders: Number($('orders').value),
    collected: Number($('collected').value),
    profit: computed.profit,
    note: $('note').value.trim(),
  };
  const index = state.records.findIndex((item) => item.id === record.id);
  if (index >= 0) state.records[index] = record;
  else state.records.unshift(record);
  persist();
  resetRecordForm();
  render();
}

function selectedAccount() {
  return state.accounts.find((item) => item.id === $('recordAccount').value);
}

function computeRecordValues(account) {
  const unitPrice = account.leads ? account.spend / account.leads : 0;
  const salesSpend = unitPrice * Number($('handledLeads').value || 0);
  const profit = Number($('collected').value || 0) - salesSpend;
  return { unitPrice, salesSpend, profit };
}

function fillAccountFields() {
  const account = selectedAccount();
  $('recordAccountSpend').value = account ? account.spend : '';
  $('recordAccountLeads').value = account ? account.leads : '';
  $('recordAccountFans').value = account ? account.fans : '';
  $('unitPrice').value = account && account.leads ? (account.spend / account.leads).toFixed(2) : '';
  updateLiveCalc();
}

function updateLiveCalc() {
  const account = selectedAccount();
  if (!account) {
    $('salesSpend').value = '';
    $('profit').value = '';
    $('liveCalc').textContent = '📈 客单价：-- 元/留资　💵 该销售消费：-- 元　💵 利润：-- 元　📊 成单率：--';
    return;
  }
  const computed = computeRecordValues(account);
  $('salesSpend').value = computed.salesSpend.toFixed(2);
  $('profit').value = computed.profit.toFixed(2);
  const rate = Number($('handledLeads').value || 0) ? Number($('orders').value || 0) / Number($('handledLeads').value || 0) : 0;
  $('liveCalc').textContent = `📈 客单价：${computed.unitPrice.toFixed(2)} 元/留资　💵 该销售消费：${computed.salesSpend.toFixed(2)} 元　💵 利润：${computed.profit.toFixed(2)} 元　📊 成单率：${formatPercent(rate)}`;
}

function resetRecordForm() {
  recordForm.reset();
  $('recordId').value = '';
  $('date').valueAsDate = new Date();
  $('saveBtn').textContent = '➕ 添加销售记录';
  fillAccountFields();
}

function resetFilters() {
  $('salesFilter').value = '';
  $('accountFilter').value = '';
  $('textFilter').value = '';
  $('startDate').value = '';
  $('endDate').value = '';
  render();
}

function filteredRecords() {
  const sales = $('salesFilter').value;
  const account = $('accountFilter').value;
  const text = $('textFilter').value.trim().toLowerCase();
  const start = $('startDate').value;
  const end = $('endDate').value;
  return state.records.filter((record) => {
    const matchSales = !sales || record.salesperson === sales;
    const matchAccount = !account || record.accountId === account;
    const matchText = !text || `${record.salesperson} ${record.accountName} ${record.platform} ${record.note}`.toLowerCase().includes(text);
    const matchStart = !start || record.date >= start;
    const matchEnd = !end || record.date <= end;
    return matchSales && matchAccount && matchText && matchStart && matchEnd;
  });
}

function render() {
  renderOptions();
  const list = filteredRecords();
  renderAccountChips();
  renderMetrics(list);
  renderSalesSummary(list);
  renderRecords(list);
  renderSchedule(list);
  $('resultCount').textContent = `共 ${list.length} 条`;
  $('accountCount').textContent = `共 ${state.accounts.length} 个账户`;
}

function renderOptions() {
  const accountOptions = '<option value="">全部</option>' + state.accounts.map((account) => `<option value="${account.id}">${escapeHtml(account.name)}</option>`).join('');
  const recordAccountOptions = '<option value="">-- 请选择 --</option>' + state.accounts.map((account) => `<option value="${account.id}">${escapeHtml(account.name)}</option>`).join('');
  const salespeople = [...new Set(state.records.map((record) => record.salesperson).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  const currentSales = $('salesFilter').value;
  const currentAccount = $('accountFilter').value;
  const currentRecordAccount = $('recordAccount').value;
  $('accountFilter').innerHTML = accountOptions;
  $('recordAccount').innerHTML = recordAccountOptions;
  $('salesFilter').innerHTML = '<option value="">全部</option>' + salespeople.map((person) => `<option value="${escapeHtml(person)}">${escapeHtml(person)}</option>`).join('');
  if (salespeople.includes(currentSales)) $('salesFilter').value = currentSales;
  if (state.accounts.some((account) => account.id === currentAccount)) $('accountFilter').value = currentAccount;
  if (state.accounts.some((account) => account.id === currentRecordAccount)) $('recordAccount').value = currentRecordAccount;
}

function renderAccountChips() {
  $('accountChips').innerHTML = state.accounts.map((account) => `<span class="chip">${escapeHtml(account.name)}（消耗${formatNumber(account.spend)} 留资${account.leads}） <button type="button" onclick="editAccount('${account.id}')">✎</button><button type="button" onclick="deleteAccount('${account.id}')">×</button></span>`).join('') || '<span class="muted">暂无账户，请先添加账户</span>';
}

function renderMetrics(list) {
  const accountIds = new Set(list.map((record) => record.accountId).filter(Boolean));
  const accounts = state.accounts.filter((account) => accountIds.size ? accountIds.has(account.id) : true);
  const accountTotals = accounts.reduce((sum, account) => ({ spend: sum.spend + account.spend, fans: sum.fans + account.fans, leads: sum.leads + account.leads }), { spend: 0, fans: 0, leads: 0 });
  const salesTotals = list.reduce((sum, record) => ({ spend: sum.spend + record.salesSpend, orders: sum.orders + record.orders, leads: sum.leads + record.handledLeads }), { spend: 0, orders: 0, leads: 0 });
  $('accountSpendTotal').textContent = formatNumber(accountTotals.spend);
  $('accountFansTotal').textContent = accountTotals.fans;
  $('avgFanCost').textContent = accountTotals.fans ? (accountTotals.spend / accountTotals.fans).toFixed(2) : '--';
  $('fanCostTip').textContent = accountTotals.fans && accountTotals.spend / accountTotals.fans > 60 ? '🚨 偏高' : '✅ 正常';
  $('accountLeadsTotal').textContent = accountTotals.leads;
  $('salesSpendTotal').textContent = formatNumber(salesTotals.spend);
  $('ordersTotal').textContent = salesTotals.orders;
  $('conversionTotal').textContent = formatPercent(salesTotals.leads ? salesTotals.orders / salesTotals.leads : 0);
  $('conversionTip').textContent = salesTotals.leads && salesTotals.orders / salesTotals.leads >= 0.05 ? '🔥 优秀（>5%）' : '继续优化';
  $('salesPeopleTotal').textContent = new Set(list.map((record) => record.salesperson)).size;
}

function renderSalesSummary(list) {
  const grouped = list.reduce((map, record) => {
    const key = record.salesperson;
    if (!map[key]) map[key] = { salesperson: key, accounts: new Set(), fans: 0, leads: 0, spend: 0, collected: 0, profit: 0, orders: 0 };
    map[key].accounts.add(record.accountName);
    map[key].fans += record.handledFans;
    map[key].leads += record.handledLeads;
    map[key].spend += record.salesSpend;
    map[key].collected += record.collected;
    map[key].profit += record.profit;
    map[key].orders += record.orders;
    return map;
  }, {});
  const rows = Object.values(grouped).sort((a, b) => b.profit - a.profit || b.orders - a.orders);
  $('salesSummaryBody').innerHTML = rows.map((row) => `<tr><td><b>${escapeHtml(row.salesperson)}</b></td><td>${[...row.accounts].map((account) => `<span class="pill blue">${escapeHtml(account)}</span>`).join(' ')}</td><td>${row.fans}</td><td>${row.leads}</td><td class="orange">${formatNumber(row.spend)}</td><td class="green">${formatNumber(row.collected)}</td><td class="green">${formatNumber(row.profit)}</td><td>${row.orders}</td><td>${formatPercent(row.leads ? row.orders / row.leads : 0)}</td></tr>`).join('') || '<tr><td colspan="9" class="empty">暂无销售汇总</td></tr>';
}

function renderRecords(list) {
  $('recordsBody').innerHTML = list.map((record) => `<tr><td>${record.date}</td><td><b>${escapeHtml(record.accountName)}</b></td><td><span class="pill blue">${escapeHtml(record.platform)}</span></td><td><span class="pill purple">${escapeHtml(record.salesperson)}</span></td><td class="blue-text">${formatNumber(record.accountSpend)}</td><td>${record.accountLeads}</td><td class="blue-text">${record.unitPrice.toFixed(2)}</td><td>${record.handledFans}</td><td>${record.handledLeads}</td><td class="orange">${formatNumber(record.salesSpend)}</td><td class="green">${formatNumber(record.collected)}</td><td class="green">${formatNumber(record.profit)}</td><td>${record.orders}</td><td>${formatPercent(record.handledLeads ? record.orders / record.handledLeads : 0)}</td><td>${escapeHtml(record.note || '-')}</td><td class="actions"><button class="icon" onclick="editRecord('${record.id}')">✎</button><button class="icon danger-text" onclick="deleteRecord('${record.id}')">×</button></td></tr>`).join('');
  $('emptyState').hidden = list.length > 0;
}

function renderSchedule(list) {
  const rows = Object.values(list.reduce((map, record) => {
    if (!map[record.salesperson]) map[record.salesperson] = { salesperson: record.salesperson, leads: 0, orders: 0, profit: 0 };
    map[record.salesperson].leads += record.handledLeads;
    map[record.salesperson].orders += record.orders;
    map[record.salesperson].profit += record.profit;
    return map;
  }, {})).sort((a, b) => (b.orders / Math.max(b.leads, 1)) - (a.orders / Math.max(a.leads, 1)) || b.profit - a.profit);
  if (!rows.length) {
    $('scheduleBody').innerHTML = '<p class="muted">录入销售记录后，会自动给出排班和账户分配建议。</p>';
    return;
  }
  $('scheduleBody').innerHTML = rows.map((row, index) => {
    const rate = row.leads ? row.orders / row.leads : 0;
    const level = rate >= 0.3 ? '主力班' : rate >= 0.1 ? '稳定班' : '培养班';
    const suggestion = index === 0 ? '优先分配高质量留资账户' : rate < 0.1 ? '安排老员工带教，降低单日承接量' : '保持正常承接，关注利润';
    return `<article><strong>${index + 1}. ${escapeHtml(row.salesperson)} · ${level}</strong><span>成单率 ${formatPercent(rate)}，利润 ${formatNumber(row.profit)} 元</span><p>${suggestion}</p></article>`;
  }).join('');
}

function editAccount(id) {
  const account = state.accounts.find((item) => item.id === id);
  if (!account) return;
  $('accountId').value = account.id;
  $('accountName').value = account.name;
  $('platform').value = account.platform;
  $('accountSpend').value = account.spend;
  $('accountFans').value = account.fans;
  $('accountLeads').value = account.leads;
}

function deleteAccount(id) {
  if (state.records.some((record) => record.accountId === id) && !confirm('该账户已有销售记录，删除账户不会删除历史记录。确定删除？')) return;
  state.accounts = state.accounts.filter((account) => account.id !== id);
  persist();
  render();
}

function editRecord(id) {
  const record = state.records.find((item) => item.id === id);
  if (!record) return;
  $('recordId').value = record.id;
  $('date').value = record.date;
  $('recordAccount').value = record.accountId;
  fillAccountFields();
  $('salesperson').value = record.salesperson;
  $('handledFans').value = record.handledFans;
  $('handledLeads').value = record.handledLeads;
  $('orders').value = record.orders;
  $('collected').value = record.collected;
  $('note').value = record.note;
  updateLiveCalc();
  $('saveBtn').textContent = '更新销售记录';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteRecord(id) {
  if (!confirm('确定删除这条销售记录吗？')) return;
  state.records = state.records.filter((record) => record.id !== id);
  persist();
  render();
}

function clearAllData() {
  if (!confirm('确定清空所有账户和销售记录吗？此操作不可恢复。')) return;
  state.accounts = [];
  state.records = [];
  persist();
  render();
}

function exportCsv() {
  const header = ['日期', '账户', '平台', '销售', '账户总消耗', '总留资', '客单价', '销售粉丝', '销售留资', '销售消费', '收款', '利润', '销售订单', '成单率', '备注'];
  const rows = filteredRecords().map((record) => [record.date, record.accountName, record.platform, record.salesperson, record.accountSpend, record.accountLeads, record.unitPrice.toFixed(2), record.handledFans, record.handledLeads, record.salesSpend.toFixed(2), record.collected, record.profit.toFixed(2), record.orders, formatPercent(record.handledLeads ? record.orders / record.handledLeads : 0), record.note]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `旅游全维度看板-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function csvCell(value) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }
function formatNumber(value) { return Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 }); }
function formatPercent(value) { return `${(Number(value || 0) * 100).toFixed(1)}%`; }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
