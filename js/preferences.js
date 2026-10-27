// Preferences Management
function savePreferences() {
  const lock = document.getElementById('pref-lock-floor').checked;
  const margin = document.getElementById('pref-default-margin').value;
  const days = document.getElementById('pref-alert-days').value;
  try {
    localStorage.setItem('layak_pref', JSON.stringify({ lock, margin, days }));
  } catch(e) {}
}

function savePreferencesManual() {
  savePreferences();
  showToast('Preferensi berhasil disimpan ke penyimpanan lokal!');
  recalculate();
}

function resetDefaultPreferences() {
  document.getElementById('pref-lock-floor').checked = true;
  document.getElementById('pref-default-margin').value = '20';
  document.getElementById('pref-alert-days').value = '3';
  savePreferences();
  showToast('Pengaturan dikembalikan ke setelan awal');
  recalculate();
}

function loadSavedPreferences() {
  try {
    const raw = localStorage.getItem('layak_pref');
    if (raw) {
      const pref = JSON.parse(raw);
      if (pref.lock !== undefined) document.getElementById('pref-lock-floor').checked = pref.lock;
      if (pref.margin !== undefined) document.getElementById('pref-default-margin').value = pref.margin;
      if (pref.days !== undefined) document.getElementById('pref-alert-days').value = pref.days;
    }
  } catch(e) {}
}

// Jadwal localStorage persistence
const JADWAL_STORAGE_KEY = 'layak_jadwal';

function saveJadwal(jadwalList) {
  try {
    localStorage.setItem(JADWAL_STORAGE_KEY, JSON.stringify(jadwalList));
  } catch(e) {}
}

