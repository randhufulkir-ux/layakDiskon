// ============================================================
// AKSI KALKULATOR
// ============================================================

// Muat produk dari jadwal ke kalkulator
function loadProductToCalculator(nama, hpp, jual, targetLaba, stok, velocity, hari, diskon) {
  if (inputNama) inputNama.value = nama;
  if (inputModal) inputModal.value = hpp || '';
  if (inputNormal) inputNormal.value = jual || '';
  if (inputTargetLaba) inputTargetLaba.value = targetLaba || '';
  if (inputStok) inputStok.value = stok || 0;
  if (inputVelocity) inputVelocity.value = velocity || 1;
  if (inputHari) inputHari.value = hari || 1;
  if (slider) slider.value = diskon || 10;

  recalculate();
  showTab('kalkulator');
  showToast(`Data "${nama}" dimuat ke kalkulator`);
}

// Event listener: semua input memperbarui hasil secara real-time
if (slider) slider.addEventListener('input', recalculate);
[inputNama, inputModal, inputNormal, inputTargetLaba, inputStok, inputVelocity, inputHari].forEach(field => {
  if (field) field.addEventListener('input', recalculate);
});

function buildCalculationSummary() {
  const nama = inputNama.value || 'Produk UMKM';
  const normal = formatRupiah(parseFloat(inputNormal.value) || 0);
  const diskon = slider.value + '%';
  const hargaDiskon = metricFinalPrice.textContent.trim();
  const laba = metricProfitUnit.textContent.trim();
  const status = statusText.textContent.trim();
  const batasMaks = metricMaxDiscount.textContent.trim();
  const hargaMin = metricMinSafePrice.textContent.trim();
  const stok = inputStok.value || '0';
  const modalSelamat = metricCashRecovered.textContent.trim();
  const totalLaba = metricTotalProfit.textContent.trim();
  const jadwal = promoDateRange.textContent.trim();

  return `*RANGKUMAN LAYAK DISKON UMKM*\n` +
    `Produk: ${nama}\n` +
    `Status: ${status}\n` +
    `Rekomendasi Waktu: ${jadwal}\n` +
    `Harga Normal: ${normal} -> Diskon: ${diskon}\n` +
    `Harga Diskon: ${hargaDiskon}\n` +
    `Laba Bersih: ${laba}/unit\n` +
    `Batas Diskon Maksimal: ${batasMaks} (Harga Terendah Aman: ${hargaMin})\n` +
    `Estimasi Penyelamatan Modal (${stok} Unit): ${modalSelamat}\n` +
    `Total Estimasi Laba Batch: ${totalLaba}\n\n` +
    `Dihitung via LayakDiskon`;
}

function copyCalculationSummary() {
  const summary = buildCalculationSummary();

  if (navigator.clipboard) {
    navigator.clipboard.writeText(summary).then(() => showToast('Rangkuman disalin ke clipboard'));
  } else {
    alert(summary);
  }
}

// Unduh ringkasan perhitungan sebagai PDF yang rapi (hanya informasi)
function downloadCalculationPdf() {
  if (typeof PdfReport !== 'function' || typeof downloadPdf !== 'function') {
    showToast('Fitur PDF tidak tersedia', 'warning');
    return;
  }

  const normalPrice = parseFloat(inputNormal.value) || 0;
  const modal = parseFloat(inputModal.value) || 0;
  if (normalPrice <= 0 || modal <= 0) {
    showToast('Lengkapi modal dan harga normal terlebih dahulu', 'warning');
    return;
  }

  const statusClass = statusCard.className || '';
  const statusType = statusClass.indexOf('rose') !== -1 ? 'bad'
    : statusClass.indexOf('amber') !== -1 ? 'warn'
    : statusClass.indexOf('emerald') !== -1 ? 'ok' : 'info';

  const report = new PdfReport();
  report.title('Ringkasan Kalkulator Diskon', 'LayakDiskon - Asisten Keputusan Diskon UMKM');
  report.meta('Dibuat: ' + new Date().toLocaleString('id-ID'));

  report.section('Data Produk');
  report.row('Nama produk', inputNama.value.trim() || '-');
  report.row('Modal per unit', formatRupiah(modal));
  report.row('Harga normal', formatRupiah(normalPrice));
  report.row('Target laba minimum', formatRupiah(parseFloat(inputTargetLaba.value) || 0));
  report.row('Stok tersisa', (parseFloat(inputStok.value) || 0).toLocaleString('id-ID') + ' unit');
  report.row('Laju jual', (parseFloat(inputVelocity.value) || 0).toLocaleString('id-ID') + ' unit/hari');
  report.row('Batas kesegaran', (parseFloat(inputHari.value) || 0).toLocaleString('id-ID') + ' hari');

  report.section('Hasil Perhitungan');
  report.row('Diskon diuji', slider.value + '%');
  report.row('Harga setelah diskon', metricFinalPrice.textContent.trim());
  report.row('Laba per unit', metricProfitUnit.textContent.trim(), {
    color: statusType === 'bad' ? PDF_COLORS.red : (statusType === 'warn' ? PDF_COLORS.amber : PDF_COLORS.green)
  });
  report.row('Batas diskon maksimum', metricMaxDiscount.textContent.trim());
  report.row('Harga minimum aman', metricMinSafePrice.textContent.trim());
  report.row('Rekomendasi waktu promo', promoDateRange.textContent.trim());
  report.row('Estimasi modal terselamatkan', metricCashRecovered.textContent.trim());
  report.row('Total potensi laba batch', metricTotalProfit.textContent.trim());

  report.section('Kesimpulan');
  report.status(statusText.textContent.trim() + '. ' + urgencyDesc.textContent.trim(), statusType);
  report.spacer(4);
  report.paragraph(recPoint1.textContent.trim().replace(/^•\s*/, ''));
  if (recPoint2.textContent.trim()) {
    report.paragraph(recPoint2.textContent.trim().replace(/^•\s*/, ''));
  }

  report.section('Catatan');
  report.paragraph('Dokumen ini dibuat otomatis oleh LayakDiskon. Perhitungan memakai aturan sederhana: modal, harga normal, target laba, stok, laju jual, dan sisa masa expired. Sistem tidak menjamin permintaan pasar; keputusan akhir tetap milik pemilik usaha.');

  downloadPdf('layakdiskon-kalkulator-' + todayISO() + '.pdf', report);
  showToast('PDF berhasil diunduh');
}

function startNewProduct() {
  inputNama.value = '';
  inputModal.value = '';
  inputNormal.value = '';
  inputTargetLaba.value = '';
  inputStok.value = '';
  inputVelocity.value = '';
  inputHari.value = '';
  slider.value = '10';

  inputNama.focus();
  recalculate();
  showToast('Formulir dikosongkan untuk produk baru');
}


