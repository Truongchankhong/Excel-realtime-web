// public/script.js

const container        = document.getElementById('table-container');
const detailsContainer = document.getElementById('details-container');
const lastUpdatedEl    = document.getElementById('last-updated');
const btnRaw           = document.getElementById('btn-raw');
const btnSummary       = document.getElementById('btn-summary');

function updateTimestamp() {
  lastUpdatedEl.textContent = new Date().toLocaleTimeString();
}

function setBtnLoading(btn, isLoading) {
  btn.disabled = isLoading;
  btn.textContent = isLoading
    ? 'Loading…'
    : (btn.id === 'btn-raw' ? 'Raw View' : 'Summary View');
}

function hideDetails() {
  detailsContainer.innerHTML = '';
  detailsContainer.classList.add('hidden');
}
function showDetails() {
  detailsContainer.classList.remove('hidden');
}

// --- Raw View ---
async function loadRaw() {
  setBtnLoading(btnRaw, true);
  hideDetails();
  try {
    const res  = await fetch('/api/data');
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      container.innerHTML = '<div class="text-center py-4">Không có dữ liệu</div>';
    } else {
      let html = '<table class="min-w-full table-auto border-collapse">';
      html += '<thead class="bg-gray-50"><tr>';
      rows[0].forEach((_, i) => {
        html += `<th class="border px-2 py-1 text-left text-sm font-medium text-gray-700">Cột ${i+1}</th>`;
      });
      html += '</tr></thead><tbody>';
      rows.slice(1).forEach(r => {
        html += '<tr class="hover:bg-gray-100">';
        r.forEach(cell => {
          html += `<td class="border px-2 py-1 text-sm text-gray-800">${cell ?? ''}</td>`;
        });
        html += '</tr>';
      });
      html += '</tbody></table>';
      container.innerHTML = html;
    }
  } catch (e) {
    console.error(e);
    container.innerHTML = '<div class="text-center text-red-500 py-4">Lỗi tải dữ liệu</div>';
  } finally {
    setBtnLoading(btnRaw, false);
    updateTimestamp();
  }
}

// --- Summary View ---
async function loadSummary() {
  setBtnLoading(btnSummary, true);
  hideDetails();
  try {
    const res  = await fetch('/api/summary');
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = '<div class="text-center py-4">Không có dữ liệu summary</div>';
    } else {
      const withName    = data.filter(d => d.machine?.trim());
      const withoutName = data.filter(d => !d.machine?.trim());
      withName.sort((a, b) => {
        const nA = parseInt((a.machine.match(/\d+$/) || ['0'])[0], 10);
        const nB = parseInt((b.machine.match(/\d+$/) || ['0'])[0], 10);
        return nA - nB;
      });
      const sorted = [...withName, ...withoutName];

      let totalSum = 0;
      let html = `
        <table id="summary-table" class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Machine</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Quantity</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
      `;

      sorted.forEach(({ machine, total }) => {
        totalSum += Number(total);
        html += `
          <tr data-machine="${machine}" class="hover:bg-gray-100 cursor-pointer">
            <td class="px-6 py-4 text-sm text-gray-900">${machine || '<blank>'}</td>
            <td class="px-6 py-4 text-sm text-gray-900 text-right">${Number(total).toLocaleString()}</td>
          </tr>
        `;
      });

      html += `
          <tr class="font-bold bg-gray-100">
            <td class="px-6 py-4 text-sm text-gray-900">Tổng cộng</td>
            <td class="px-6 py-4 text-sm text-gray-900 text-right">${totalSum.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>`;

      container.innerHTML = html;

      document.querySelectorAll('#summary-table tbody tr[data-machine]').forEach(tr => {
        tr.addEventListener('click', () => {
          const machine = tr.dataset.machine;
          loadDetails(machine);
        });
      });
    }
    updateTimestamp();
  } catch (e) {
    console.error(e);
    container.innerHTML = '<div class="text-center text-red-500 py-4">Lỗi tải summary</div>';
  } finally {
    setBtnLoading(btnSummary, false);
  }
}

async function loadDetails(machine) {
  showDetails();
  detailsContainer.innerHTML = '<div class="text-center py-4">Loading details…</div>';
  try {
    const res = await fetch(`/api/details?machine=${encodeURIComponent(machine)}`);
    const details = await res.json();
    if (!Array.isArray(details) || details.length === 0) {
      detailsContainer.innerHTML = `<div class="text-center py-4">Không có chi tiết cho "${machine}"</div>`;
      return;
    }

    let html = `
      <h2 class="text-lg font-semibold mb-2">Chi tiết đơn cho: ${machine}</h2>
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Brand Code</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product Type</th>
            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
    `;
    details.forEach(d => {
      html += `
        <tr>
          <td class="px-4 py-2 text-sm text-gray-800">${d.order}</td>
          <td class="px-4 py-2 text-sm text-gray-800">${d.brandCode}</td>
          <td class="px-4 py-2 text-sm text-gray-800">${d.productType}</td>
          <td class="px-4 py-2 text-sm text-gray-800 text-right">${Number(d.quantity).toLocaleString()}</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
    detailsContainer.innerHTML = html;
  } catch (e) {
    console.error(e);
    detailsContainer.innerHTML = `<div class="text-center text-red-500 py-4">Lỗi tải chi tiết cho "${machine}"</div>`;
  }
}

btnRaw.addEventListener('click', loadRaw);
btnSummary.addEventListener('click', loadSummary);
loadSummary();

async function searchOrders() {
  const input = document.getElementById('searchBox').value.trim();
  if (!input) return;

  const orderList = input.split('|').map(o => o.trim().toUpperCase());
  const res = await fetch('/api/data');
  const data = await res.json();

  if (!data || data.length <= 1) return;

  const results = [];
  for (const code of orderList) {
    const found = data.find(row => String(row[2] || '').toUpperCase() === code);
    if (found) {
      results.push({
        order: code,
        brand: found[3] || '',
        type: found[5] || '',
        quantity: found[6] || '',
        machine: found[57] || ''
      });
    }
  }

  let html = `<h3 class="text-lg font-semibold mb-2">Kết quả tìm kiếm:</h3>`;
  if (results.length === 0) {
    html += `<p>Không tìm thấy đơn hàng nào.</p>`;
  } else {
    html += `
      <table class="min-w-full table-auto border-collapse border">
        <thead class="bg-gray-50">
          <tr>
            <th class="border px-2 py-1">ORDER</th>
            <th class="border px-2 py-1">BRAND CODE</th>
            <th class="border px-2 py-1">PRODUCT TYPE</th>
            <th class="border px-2 py-1 text-right">QUANTITY</th>
            <th class="border px-2 py-1">MACHINE</th>
          </tr>
        </thead>
        <tbody>
    `;
    results.forEach(row => {
      html += `
        <tr>
          <td class="border px-2 py-1">${row.order}</td>
          <td class="border px-2 py-1">${row.brand}</td>
          <td class="border px-2 py-1">${row.type}</td>
          <td class="border px-2 py-1 text-right">${Number(row.quantity).toLocaleString()}</td>
          <td class="border px-2 py-1">${row.machine}</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
  }

  document.getElementById('searchResult').innerHTML = html;
}

function clearSearch() {
  document.getElementById('searchBox').value = '';
  document.getElementById('searchResult').innerHTML = '';
}