function loadJadwal() {
  try {
    const raw = localStorage.getItem(JADWAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch(e) {}
  return null;
}

function hapusJadwal(id) {
  try {
    const existing = loadJadwal() || [];
    const filtered = existing.filter(item => item.id !== id);
    localStorage.setItem(JADWAL_STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch(e) {
    return null;
  }
}

// Escape HTML untuk mencegah XSS sederhana
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Render tabel jadwal dari localStorage
function renderJadwalTable() {
  const tbody = document.getElementById('jadwal-table-body');
  if (!tbody) return;

  const list = loadJadwal() || [];
  tbody.innerHTML = '';

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="py-10 text-center text-secondary">
          <p class="font-semibold text-on-surface">Belum ada produk terjadwal.</p>
          <p class="text-xs mt-1">Hitung produk di Kalkulator, lalu klik "Simpan ke Jadwal Otomatis".</p>
        </td>
      </tr>
    `;
    renderKalender();
    return;
  }

  list.forEach(item => {
    let expiryClass = 'bg-slate-100 text-slate-700';
    let expiryLabel = item.hari + ' Hari Lagi';
    if (item.hari <= 3) {
      expiryClass = 'bg-red-100 text-error';
      expiryLabel = item.hari + ' Hari Lagi';
    } else if (item.hari <= 7) {
      expiryClass = 'bg-amber-100 text-amber-900';
    }

    const tanggalLabel = formatTanggalPendek(getItemTanggal(item));
    const hargaLabel = Number(item.harga) > 0 ? formatRupiah(item.harga) : '-';
    const modalLabel = Number(item.modal) > 0 ? formatRupiah(item.modal) : '-';

    const row = document.createElement('tr');
    row.className = 'hover:bg-surface/80 transition-colors';
    row.innerHTML = `
      <td class="py-3 px-4">
        <div class="font-bold text-on-surface">${escapeHtml(item.nama)}</div>
        <span class="text-[10px] text-secondary">Modal: ${modalLabel} • Jual: ${hargaLabel}</span>
      </td>
      <td class="py-3 px-3">
        <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">${escapeHtml(item.kategori)}</span>
      </td>
      <td class="py-3 px-3 font-semibold text-primary">${tanggalLabel}</td>
      <td class="py-3 px-3 font-bold text-on-surface">${item.stok.toLocaleString('id-ID')} unit</td>
      <td class="py-3 px-3 text-secondary">${item.velocity} unit/hari</td>
      <td class="py-3 px-3">
        <span class="px-2 py-0.5 rounded ${expiryClass} font-bold text-[10px]">${expiryLabel}</span>
      </td>
      <td class="py-3 px-3">
        <span class="font-black text-primary">${item.diskon}%</span>
      </td>
      <td class="py-3 px-4 text-right whitespace-nowrap">
        <button onclick="openJadwalItem('${item.id}')" class="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-container text-on-surface border border-surface-container font-bold text-[11px] inline-flex items-center gap-1 transition-all mr-1" type="button">
          <span class="material-symbols-outlined text-[14px]">calculate</span>
          <span>Buka</span>
        </button>
        <button onclick="hapusSatuJadwal('${item.id}')" class="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 font-bold text-[11px] inline-flex items-center gap-1 transition-all" type="button">
          <span class="material-symbols-outlined text-[14px]">delete</span>
          <span>Hapus</span>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });

  renderKalender();
}

// Buka item jadwal ke kalkulator berdasarkan id (aman dari karakter kutip)
function openJadwalItem(id) {
  const list = loadJadwal() || [];
  const item = list.find(it => it.id === id);
  if (!item) {
    showToast('Item jadwal tidak ditemukan', 'warning');
    return;
  }
  loadProductToCalculator(item.nama, Number(item.modal) || 0, Number(item.harga) || 0, Number(item.target) || 0, item.stok, item.velocity, item.hari, item.diskon);
}

// Hapus satu item jadwal berdasarkan id
function hapusSatuJadwal(id) {
  if (!confirm('Yakin ingin menghapus jadwal ini?')) return;
  const result = hapusJadwal(id);
  if (result !== null) {
    renderJadwalTable();
    generateDateRecommendations(true);
    if (typeof generateAutoBundles === 'function') generateAutoBundles(true);
    if (typeof selectedKalenderDate !== 'undefined' && selectedKalenderDate) {
      selectKalenderDay(selectedKalenderDate);
    }
    showToast('Jadwal berhasil dihapus');
  }
}

// Helper: tanggal hari ini dalam format YYYY-MM-DD
function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Helper: ambil tanggal item (fallback ke createdAt / hari ini)
function getItemTanggal(item) {
  if (item.tanggal) return item.tanggal;
  if (item.createdAt) return String(item.createdAt).slice(0, 10);
  return todayISO();
}

// Helper: apakah item urgent (stok belum habis sebelum expired / sisa <=3 hari)
function isItemUrgent(item) {
  const hari = Math.max(1, Number(item.hari) || 1);
  const stok = Number(item.stok) || 0;
  const velocity = Math.max(0.5, Number(item.velocity) || 1);
  const daysToExhaust = Math.max(1, Math.ceil(stok / velocity));
  return daysToExhaust > hari || hari <= 3;
}

// Bersihkan sisa data demo lama (id berawalan "demo-") agar tidak tampil lagi
function purgeDemoData() {
  try {
    const list = loadJadwal() || [];
    const filtered = list.filter(function (it) { return !String(it.id).startsWith('demo-'); });
    if (filtered.length !== list.length) saveJadwal(filtered);
  } catch (e) {}
}

// Migrasi: item lama tanpa tanggal diberi tanggal rekomendasi sistem
function migrateJadwalDates() {
  const list = loadJadwal() || [];
  let changed = false;
  list.forEach(it => {
    if (!it.tanggal && typeof recommendPromoDate === 'function') {
      const reco = recommendPromoDate(it);
      it.tanggal = dateToISO(reco.startDate);
      it.alasan = reco.reasons.join(', ');
      changed = true;
    }
  });
  if (changed) saveJadwal(list);
}

// Helper: format tanggal 'YYYY-MM-DD' -> '12 Nov 2026'
function formatTanggalPendek(iso) {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d} ${months[m - 1]} ${y}`;
}

// Helper: format tanggal lengkap -> 'Senin, 12 November 2026'
function formatTanggalPanjang(iso) {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-').map(Number);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dt = new Date(y, m - 1, d);
  return `${days[dt.getDay()]}, ${d} ${months[m - 1]} ${y}`;
}

// Reset formulir jadwal
function resetJadwalForm() {
  const form = document.getElementById('jadwal-form');
  if (form) form.reset();
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  setVal('j-stok', '30');
  setVal('j-velocity', '5');
  setVal('j-hari', '7');
  setVal('j-diskon', '10');
}

// Simpan data kalkulator saat ini ke jadwal localStorage
function simpanKeJadwalDariKalkulator() {
  const nama = inputNama.value.trim() || 'Produk Tanpa Nama';
  const stok = parseFloat(inputStok.value) || 0;
  const velocity = parseFloat(inputVelocity.value) || 1;
  const hari = Math.max(1, parseFloat(inputHari.value) || 1);
  const diskon = parseFloat(slider.value) || 0;

  // Tentukan rekomendasi waktu berdasarkan urgency
  let waktu = 'Sesuai Jadwal';
  if (hari <= 3) waktu = 'Hari ini (Flash Sale)';
  else if (hari <= 7) waktu = 'Besok - 3 Hari Depan';

  const kategori = 'Umum';
  const harga = parseFloat(inputNormal.value) || 0;
  const modal = parseFloat(inputModal.value) || 0;
  const target = parseFloat(inputTargetLaba.value) || 0;

  // Tanggal otomatis dari sistem rekomendasi
  const reco = recommendPromoDate({ hari, velocity, stok });
  const tanggal = dateToISO(reco.startDate);
  const alasan = reco.reasons.join(', ');

  const item = {
    id: Date.now().toString(),
    nama,
    kategori,
    stok,
    velocity,
    hari,
    diskon,
    waktu,
    tanggal,
    alasan,
    harga,
    modal,
    target,
    createdAt: new Date().toISOString()
  };

  const list = loadJadwal() || [];
  list.push(item);
  saveJadwal(list);
  generateDateRecommendations(true);
  renderJadwalTable();
  if (typeof generateAutoBundles === 'function') generateAutoBundles(true);
  showTab('jadwal');

  // Ambil tanggal final (bisa digeser sistem agar tidak menumpuk)
  const finalEntry = (typeof dateRecommendations !== 'undefined' ? dateRecommendations : []).find(e => e.id === item.id);
  const finalTanggal = finalEntry ? dateToISO(finalEntry.reco.startDate) : tanggal;

  focusKalenderOn(finalTanggal, true);
  showToast(`"${nama}" disimpan ke Jadwal • tanggal ${formatTanggalPendek(finalTanggal)}`);
}

// ============================================================
// KALENDER JADWAL
// ============================================================
let currentKalenderDate = new Date();
let selectedKalenderDate = null;

// Toggle view tabel / kalender (aman bila salah satu wadah tidak ada)
function setJadwalView(view) {
  const tabelContainer = document.getElementById('jadwal-view-tabel-container');
  const kalenderContainer = document.getElementById('jadwal-view-kalender-container');
  const btnTabel = document.getElementById('jadwal-view-tabel');
  const btnKalender = document.getElementById('jadwal-view-kalender');

  if (!tabelContainer || !kalenderContainer) {
    if (view === 'kalender') renderKalender();
    return;
  }

  const activeClass = 'px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold transition-all shadow-xs';
  const inactiveClass = 'px-3 py-1.5 rounded-lg border border-surface-container text-secondary text-xs font-bold hover:bg-surface transition-all';

  if (view === 'kalender') {
    tabelContainer.classList.add('hidden');
    kalenderContainer.classList.remove('hidden');
    if (btnTabel) btnTabel.className = inactiveClass;
    if (btnKalender) btnKalender.className = activeClass;
    renderKalender();
  } else {
    kalenderContainer.classList.add('hidden');
    tabelContainer.classList.remove('hidden');
    if (btnKalender) btnKalender.className = inactiveClass;
    if (btnTabel) btnTabel.className = activeClass;
  }
}

// Peta tanggal rekomendasi sistem: { 'YYYY-MM-DD': { items, reasons } }
function buildRecoMap() {
  const map = {};
  (typeof dateRecommendations !== 'undefined' && dateRecommendations ? dateRecommendations : []).forEach(entry => {
    if (!entry || !entry.reco || !entry.reco.startDate) return;
    const iso = dateToISO(entry.reco.startDate);
    if (!map[iso]) map[iso] = { items: [], reasons: [] };
    map[iso].items.push(entry.item);
    entry.reco.reasons.forEach(r => {
      if (!map[iso].reasons.includes(r)) map[iso].reasons.push(r);
    });
  });
  return map;
}

// Banner ringkasan tanggal rekomendasi + hari besar di atas grid kalender
function renderKalenderRecoBanner() {
  const el = document.getElementById('kalender-reco-banner');
  if (!el) return;

  const map = buildRecoMap();
  const dates = Object.keys(map).sort();
  const monthEvents = getPromoEventsForMonth(currentKalenderDate.getFullYear(), currentKalenderDate.getMonth());

  const hariBesar = monthEvents.filter(e => e.tipe === 'libur-nasional' || e.tipe === 'libur-keagamaan');
  const tanggalKembar = monthEvents.filter(e => e.tipe === 'promo-tanggal-kembar');

  const hariBesarBlock = hariBesar.length ? `
    <div class="${dates.length ? 'mt-2 pt-2 border-t border-blue-200/70' : ''}">
      <div class="flex items-center gap-1.5 mb-1">
        <span class="material-symbols-outlined text-[13px] text-violet-600">celebration</span>
        <span class="text-[10px] font-extrabold uppercase tracking-wider text-violet-700">Hari besar bulan ini</span>
      </div>
      <div class="flex flex-wrap gap-1">
        ${hariBesar.map(e => {
          const selected = e.iso === selectedKalenderDate;
          return `<button type="button" onclick="selectKalenderDay('${e.iso}')" class="text-left px-2 py-1 rounded-lg border transition-all text-[10px] ${selected ? 'border-violet-600 bg-violet-600 text-white' : 'border-violet-200 bg-white text-violet-700 hover:bg-violet-50'}">
            <span class="block font-extrabold">${formatTanggalPendek(e.iso)}</span>
            <span class="block ${selected ? 'text-violet-100' : 'text-violet-500'}">${escapeHtml(e.nama)}</span>
          </button>`;
        }).join('')}
      </div>
    </div>
  ` : '';

  const tanggalKembarBlock = tanggalKembar.length ? `
    <div class="${dates.length ? 'mt-2 pt-2 border-t border-blue-200/70' : ''}">
      <div class="flex items-center gap-1.5 mb-1">
        <span class="material-symbols-outlined text-[13px] text-amber-600">shopping_bag</span>
        <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Promo tanggal kembar bulan ini</span>
      </div>
      <div class="flex flex-wrap gap-1">
        ${tanggalKembar.map(e => {
          const selected = e.iso === selectedKalenderDate;
          return `<button type="button" onclick="selectKalenderDay('${e.iso}')" class="text-left px-2 py-1 rounded-lg border transition-all text-[10px] ${selected ? 'border-amber-600 bg-amber-600 text-white' : 'border-amber-200 bg-white text-amber-700 hover:bg-amber-50'}">
            <span class="block font-extrabold">${formatTanggalPendek(e.iso)}</span>
            <span class="block ${selected ? 'text-amber-100' : 'text-amber-500'}">${escapeHtml(e.nama)}</span>
          </button>`;
        }).join('')}
      </div>
    </div>
  ` : '';

  const eventBlock = hariBesarBlock + tanggalKembarBlock;

  if (dates.length === 0) {
    el.innerHTML = (monthEvents.length
      ? ''
      : `<p class="text-[10px] text-slate-500">Belum ada rekomendasi. Simpan produk dari Kalkulator agar sistem menentukan tanggal promo terbaik.</p>`) + eventBlock;
    return;
  }

  const monthPrefix = `${currentKalenderDate.getFullYear()}-${pad2(currentKalenderDate.getMonth() + 1)}`;
  let visible = dates.filter(d => d.startsWith(monthPrefix));
  const fallback = visible.length === 0;
  if (fallback) visible = dates.slice(0, 3);

  el.innerHTML = `
    <div class="flex items-center gap-1.5 mb-1.5">
      <span class="material-symbols-outlined text-[14px] text-primary">auto_awesome</span>
      <span class="text-[10px] font-extrabold uppercase tracking-wider text-primary">Rekomendasi sistem${fallback ? ' • tanggal terdekat' : ''}</span>
    </div>
    <div class="flex flex-wrap gap-1">
      ${visible.map(d => {
        const info = map[d];
        const selected = d === selectedKalenderDate;
        const reason = info.reasons.slice(0, 2).join(', ');
        return `<button type="button" onclick="selectKalenderDay('${d}')" title="${escapeHtml(info.reasons.join(', '))}" class="text-left px-2 py-1 rounded-lg border transition-all text-[10px] ${selected ? 'border-primary bg-primary text-white' : 'border-blue-200 bg-white text-slate-700 hover:bg-blue-50'}">
          <span class="block font-extrabold">★ ${formatTanggalPendek(d)}${info.items.length > 1 ? ` • ${info.items.length} produk` : ''}</span>
          <span class="block ${selected ? 'text-blue-100' : 'text-slate-500'}">${escapeHtml(reason)}</span>
        </button>`;
      }).join('')}
    </div>
    ${eventBlock}
  `;
}

// Render grid kalender untuk bulan aktif
function renderKalender() {
  const grid = document.getElementById('kalender-grid');
  const label = document.getElementById('kalender-bulan-label');
  const yearNote = document.getElementById('kalender-year-note');
  if (!grid) return;

  const year = currentKalenderDate.getFullYear();
  const month = currentKalenderDate.getMonth();
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  if (label) label.textContent = `${monthNames[month]} ${year}`;
  if (yearNote) yearNote.textContent = `Tanggal dan rekomendasi tahun ${year}`;

  const todayStr = todayISO();

  grid.innerHTML = '';

  // Grid 42 sel (6 baris) seperti kalender referensi
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = dateToISO(d);
    const isOutside = d.getMonth() !== month;
    const isToday = iso === todayStr;
    const isSelected = iso === selectedKalenderDate;
    const dayEvents = getPromoEventsForMonth(d.getFullYear(), d.getMonth()).filter(e => e.iso === iso);

    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'relative min-h-[96px] p-1.5 border-r border-b border-slate-200 text-left transition-colors text-[10px] flex flex-col gap-1 ' +
      (isOutside ? 'bg-slate-50/60 text-slate-400 hover:bg-slate-100/60' : 'bg-white hover:bg-blue-50/40') +
      (isToday ? ' bg-violet-50' : '') +
      (isSelected ? ' ring-2 ring-inset ring-primary bg-primary/10' : '');
    cell.onclick = () => selectKalenderDay(iso);

    // Kumpulkan chip, batasi 3 tampil + "+N lainnya"
    // Warna mengikuti kategori referensi: hari besar = abu-abu, tanggal kembar = kuning
    const chipItems = [];
    dayEvents.forEach(ev => {
      const isPromo = ev.tipe === 'promo-tanggal-kembar';
      chipItems.push(`<span title="${escapeHtml(ev.nama)}" class="block truncate rounded px-1 py-0.5 text-white font-extrabold" style="background:${isPromo ? '#f59e0b' : '#64748b'}">${isPromo ? '🛍️' : '🎉'} ${escapeHtml(ev.nama)}</span>`);
    });
    // Momen berulang seperti referensi
    const dayNum = d.getDate();
    if (dayNum >= 25 && dayNum <= 28) {
      chipItems.push(`<span class="block truncate rounded px-1 py-0.5 text-white font-extrabold" style="background:#f59e0b">💳 Payday Sale</span>`);
    }
    const dow = d.getDay();
    if (dow === 5 || dow === 6 || dow === 0) {
      chipItems.push(`<span class="block truncate rounded px-1 py-0.5 text-white font-extrabold" style="background:#0f766e">🗓 Promo Weekend</span>`);
    }
    let chips = chipItems.slice(0, 3).join('');
    if (chipItems.length > 3) {
      chips += `<span class="block text-[9px] text-secondary font-bold">+${chipItems.length - 3} lainnya</span>`;
    }

    const dayColor = isToday ? 'text-primary' : (isOutside ? 'text-slate-400' : 'text-slate-900');
    cell.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="font-bold ${dayColor}">${d.getDate()}</span>
        ${isToday ? '<span class="text-[8px] font-extrabold text-primary">HARI INI</span>' : ''}
      </div>
      <div class="space-y-0.5 overflow-hidden">${chips}</div>
    `;
    grid.appendChild(cell);
  }
}

// Pilih tanggal di kalender -> tampilkan detail jadwal + alasan rekomendasi
function selectKalenderDay(iso) {
  selectedKalenderDate = iso;
  renderKalender();

  const panel = document.getElementById('kalender-events');
  if (!panel) return;

  const [isoYear, isoMonth] = String(iso).split('-').map(Number);
  const dayEvents = getPromoEventsForMonth(isoYear, (isoMonth || 1) - 1).filter(e => e.iso === iso);
  const dayNum = Number(String(iso).split('-')[2]);
  const dow = new Date(isoYear, (isoMonth || 1) - 1, dayNum).getDay();
  const isPayday = dayNum >= 25 && dayNum <= 28;
  const isWeekend = dow === 5 || dow === 6 || dow === 0;

  const eventBlock = dayEvents.length ? `
    <div class="p-2.5 rounded-xl border mb-1 ${dayEvents.some(e => e.tipe === 'promo-tanggal-kembar') ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-300'}">
      <div class="flex items-center gap-1.5 mb-1">
        <span class="material-symbols-outlined text-[15px] ${dayEvents.some(e => e.tipe === 'promo-tanggal-kembar') ? 'text-amber-600' : 'text-slate-600'}">${dayEvents.some(e => e.tipe === 'promo-tanggal-kembar') ? 'shopping_bag' : 'celebration'}</span>
        <span class="text-[10px] font-extrabold uppercase tracking-wider ${dayEvents.some(e => e.tipe === 'promo-tanggal-kembar') ? 'text-amber-900' : 'text-slate-700'}">${dayEvents.some(e => e.tipe === 'promo-tanggal-kembar') ? 'Promo Tanggal Kembar' : 'Hari Besar'}</span>
      </div>
      <div class="flex flex-wrap gap-1">
        ${dayEvents.map(e => `<span class="px-1.5 py-0.5 rounded ${e.tipe === 'promo-tanggal-kembar' ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-700'} text-[9px] font-bold">${escapeHtml(e.nama)}</span>`).join('')}
      </div>
      <p class="text-[10px] ${dayEvents.some(e => e.tipe === 'promo-tanggal-kembar') ? 'text-amber-700' : 'text-slate-600'} mt-1">${dayEvents.some(e => e.tipe === 'promo-tanggal-kembar') ? 'Momentum flash sale / tanggal kembar — cocok untuk campaign diskon.' : 'Hari libur nasional / keagamaan — cocok untuk promo bila stok dan margin mendukung.'}</p>
      <p class="text-[10px] ${dayEvents.some(e => e.tipe === 'promo-tanggal-kembar') ? 'text-amber-800' : 'text-slate-700'} mt-1 leading-relaxed"><b>Saran:</b> ${escapeHtml(getPromoEventTip(dayEvents[0]))}</p>
    </div>
  ` : '';

  const paydayBlock = isPayday ? `
    <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-200 mb-1">
      <div class="flex items-center gap-1.5 mb-1">
        <span class="material-symbols-outlined text-[15px] text-amber-600">payments</span>
        <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-900">Payday Sale</span>
      </div>
      <p class="text-[10px] text-amber-800 leading-relaxed">Periode gajian akhir bulan — daya beli pelanggan meningkat. <b>Saran:</b> uji promo 2–4 hari dan ukur laba bersih, bukan hanya jumlah transaksi.</p>
    </div>
  ` : '';

  const weekendBlock = isWeekend ? `
    <div class="p-2.5 rounded-xl bg-teal-50 border border-teal-200 mb-1">
      <div class="flex items-center gap-1.5 mb-1">
        <span class="material-symbols-outlined text-[15px] text-teal-700">event</span>
        <span class="text-[10px] font-extrabold uppercase tracking-wider text-teal-900">Promo Weekend</span>
      </div>
      <p class="text-[10px] text-teal-800 leading-relaxed">Akhir pekan cocok untuk promo singkat. <b>Saran:</b> makanan/minuman bisa pakai paket keluarga; tetapkan batas stok dan durasi.</p>
    </div>
  ` : '';

  if (!dayEvents.length && !isPayday && !isWeekend) {
    panel.innerHTML = `
      <h3 class="text-sm font-bold text-slate-900">${formatTanggalPanjang(iso)}</h3>
      <p class="text-[11px] text-slate-500 mt-1">Belum ada momen promosi khusus yang ditandai pada tanggal ini.</p>
      <div class="mt-2 rounded-xl bg-slate-50 border border-slate-200 p-3 text-[10px] leading-relaxed text-slate-600">
        <b class="text-slate-700">Ide umum:</b> cek pola penjualan sebelumnya, stok, dan margin. Anda bisa menguji promo akhir pekan atau kampanye kategori jika relevan.
      </div>
    `;
    return;
  }

  panel.innerHTML = `
    <h3 class="text-sm font-bold text-slate-900 mb-2">${formatTanggalPanjang(iso)}</h3>
    ${eventBlock}
    ${paydayBlock}
    ${weekendBlock}
  `;
}

function kalenderPrevMonth() {
  currentKalenderDate.setMonth(currentKalenderDate.getMonth() - 1);
  selectedKalenderDate = null;
  renderKalender();
}

function kalenderNextMonth() {
  currentKalenderDate.setMonth(currentKalenderDate.getMonth() + 1);
  selectedKalenderDate = null;
  renderKalender();
}

function kalenderToday() {
  currentKalenderDate = new Date();
  selectedKalenderDate = todayISO();
  renderKalender();
  selectKalenderDay(selectedKalenderDate);
}

// Buka tampilan kalender tepat pada tanggal tertentu (opsional scroll ke kalender)
function focusKalenderOn(iso, scroll) {
  if (!iso) return;
  const [y, m] = String(iso).split('-').map(Number);
  if (y && m) currentKalenderDate = new Date(y, m - 1, 1);
  selectedKalenderDate = iso;
  setJadwalView('kalender');
  selectKalenderDay(iso);
  if (scroll) {
    const el = document.getElementById('jadwal-view-kalender-container');
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

// ============================================================
// PAKET BUNDLING
// ============================================================
const BUNDLE_STORAGE_KEY = 'layak_bundles';

function loadBundles() {
  try {
    const raw = localStorage.getItem(BUNDLE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function saveBundles(list) {
  try {
    localStorage.setItem(BUNDLE_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
}

// Inisialisasi tab bundling saat app dimuat
function initBundleTab() {
  if (typeof initManualBundle === 'function') initManualBundle();

  // Alur referensi: kalkulator manual tampil paling atas (setelah intro)
  const tab = document.getElementById('tab-bundling');
  const manual = document.getElementById('manual-bundle-panel');
  if (tab && manual) {
    const first = tab.firstElementChild;
    if (first && first !== manual) first.insertAdjacentElement('afterend', manual);
  }
}

// Status ringkas simulasi manual (dipakai UI & PDF)
function manualStatusInfo(h) {
  if (h.missing) {
    return { type: 'warn', cls: 'bg-amber-50 border-amber-200 text-amber-900', msg: 'Lengkapi nama, modal, dan harga normal semua produk.' };
  }
  if (h.totalNormal <= 0) {
    return { type: 'warn', cls: 'bg-amber-50 border-amber-200 text-amber-900', msg: 'Masukkan harga normal lebih dari Rp 0 untuk menghitung paket.' };
  }
  if (h.laba < 0) {
    return { type: 'bad', cls: 'bg-rose-50 border-rose-200 text-rose-900', msg: 'RUGI: harga bundling lebih rendah daripada modal. Kurangi diskon atau tinjau biaya.' };
  }
  if (h.laba < h.profitTarget || h.margin + 1e-9 < h.marginTarget) {
    var maks = h.feasible ? h.diskonMaks.toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '%' : '0%';
    return { type: 'warn', cls: 'bg-amber-50 border-amber-200 text-amber-900', msg: 'Perlu ditinjau: laba atau margin belum memenuhi target. Diskon maks aman sekitar ' + maks + '.' };
  }
  return { type: 'ok', cls: 'bg-emerald-50 border-emerald-200 text-emerald-900', msg: 'Sesuai target: paket masih menghasilkan laba dan memenuhi target margin.' };
}

// Unduh ringkasan kalkulator bundling sebagai PDF rapi (hanya informasi)
function downloadManualBundlePdf() {
  if (typeof PdfReport !== 'function' || typeof downloadPdf !== 'function') {
    showToast('Fitur PDF tidak tersedia', 'warning');
    return;
  }

  var h = computeManualBundle();
  if (h.missing || h.totalNormal <= 0) {
    showToast('Lengkapi data produk terlebih dahulu', 'warning');
    return;
  }

  var info = manualStatusInfo(h);
  var report = new PdfReport();
  report.title('Ringkasan Kalkulator Bundling', 'LayakDiskon - Asisten Keputusan Diskon UMKM');
  report.meta('Dibuat: ' + new Date().toLocaleString('id-ID'));

  report.section('Produk dalam Paket');
  report.table(
    ['Produk', 'Modal/unit', 'Harga normal'],
    h.products.map(function (p) {
      return [p.nama || '-', formatRupiah(p.modal), formatRupiah(p.harga)];
    }),
    [0.5, 0.25, 0.25],
    ['left', 'right', 'right']
  );

  report.section('Parameter Simulasi');
  report.row('Jumlah paket direncanakan', h.packagesQty + ' paket');
  report.row('Biaya tambahan per paket', formatRupiah(h.extra));
  report.row('Diskon bundling', h.diskon + '%');
  report.row('Target margin minimum', h.marginTarget + '%');
  report.row('Target laba minimum/paket', formatRupiah(h.profitTarget));

  report.section('Ringkasan Perhitungan');
  report.row('Harga normal paket', formatRupiah(h.totalNormal));
  report.row('Total modal per paket', formatRupiah(h.totalModal));
  report.row('Harga bundling ditawarkan', formatRupiah(h.hargaBundle));
  report.row('Hemat pelanggan', formatRupiah(h.hemat));
  report.row('Laba per paket', formatRupiah(h.laba), {
    color: h.laba < 0 ? PDF_COLORS.red : PDF_COLORS.green
  });
  report.row('Margin laba', h.margin.toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '%');
  report.row('Diskon maksimum aman', h.feasible ? h.diskonMaks.toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '%' : '-');
  report.row('Harga minimum target', formatRupiah(h.hargaMinTarget));
  report.row('Estimasi laba total', formatRupiah(h.labaTotal) + ' (' + h.packagesQty + ' paket)');

  report.section('Kesimpulan');
  report.status(info.msg, info.type);

  report.section('Catatan');
  report.paragraph('Dokumen ini dibuat otomatis oleh LayakDiskon. Ini alat bantu simulasi, bukan penentu harga otomatis. Pastikan semua biaya relevan sudah dimasukkan; pajak dan biaya platform belum dihitung kecuali dimasukkan ke biaya tambahan.');

  downloadPdf('layakdiskon-bundling-' + (typeof todayISO === 'function' ? todayISO() : 'hasil') + '.pdf', report);
  showToast('PDF berhasil diunduh');
}

// Render daftar paket tersimpan
function renderBundleList() {
  const container = document.getElementById('bundle-list');
  if (!container) return;
  const list = loadBundles();

  const countEl = document.getElementById('bundle-count');
  if (countEl) countEl.textContent = list.length;

  if (list.length === 0) {
    container.innerHTML = '<p class="text-[11px] text-secondary text-center py-4">Belum ada paket tersimpan.</p>';
    return;
  }

  container.innerHTML = list.map(b => {
    const products = Array.isArray(b.products) ? b.products : [];
    const totalNormal = Number(b.totalNormal) || 0;
    const totalModal = Number(b.totalModal) || 0;
    const totalHarga = Number(b.totalHarga) || 0;
    const totalLaba = Number(b.totalLaba) || 0;
    const potongan = Math.max(0, totalNormal - totalHarga);
    const diskon = Number(b.diskon) || 0;

    const produkRows = products.map(p => {
      const qty = Math.max(1, Math.floor(Number(p.qty) || 1));
      return `
      <div class="flex items-baseline justify-between gap-3 py-1 border-b border-dashed border-slate-200 last:border-0">
        <span class="min-w-0 truncate text-xs font-semibold leading-snug text-slate-800">${escapeHtml(p.nama)}${qty > 1 ? ` <span class="text-[10px] font-bold text-slate-400">×${qty}</span>` : ''}</span>
        <span class="shrink-0 text-xs font-bold leading-snug tabular-nums text-slate-900">${formatRupiah((Number(p.harga) || 0) * qty)}</span>
      </div>
    `;
    }).join('');

    return `
    <div class="p-2.5 rounded-xl border border-surface-container bg-surface">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <div class="font-bold text-xs text-on-surface truncate">${escapeHtml(b.nama)}</div>
          <div class="text-[11px] font-medium text-slate-500 mt-0.5">${products.length} produk • diskon ${diskon}%${(Number(b.packagesQty) || 1) > 1 ? ` • ${Number(b.packagesQty)} paket` : ''}</div>
        </div>
        <button onclick="hapusBundle('${b.id}')" class="shrink-0 w-6 h-6 rounded-md bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-all" title="Hapus paket" type="button">
          <span class="material-symbols-outlined text-[14px]">delete</span>
        </button>
      </div>

      <div class="mt-2 rounded-lg bg-white border border-slate-200 overflow-hidden">
        <div class="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border-b border-slate-200">
          <span class="material-symbols-outlined text-[13px] text-primary">receipt_long</span>
          <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Rincian Produk</span>
        </div>
        <div class="px-2.5 py-1">
          ${produkRows || '<div class="text-[11px] text-slate-500 py-1.5">Tidak ada rincian produk</div>'}
        </div>
      </div>

      <div class="mt-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2">
        <div class="flex items-baseline justify-between gap-3 text-[11px] leading-relaxed">
          <span class="font-medium text-slate-500">Total Normal</span>
          <span class="shrink-0 font-semibold tabular-nums text-slate-400 line-through">${formatRupiah(totalNormal)}</span>
        </div>
        <div class="flex items-baseline justify-between gap-3 text-[11px] leading-relaxed">
          <span class="font-medium text-slate-500">Total Modal</span>
          <span class="shrink-0 font-semibold tabular-nums text-slate-600">${formatRupiah(totalModal)}</span>
        </div>
        <div class="flex items-baseline justify-between gap-3 text-[11px] leading-relaxed">
          <span class="font-medium text-slate-500">Potongan (${diskon}%)</span>
          <span class="shrink-0 font-bold tabular-nums text-amber-700">- ${formatRupiah(potongan)}</span>
        </div>
        <div class="my-1.5 border-t border-slate-200"></div>
        <div class="flex items-baseline justify-between gap-3">
          <span class="text-xs font-bold text-slate-900">Harga Paket</span>
          <span class="shrink-0 text-sm font-black tabular-nums text-primary">${formatRupiah(totalHarga)}</span>
        </div>
        <div class="flex items-baseline justify-between gap-3 mt-0.5">
          <span class="text-xs font-bold text-slate-900">Laba</span>
          <span class="shrink-0 text-sm font-black tabular-nums ${totalLaba >= 0 ? 'text-emerald-700' : 'text-error'}">${formatRupiah(totalLaba)}</span>
        </div>
      </div>
    </div>
  `;
  }).join('');
}

// Hapus paket
function hapusBundle(id) {
  if (!confirm('Yakin ingin menghapus paket ini?')) return;
  const list = loadBundles().filter(b => b.id !== id);
  saveBundles(list);
  renderBundleList();
  showToast('Paket berhasil dihapus');
}

// ============================================================
// SIMULASI PAKET MANUAL
// ============================================================
let manualBundleInitialized = false;

function defaultManualRows() {
  return [
    { nama: '', modal: '', harga: '', qty: 1 }
  ];
}

// Inisialisasi form manual sekali saat tab bundling pertama dibuka
function initManualBundle() {
  const container = document.getElementById('manual-rows');
  if (!container || manualBundleInitialized) return;

  container.innerHTML = '';
  defaultManualRows().forEach(r => addManualRow(r.nama, r.modal, r.harga, true));

  ['mb-packages', 'mb-extra', 'mb-diskon', 'mb-margin-target', 'mb-profit-target'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calcManualBundle);
  });

  manualBundleInitialized = true;
  calcManualBundle();
}

// Tambah satu baris produk manual (element sama seperti referensi: nama, modal, harga, hapus)
function addManualRow(nama, modal, harga, silent) {
  const container = document.getElementById('manual-rows');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'mb-row grid grid-cols-[1.4fr_1fr_1fr_32px] gap-2 items-center';

  row.innerHTML = `
    <input class="mb-nama min-w-0 w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all" type="text" placeholder="Nama produk" value="${escapeHtml(nama || '')}">
    <input class="mb-modal min-w-0 w-full px-2 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-900 tabular-nums focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all" type="number" min="0" step="500" placeholder="Modal" value="${modal != null ? modal : ''}">
    <input class="mb-harga min-w-0 w-full px-2 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-900 tabular-nums focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all" type="number" min="0" step="500" placeholder="Harga" value="${harga != null ? harga : ''}">
    <button type="button" class="mb-remove w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-all" title="Hapus produk">
      <span class="material-symbols-outlined text-[15px]">close</span>
    </button>
  `;

  row.querySelectorAll('input').forEach(inp => inp.addEventListener('input', calcManualBundle));
  row.querySelector('.mb-remove').addEventListener('click', function () {
    if (container.querySelectorAll('.mb-row').length <= 1) {
      showToast('Minimal satu produk dalam paket', 'warning');
      return;
    }
    row.remove();
    calcManualBundle();
  });

  container.appendChild(row);
  if (!silent) calcManualBundle();
}

// Baca semua input simulasi manual
function readManualInputs() {
  const container = document.getElementById('manual-rows');
  const rows = container ? Array.from(container.querySelectorAll('.mb-row')) : [];

  const products = rows.map(function (row) {
    const namaEl = row.querySelector('.mb-nama');
    const modalEl = row.querySelector('.mb-modal');
    const hargaEl = row.querySelector('.mb-harga');
    return {
      nama: (namaEl.value || '').trim(),
      modal: Math.max(0, Number(modalEl.value) || 0),
      harga: Math.max(0, Number(hargaEl.value) || 0),
      hasModal: modalEl.value !== '',
      hasHarga: hargaEl.value !== ''
    };
  });

  const extra = Math.max(0, Number(document.getElementById('mb-extra').value) || 0);
  const packagesQty = Math.max(1, Math.floor(Number(document.getElementById('mb-packages').value) || 1));
  const diskon = Math.max(0, Math.min(80, Number(document.getElementById('mb-diskon').value) || 0));
  const marginTarget = Math.max(0, Math.min(99, Number(document.getElementById('mb-margin-target').value) || 0));
  const profitTarget = Math.max(0, Number(document.getElementById('mb-profit-target').value) || 0);

  return { products, extra, packagesQty, diskon, marginTarget, profitTarget };
}

// Hitung seluruh metrik paket manual
function computeManualBundle() {
  const data = readManualInputs();

  let totalNormal = 0;
  let totalModalProducts = 0;
  let missing = false;

  data.products.forEach(function (p) {
    totalNormal += p.harga;
    totalModalProducts += p.modal;
    if (!p.nama || !p.hasModal || !p.hasHarga) missing = true;
  });

  const totalModal = totalModalProducts + data.extra;
  const hargaBundle = Math.round(totalNormal * (1 - data.diskon / 100));
  const laba = hargaBundle - totalModal;
  const margin = hargaBundle > 0 ? (laba / hargaBundle) * 100 : 0;
  const hemat = totalNormal - hargaBundle;

  const m = data.marginTarget / 100;
  const hargaMinTarget = m < 1 ? totalModal / (1 - m) : 0;
  const feasible = totalNormal > 0 && hargaMinTarget <= totalNormal;
  const diskonMaks = feasible ? (1 - hargaMinTarget / totalNormal) * 100 : 0;
  const labaTotal = laba * data.packagesQty;

  return {
    products: data.products,
    extra: data.extra,
    packagesQty: data.packagesQty,
    diskon: data.diskon,
    marginTarget: data.marginTarget,
    profitTarget: data.profitTarget,
    totalNormal,
    totalModal,
    totalModalProducts,
    hargaBundle,
    laba,
    margin,
    hemat,
    hargaMinTarget,
    feasible,
    diskonMaks,
    labaTotal,
    missing
  };
}

// Render hasil simulasi manual ke UI
function calcManualBundle() {
  if (!document.getElementById('mb-status')) return;
  const h = computeManualBundle();

  const setText = function (id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText('mb-diskon-label', h.diskon + '%');
  setText('mb-harga', formatRupiah(h.hargaBundle));
  setText('mb-hemat', (h.hemat >= 0 ? 'Hemat pelanggan ' : 'Harga di atas normal ') + formatRupiah(Math.abs(h.hemat)));
  setText('mb-modal', formatRupiah(h.totalModal));
  setText('mb-laba', (h.laba < 0 ? '- ' : '') + formatRupiah(Math.abs(h.laba)));
  setText('mb-margin', 'Margin ' + h.margin.toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '%');
  setText('mb-diskon-maks', h.feasible ? h.diskonMaks.toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '%' : '0%');
  setText('mb-harga-min', formatRupiah(h.hargaMinTarget));
  setText('mb-normal', formatRupiah(h.totalNormal));
  setText('mb-laba-total', formatRupiah(h.labaTotal));
  setText('mb-laba-total-note', h.packagesQty + ' paket × laba/paket');
  setText('mb-diskon-maks-note', 'Dari target margin ' + h.marginTarget + '%');

  // Feedback langsung target margin
  const marginOk = h.margin + 1e-9 >= h.marginTarget;
  const marginLive = document.getElementById('mb-margin-live');
  if (marginLive) {
    marginLive.textContent = 'Margin saat ini ' +
      h.margin.toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '% - target ' +
      h.marginTarget + '% (' + (marginOk ? 'terpenuhi' : 'belum terpenuhi') + ')';
    marginLive.className = 'text-[10px] font-bold mt-1 ' + (marginOk ? 'text-emerald-600' : 'text-amber-600');
  }

  // Feedback langsung target laba nominal
  const profitOk = h.laba >= h.profitTarget;
  const profitLive = document.getElementById('mb-profit-live');
  if (profitLive) {
    profitLive.textContent = 'Laba saat ini ' + formatRupiah(h.laba) +
      ' - target ' + formatRupiah(h.profitTarget) + ' (' + (profitOk ? 'terpenuhi' : 'belum terpenuhi') + ')';
    profitLive.className = 'text-[10px] font-bold mt-1 ' + (profitOk ? 'text-emerald-600' : 'text-amber-600');
  }

  const labaEl = document.getElementById('mb-laba');
  if (labaEl) {
    labaEl.className = 'text-xs font-black mt-0.5 tabular-nums ' + (h.laba < 0 ? 'text-error' : 'text-emerald-600');
  }

  const statusEl = document.getElementById('mb-status');
  const info = manualStatusInfo(h);
  if (statusEl) {
    statusEl.className = 'mt-2 rounded-xl p-3 text-[11px] leading-relaxed border ' + info.cls;
    statusEl.textContent = info.msg;
  }
}

// Reset simulasi manual ke contoh awal
function resetManualBundle() {
  const container = document.getElementById('manual-rows');
  if (!container) return;

  container.innerHTML = '';
  defaultManualRows().forEach(function (r) {
    addManualRow(r.nama, r.modal, r.harga, true);
  });

  const setVal = function (id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  };
  setVal('mb-packages', 1);
  setVal('mb-extra', 0);
  setVal('mb-diskon', 10);
  setVal('mb-margin-target', 20);
  setVal('mb-profit-target', 0);

  calcManualBundle();
  showToast('Simulasi paket manual dikosongkan');
}

// Buka/tutup panel simulasi manual
function toggleManualBundle() {
  const body = document.getElementById('manual-bundle-body');
  const label = document.getElementById('manual-bundle-toggle-label');
  const icon = document.getElementById('manual-bundle-toggle-icon');
  if (!body) return;

  const hidden = body.classList.toggle('hidden');
  if (label) label.textContent = hidden ? 'Buka' : 'Tutup';
  if (icon) icon.textContent = hidden ? 'expand_more' : 'expand_less';
}

// Tips singkat per jenis event kalender
function getPromoEventTip(ev) {
  if (!ev) return '';
  if (ev.tipe === 'promo-tanggal-kembar') {
    return 'Tes promo terbatas dan bandingkan omzet serta laba dengan hari biasa.';
  }
  return 'Cocok untuk promo tematik bila stok dan margin mendukung. Verifikasi tanggal resmi dan cuti bersama.';
}

// Tips singkat berdasarkan alasan rekomendasi
function getReasonTip(reason) {
  const r = String(reason || '').toLowerCase();
  if (!r) return '';
  if (r.indexOf('gajian') !== -1) {
    return 'Uji promo 2–4 hari dan ukur laba bersih, bukan hanya jumlah transaksi.';
  }
  if (r.indexOf('weekend') !== -1 || r.indexOf('jumat') !== -1 || r.indexOf('sabtu') !== -1 || r.indexOf('minggu') !== -1) {
    return 'Makanan/minuman: paket keluarga. Tetapkan batas stok dan durasi promo.';
  }
  if (r.indexOf('expired') !== -1 || r.indexOf('kedaluwarsa') !== -1) {
    return 'Prioritaskan flash sale untuk memulihkan modal sebelum barang hangus.';
  }
  if (r.indexOf('tahun baru') !== -1 || r.indexOf('natal') !== -1 || r.indexOf('idul') !== -1 || r.indexOf('imlek') !== -1 || r.indexOf('nyepi') !== -1 || r.indexOf('waisak') !== -1 || r.indexOf('maulid') !== -1 || r.indexOf('kemerdekaan') !== -1 || r.indexOf('buruh') !== -1 || r.indexOf('valentine') !== -1 || r.indexOf('pancasila') !== -1) {
    return 'Siapkan stok dan batas diskon; jangan menurunkan harga di bawah batas aman.';
  }
  return '';
}

// ============================================================
// AUTO-BUNDLING (deterministik, tanpa server)
// ============================================================
let autoBundleShift = 0;
let autoBundleSuggestions = [];

function bundleMarginPct(p) {
  const harga = Number(p.harga) || 0;
  const modal = Number(p.modal) || 0;
  if (harga <= 0) return 0;
  return (harga - modal) / harga;
}

function generateAutoBundles(silent) {
  autoBundleShift = 0;
  rebuildAutoBundles(silent);
}

function reshuffleAutoBundles() {
  autoBundleShift += 1;
  rebuildAutoBundles();
}

// Perkirakan harga jual bila item lama belum menyimpan Harga Normal
function hargaEfektif(item) {
  const harga = Number(item.harga) || 0;
  if (harga > 0) return harga;
  const modal = Number(item.modal) || 0;
  if (modal <= 0) return 0;
  const target = Number(item.target) || 0;
  return Math.round(modal + Math.max(target, modal * 0.2));
}

function rebuildAutoBundles(silent) {
  const panel = document.getElementById('auto-bundle-panel');
  const allItems = loadJadwal() || [];
  const list = allItems
    .map(it => {
      const harga = hargaEfektif(it);
      return Object.assign({}, it, { harga, hargaEstimasi: !(Number(it.harga) > 0) && harga > 0 });
    })
    .filter(it => it.harga > 0);

  if (list.length < 2) {
    autoBundleSuggestions = [];
    if (panel) panel.classList.remove('hidden');
    const msg = allItems.length === 0
      ? 'Belum ada produk terjadwal. Simpan minimal dua produk dari Kalkulator agar rekomendasi paket muncul.'
      : `${allItems.length} produk terjadwal, tetapi harga jualnya belum lengkap. Buka produk dari Kalkulator lalu simpan ulang.`;
    renderAutoBundleSuggestions(msg);
    if (!silent) showToast('Butuh minimal 2 produk dengan harga jual', 'warning');
    return;
  }

  const maxHari = Math.max(...list.map(it => Number(it.hari) || 1), 1);
  const scored = list.map(it => {
    const hari = Number(it.hari) || 1;
    const urgensi = 1 - Math.min(1, (hari - 1) / Math.max(1, maxHari - 1));
    const marginScore = Math.max(0, Math.min(1, bundleMarginPct(it)));
    return { item: it, urgency: urgensi, score: urgensi * 0.5 + marginScore * 0.3 };
  });

  // Deterministik: urgensi tertinggi dulu, lalu skor, lalu id
  scored.sort((a, b) => {
    if (b.urgency !== a.urgency) return b.urgency - a.urgency;
    if (b.score !== a.score) return b.score - a.score;
    return String(a.item.id).localeCompare(String(b.item.id));
  });

  // Rotasi untuk tombol "Acak Ulang" (tetap deterministik)
  const n = scored.length;
  const shiftIdx = ((autoBundleShift % n) + n) % n;
  const rotated = scored.slice(shiftIdx).concat(scored.slice(0, shiftIdx));

  const suggestions = [];
  const seen = new Set();

  for (let i = 0; i < rotated.length && suggestions.length < 4; i++) {
    const first = rotated[i];

    // Utamakan partner dari kategori berbeda, lalu kategori lain
    const partners = rotated
      .filter(c => c.item.id !== first.item.id)
      .slice()
      .sort((a, b) => {
        const aDiff = a.item.kategori !== first.item.kategori ? 0 : 1;
        const bDiff = b.item.kategori !== first.item.kategori ? 0 : 1;
        return aDiff - bDiff;
      });

    for (let j = 0; j < partners.length && suggestions.length < 4; j++) {
      const partner = partners[j];
      const key = [first.item.id, partner.item.id].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);

      const products = [first.item, partner.item];

      // Tambah produk ketiga bila produk utama sangat urgent (<= 3 hari)
      if ((Number(first.item.hari) || 999) <= 3) {
        let third = null;
        for (let k = 0; k < rotated.length; k++) {
          const cand = rotated[k];
          if (cand.item.id === first.item.id || cand.item.id === partner.item.id) continue;
          if ((Number(cand.item.hari) || 999) <= 7) { third = cand; break; }
        }
        if (third) products.push(third.item);
      }

      const hariFirst = Number(first.item.hari) || 999;
      let diskon = 10;
      if (hariFirst <= 3) diskon = 20;
      else if (hariFirst <= 7) diskon = 15;

      const totalNormal = products.reduce((s, p) => s + (Number(p.harga) || 0), 0);
      const totalModal = products.reduce((s, p) => s + (Number(p.modal) || 0), 0);
      let hargaBundle = Math.round(totalNormal * (1 - diskon / 100));

      // Rem laba: turunkan diskon bila akan rugi
      let guard = 0;
      while (hargaBundle < totalModal && diskon > 0 && guard < 20) {
        diskon = Math.max(0, diskon - 5);
        hargaBundle = Math.round(totalNormal * (1 - diskon / 100));
        guard++;
      }

      const laba = hargaBundle - totalModal;

      suggestions.push({ products, diskon, totalNormal, totalModal, hargaBundle, laba, layak: laba >= 0 });
    }
  }

  autoBundleSuggestions = suggestions;
  if (panel) panel.classList.remove('hidden');
  renderAutoBundleSuggestions();
}

function renderAutoBundleSuggestions(emptyMsg) {
  const container = document.getElementById('auto-bundle-suggestions');
  if (!container) return;

  if (!autoBundleSuggestions || autoBundleSuggestions.length === 0) {
    container.innerHTML = `<div class="text-[11px] text-slate-500 text-center py-6 px-2 leading-relaxed">${emptyMsg || 'Belum ada rekomendasi paket. Simpan minimal dua produk dari Kalkulator.'}</div>`;
    return;
  }

  const hasEstimated = autoBundleSuggestions.some(sug => sug.products.some(p => p.hargaEstimasi));
  const estimateNote = hasEstimated
    ? '<p class="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">Sebagian harga jual belum tersimpan; sistem memakai estimasi modal + target laba. Simpan ulang produk dari Kalkulator agar akurat.</p>'
    : '';

  container.innerHTML = estimateNote + autoBundleSuggestions.map((sug, idx) => {
    const names = sug.products.map(p => escapeHtml(p.nama)).join(' + ');
    const alasan = sug.products
      .slice()
      .sort((a, b) => (Number(a.hari) || 999) - (Number(b.hari) || 999))
      .map(p => `${p.nama} (${p.hari} hari lagi)`)[0];

    const potongan = Math.max(0, (Number(sug.totalNormal) || 0) - (Number(sug.hargaBundle) || 0));
    const produkRows = sug.products.map(p => `
      <div class="flex items-baseline justify-between gap-3 py-1 border-b border-dashed border-slate-200 last:border-0">
        <span class="min-w-0 truncate text-xs font-semibold leading-snug text-slate-800">${escapeHtml(p.nama)}</span>
        <span class="shrink-0 text-xs font-bold leading-snug tabular-nums text-slate-900">${formatRupiah(Number(p.harga) || 0)}</span>
      </div>
    `).join('');

    return `
      <div class="p-3 rounded-xl border ${sug.layak ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50'}">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="font-bold text-xs text-slate-900 leading-snug">${names}</div>
            <div class="text-[11px] font-medium text-slate-500 mt-0.5">${sug.products.length} produk • diskon ${sug.diskon}% • prioritas: ${escapeHtml(alasan)}</div>
          </div>
          <span class="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold ${sug.layak ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'}">${sug.layak ? 'Layak' : 'Rugi'}</span>
        </div>

        <div class="mt-2 rounded-lg bg-white border border-slate-200 overflow-hidden">
          <div class="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border-b border-slate-200">
            <span class="material-symbols-outlined text-[13px] text-primary">receipt_long</span>
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Rincian Produk</span>
          </div>
          <div class="px-2.5 py-1">
            ${produkRows}
          </div>
        </div>

        <div class="mt-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2">
          <div class="flex items-baseline justify-between gap-3 text-[11px] leading-relaxed">
            <span class="font-medium text-slate-500">Total Normal</span>
            <span class="shrink-0 font-semibold tabular-nums text-slate-400 line-through">${formatRupiah(sug.totalNormal)}</span>
          </div>
          <div class="flex items-baseline justify-between gap-3 text-[11px] leading-relaxed">
            <span class="font-medium text-slate-500">Total Modal</span>
            <span class="shrink-0 font-semibold tabular-nums text-slate-600">${formatRupiah(sug.totalModal)}</span>
          </div>
          <div class="flex items-baseline justify-between gap-3 text-[11px] leading-relaxed">
            <span class="font-medium text-slate-500">Potongan (${sug.diskon}%)</span>
            <span class="shrink-0 font-bold tabular-nums text-amber-700">- ${formatRupiah(potongan)}</span>
          </div>
          <div class="my-1.5 border-t border-slate-200"></div>
          <div class="flex items-baseline justify-between gap-3">
            <span class="text-xs font-bold text-slate-900">Harga Paket</span>
            <span class="shrink-0 text-sm font-black tabular-nums text-primary">${formatRupiah(sug.hargaBundle)}</span>
          </div>
          <div class="flex items-baseline justify-between gap-3 mt-0.5">
            <span class="text-xs font-bold text-slate-900">Laba</span>
            <span class="shrink-0 text-sm font-black tabular-nums ${sug.layak ? 'text-emerald-700' : 'text-error'}">${formatRupiah(sug.laba)}</span>
          </div>
        </div>

        <div class="mt-2">
          <button type="button" onclick="saveAutoBundle(${idx})" class="w-full py-2 rounded-lg bg-primary text-white text-[11px] font-bold hover:bg-primary-container transition-all">Simpan Paket</button>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// REKOMENDASI TANGGAL PROMO (deterministik, tanpa server)
// ============================================================
// Catatan: tanggal keagamaan bersifat PERKIRAAN, bisa diperbarui manual.
const PROMO_EVENTS = {
  fixed: [
    { md: '01-01', nama: 'Tahun Baru' },
    { md: '02-14', nama: 'Valentine' },
    { md: '05-01', nama: 'Hari Buruh' },
    { md: '06-01', nama: 'Hari Lahir Pancasila' },
    { md: '08-17', nama: 'HUT RI / Kemerdekaan' },
    { md: '12-24', nama: 'Malam Natal' },
    { md: '12-25', nama: 'Hari Natal' },
    { md: '12-31', nama: 'Malam Tahun Baru' }
  ],
  tanggalKembar: [
    { md: '01-01', nama: '1.1' },
    { md: '02-02', nama: '2.2' },
    { md: '03-03', nama: '3.3' },
    { md: '04-04', nama: '4.4' },
    { md: '05-05', nama: '5.5' },
    { md: '06-06', nama: '6.6' },
    { md: '07-07', nama: '7.7' },
    { md: '08-08', nama: '8.8' },
    { md: '09-09', nama: '9.9' },
    { md: '10-10', nama: '10.10' },
    { md: '11-11', nama: '11.11' },
    { md: '12-12', nama: '12.12' }
  ],
  special: [
    { date: '2026-01-16', nama: 'Isra Mikraj (perkiraan)' },
    { date: '2026-02-17', nama: 'Tahun Baru Imlek 2577' },
    { date: '2026-03-19', nama: 'Nyepi (perkiraan)' },
    { date: '2026-03-20', nama: 'Idul Fitri 1447 H (perkiraan)' },
    { date: '2026-03-21', nama: 'Idul Fitri 1447 H (perkiraan)' },
    { date: '2026-04-03', nama: 'Wafat Isa Al Masih' },
    { date: '2026-05-14', nama: 'Kenaikan Isa Al Masih' },
    { date: '2026-05-27', nama: 'Idul Adha 1447 H (perkiraan)' },
    { date: '2026-05-31', nama: 'Waisak 2570 (perkiraan)' },
    { date: '2026-06-16', nama: 'Tahun Baru Islam 1448 H (perkiraan)' },
    { date: '2026-08-25', nama: 'Maulid Nabi (perkiraan)' },
    { date: '2027-02-06', nama: 'Tahun Baru Imlek (perkiraan)' },
    { date: '2027-03-08', nama: 'Nyepi (perkiraan)' },
    { date: '2027-03-20', nama: 'Idul Fitri 1448 H (perkiraan)' },
    { date: '2027-03-21', nama: 'Idul Fitri 1448 H (perkiraan)' },
    { date: '2027-03-26', nama: 'Wafat Isa Al Masih (perkiraan)' },
    { date: '2027-05-06', nama: 'Kenaikan Isa Al Masih (perkiraan)' },
    { date: '2027-05-17', nama: 'Idul Adha 1448 H (perkiraan)' },
    { date: '2027-05-20', nama: 'Waisak 2571 (perkiraan)' },
    { date: '2027-06-26', nama: 'Tahun Baru Islam 1449 H (perkiraan)' },
    { date: '2027-08-15', nama: 'Maulid Nabi (perkiraan)' }
  ]
};

let dateRecommendations = [];

function pad2(n) { return String(n).padStart(2, '0'); }

function dateToISO(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// Skor event untuk satu tanggal
function getEventForDate(d) {
  const md = pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  const iso = dateToISO(d);
  const reasons = [];
  let score = 0;

  const special = PROMO_EVENTS.special.find(e => e.date === iso);
  if (special) { score += 70; reasons.push(special.nama); }

  const dbl = PROMO_EVENTS.tanggalKembar.find(e => e.md === md);
  if (dbl) { score += 60; reasons.push(dbl.nama); }

  const fx = PROMO_EVENTS.fixed.find(e => e.md === md);
  if (fx) { score += 50; reasons.push(fx.nama); }

  const day = d.getDate();
  if (day >= 25 && day <= 30) { score += 30; reasons.push('Masa gajian'); }

  const dow = d.getDay();
  if (dow === 5 || dow === 6 || dow === 0) {
    score += 15;
    reasons.push(dow === 5 ? 'Jumat/Weekend' : dow === 6 ? 'Sabtu/Weekend' : 'Minggu/Weekend');
  }

  return { score, reasons };
}

// Daftar hari besar & tanggal khusus pada satu bulan (untuk penanda kalender)
function getPromoEventsForMonth(year, monthIndex) {
  const mm = pad2(monthIndex + 1);
  const yearPrefix = `${year}-${mm}-`;
  const out = [];
  const push = (iso, nama, tipe) => {
    if (!out.some(e => e.iso === iso && e.nama === nama)) out.push({ iso, nama, tipe });
  };

  PROMO_EVENTS.tanggalKembar.forEach(e => {
    if (e.md.startsWith(mm + '-')) push(`${year}-${e.md}`, e.nama, 'promo-tanggal-kembar');
  });
  PROMO_EVENTS.fixed.forEach(e => {
    if (e.md.startsWith(mm + '-')) push(`${year}-${e.md}`, e.nama, 'libur-nasional');
  });
  PROMO_EVENTS.special.forEach(e => {
    if (e.date.startsWith(yearPrefix)) push(e.date, e.nama, 'libur-keagamaan');
  });

  return out.sort((a, b) => a.iso.localeCompare(b.iso));
}

// Rekomendasikan tanggal & durasi promo untuk produk
// opts.avoid: daftar tanggal ISO yang sebaiknya dihindari (sudah penuh)
function recommendPromoDate(product, fromDate, opts) {
  const base = fromDate ? new Date(fromDate) : new Date();
  base.setHours(0, 0, 0, 0);

  const avoid = new Set((opts && opts.avoid) || []);
  const hari = Math.max(1, Number(product.hari) || 1);
  const stok = Number(product.stok) || 0;
  const velocity = Math.max(0.5, Number(product.velocity) || 1);
  const daysToExhaust = Math.max(1, Math.ceil(stok / velocity));
  // Pisahkan pemicu urgensi agar alasannya tidak salah:
  // - urgentByStock: stok tidak akan habis sebelum expired
  // - urgentByExpiry: sisa waktu expired sudah <= 3 hari (stok mungkin cukup)
  const urgentByStock = daysToExhaust > hari;
  const urgentByExpiry = hari <= 3;
  const urgent = urgentByStock || urgentByExpiry;

  const maxOffset = Math.max(0, Math.min(hari - 1, 60));
  let best = null;

  for (let off = 0; off <= maxOffset; off++) {
    const d = new Date(base);
    d.setDate(base.getDate() + off);
    const ev = getEventForDate(d);
    let score = ev.score;
    const reasons = ev.reasons.slice();

    // Bonus urgensi: makin cepat makin baik bila stok terancam
    if (urgent) score += Math.max(0, 25 - off * 3);
    // Sedikit prefer tanggal lebih awal bila skor event sama
    score += Math.max(0, 10 - off);
    // Hindari tanggal yang sudah dipakai produk lain (tanggal kembar)
    if (avoid.has(dateToISO(d))) score -= 1000;

    if (!best || score > best.score) {
      best = { offset: off, date: d, score, reasons };
    }
  }

  const start = best ? best.date : new Date(base);
  const startOffset = best ? best.offset : 0;

  let duration = Math.min(hari, 5);
  if (duration < 1) duration = 1;
  const maxDuration = hari - startOffset;
  if (duration > maxDuration) duration = Math.max(1, maxDuration);

  const end = new Date(start);
  end.setDate(start.getDate() + (duration - 1));

  const reasons = best ? best.reasons.slice() : [];
  if (urgentByStock) {
    reasons.unshift('Stok berisiko tidak habis sebelum expired');
  } else if (urgentByExpiry) {
    reasons.unshift('Mendekati kedaluwarsa (sisa ≤3 hari)');
  }
  if (reasons.length === 0) reasons.push('Jadwal normal');

  return {
    startDate: start,
    endDate: end,
    durationDays: duration,
    score: best ? best.score : 0,
    reasons,
    urgent,
    daysToExhaust
  };
}

// Ringkasan jumlah produk per momentum (kartu di atas kalender)
function renderJadwalStats() {
  const entries = (typeof dateRecommendations !== 'undefined' && dateRecommendations) ? dateRecommendations : [];
  let urgent = 0, payday = 0, weekend = 0;

  entries.forEach(entry => {
    const reco = entry && entry.reco;
    if (!reco) return;
    if (reco.urgent) urgent++;
    const d = reco.startDate ? new Date(reco.startDate) : null;
    const day = d ? d.getDate() : 0;
    const dow = d ? d.getDay() : -1;
    const reasons = reco.reasons || [];
    if ((day >= 25 && day <= 30) || reasons.some(r => /gajian/i.test(r))) payday++;
    if (dow === 5 || dow === 6 || dow === 0 || reasons.some(r => /weekend/i.test(r))) weekend++;
  });

  const setCount = (id, n) => {
    const el = document.getElementById(id);
    if (el) el.textContent = `${n} Produk`;
  };
  setCount('stat-urgent-count', urgent);
  setCount('stat-payday-count', payday);
  setCount('stat-weekend-count', weekend);
}

// Generate rekomendasi untuk semua item jadwal
function generateDateRecommendations(silent) {
  const list = loadJadwal() || [];
  if (list.length === 0) {
    dateRecommendations = [];
    renderDateRecommendations('Belum ada produk terjadwal. Hitung produk di Kalkulator, lalu klik "Simpan ke Jadwal Otomatis".');
    renderJadwalStats();
    renderKalender();
    if (!silent) {
      showToast('Belum ada produk terjadwal. Simpan dulu dari Kalkulator.', 'warning');
      showTab('kalkulator');
    }
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Hitung rekomendasi awal, lalu urutkan: produk paling urgent didahulukan
  const planned = list.map(item => ({ item, reco: recommendPromoDate(item, today) }));
  planned.sort((a, b) => {
    const ua = a.reco.urgent ? 1 : 0;
    const ub = b.reco.urgent ? 1 : 0;
    if (ub !== ua) return ub - ua;
    return b.reco.score - a.reco.score;
  });

  // Hindari tanggal kembar: satu produk per tanggal promo (bila memungkinkan)
  const MAX_PER_DAY = 1;
  const usage = {};
  dateRecommendations = planned.map(({ item, reco }) => {
    let chosen = reco;
    let iso = dateToISO(chosen.startDate);
    if ((usage[iso] || 0) >= MAX_PER_DAY) {
      const fullDates = Object.keys(usage).filter(d => usage[d] >= MAX_PER_DAY);
      const alt = recommendPromoDate(item, today, { avoid: fullDates });
      const altIso = dateToISO(alt.startDate);
      if (altIso !== iso) {
        chosen = alt;
        chosen.reasons = chosen.reasons.slice();
        chosen.reasons.push('Digeser agar tidak menumpuk');
        iso = altIso;
      }
    }
    usage[iso] = (usage[iso] || 0) + 1;
    return { id: item.id, item, reco: chosen };
  });

  // Sinkronkan tanggal & alasan ke data tersimpan agar kalender konsisten
  const stored = loadJadwal() || [];
  let changed = false;
  dateRecommendations.forEach(entry => {
    const target = stored.find(it => it.id === entry.id);
    if (!target) return;
    const iso = dateToISO(entry.reco.startDate);
    const alasan = entry.reco.reasons.join(', ');
    if (target.tanggal !== iso || target.alasan !== alasan) {
      target.tanggal = iso;
      target.alasan = alasan;
      changed = true;
    }
  });
  if (changed) {
    saveJadwal(stored);
    renderJadwalTable();
  }

  renderDateRecommendations();
  renderJadwalStats();
  renderKalender();
  if (!silent) {
    showToast('Rekomendasi tanggal diperbarui');
    const first = dateRecommendations.find(r => r.reco && r.reco.startDate);
    if (first) focusKalenderOn(dateToISO(first.reco.startDate), true);
  }
}

// Render daftar rekomendasi tanggal
function renderDateRecommendations(emptyMsg) {
  const container = document.getElementById('date-reco-list');
  if (!container) return;

  if (!dateRecommendations || dateRecommendations.length === 0) {
    container.innerHTML = `<p class="text-[11px] text-slate-500 text-center py-6">${emptyMsg || 'Belum ada rekomendasi tanggal.'}</p>`;
    return;
  }

  container.innerHTML = dateRecommendations.map(({ id, item, reco }) => {
    const iso = dateToISO(reco.startDate);
    const start = formatTanggalPendek(iso);
    const end = formatTanggalPendek(dateToISO(reco.endDate));
    const chips = reco.reasons.map(r => `<span class="px-1.5 py-0.5 rounded bg-blue-50 text-primary border border-blue-100 text-[9px] font-bold">${escapeHtml(r)}</span>`).join('');
    const urgentBadge = reco.urgent ? '<span class="px-1.5 py-0.5 rounded bg-amber-400 text-amber-950 text-[9px] font-extrabold">PRIORITAS</span>' : '';

    return `
      <div class="p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-200 transition-colors">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="font-bold text-xs text-slate-900 truncate">${escapeHtml(item.nama)}</div>
            <div class="text-[10px] text-slate-500 mt-0.5">${start} — ${end} • ${reco.durationDays} hari • diskon ${item.diskon}%</div>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            ${urgentBadge}
            <button type="button" onclick="focusKalenderOn('${iso}', true)" class="px-2 py-1 rounded-lg bg-white border border-blue-200 text-primary text-[10px] font-bold hover:bg-blue-50 transition-all">Lihat Kalender</button>
          </div>
        </div>
        <div class="flex items-center gap-1 flex-wrap mt-2">${chips}</div>
      </div>
    `;
  }).join('');
}

// Simpan rekomendasi langsung
function saveAutoBundle(idx) {
  const sug = autoBundleSuggestions[idx];
  if (!sug) return;
  if (!sug.layak) {
    if (!confirm('Paket ini berpotensi rugi. Tetap simpan?')) return;
  }

  const bundle = {
    id: Date.now().toString(),
    nama: 'Paket Otomatis #' + (idx + 1) + ' • ' + sug.products.map(p => p.nama).join(' + '),
    diskon: sug.diskon,
    products: sug.products.map(p => ({ nama: p.nama, harga: p.harga, modal: p.modal })),
    totalNormal: sug.totalNormal,
    totalHarga: sug.hargaBundle,
    totalModal: sug.totalModal,
    totalLaba: sug.laba,
    savedAt: new Date().toISOString()
  };

  const list = loadBundles();
  list.push(bundle);
  saveBundles(list);
  renderBundleList();
  showToast('Paket otomatis berhasil disimpan!');
}
