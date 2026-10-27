// ============================================================
// KALKULATOR DISKON — perhitungan lokal, tanpa server
// ============================================================

function setPresetDiscount(val) {
  const isFloorLocked = document.getElementById('pref-lock-floor')?.checked;
  if (isFloorLocked) {
    const normalPrice = parseFloat(inputNormal.value) || 0;
    const modal = parseFloat(inputModal.value) || 0;
    const maxCutPct = normalPrice > 0 ? Math.floor(((normalPrice - modal) / normalPrice) * 100) : 0;
    if (val > maxCutPct) {
      showToast(`Batas aman ${maxCutPct}%`, 'warning');
      val = Math.max(0, maxCutPct);
    }
  }
  slider.value = val;
  recalculate();
}

function formatRupiah(num) {
  return 'Rp ' + Math.round(num).toLocaleString('id-ID');
}

function formatDateIndo(dateObj) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}

function recalculate() {
  if (!inputModal || !slider) return;

  const modal = parseFloat(inputModal.value) || 0;
  const normalPrice = parseFloat(inputNormal.value) || 0;
  const targetLaba = parseFloat(inputTargetLaba.value) || 0;
  const stok = parseFloat(inputStok.value) || 0;
  const velocity = Math.max(0.5, parseFloat(inputVelocity.value) || 1);
  const hariTersisa = Math.max(1, parseFloat(inputHari.value) || 1);
  let discountPct = parseFloat(slider.value) || 0;

  // Proteksi floor price (opsional via preferensi internal)
  const isFloorLocked = document.getElementById('pref-lock-floor')?.checked;
  if (isFloorLocked) {
    const maxCutPct = normalPrice > 0 ? Math.floor(((normalPrice - modal) / normalPrice) * 100) : 0;
    if (discountPct > maxCutPct) {
      discountPct = Math.max(0, maxCutPct);
      slider.value = discountPct;
    }
  }

  sliderLabel.textContent = `${discountPct}%`;

  const discountAmount = Math.round(normalPrice * (discountPct / 100));
  const finalPrice = Math.max(0, normalPrice - discountAmount);
  const actualProfit = finalPrice - modal;

  const minSafePrice = modal + targetLaba;
  const maxAllowedCut = Math.max(0, normalPrice - minSafePrice);
  const maxDiscountPct = normalPrice > 0 ? Math.floor((maxAllowedCut / normalPrice) * 100) : 0;

  // Metrik utama
  metricFinalPrice.textContent = formatRupiah(finalPrice);
  metricDiscountCut.textContent = `Potongan ${formatRupiah(discountAmount)}`;
  metricProfitUnit.textContent = formatRupiah(actualProfit);
  metricMinSafePrice.textContent = formatRupiah(minSafePrice);
  metricMinSafeDesc.textContent = 'Modal + Target Laba';
  metricMaxDiscount.textContent = `${Math.max(0, maxDiscountPct)}%`;
  metricMaxCut.textContent = `Maks. potongan ${formatRupiah(maxAllowedCut)}`;

  // Batch & modal terselamatkan
  recoveryHeading.textContent = `Estimasi Penyelamatan Arus Kas (${stok.toLocaleString('id-ID')} Unit):`;
  recoveryBatchBadge.textContent = 'Total Batch';

  const totalOmset = finalPrice * stok;
  const totalBatchProfit = actualProfit * stok;
  const recoveredModalUnit = Math.min(modal, Math.max(0, finalPrice));
  const totalCashRecovered = recoveredModalUnit * stok;
  const totalRequiredModal = modal * stok;

  metricCashRecovered.textContent = formatRupiah(totalCashRecovered);
  metricTotalTurnover.textContent = `Omset: ${formatRupiah(totalOmset)}`;

  if (finalPrice >= modal) {
    metricCashStatus.innerHTML = 'Modal pokok 100% aman';
    metricCashStatus.className = 'text-[10px] text-emerald-700 font-bold mt-0.5 block';
  } else {
    const shortfall = totalRequiredModal - totalCashRecovered;
    metricCashStatus.innerHTML = `Modal tekor ${formatRupiah(shortfall)}`;
    metricCashStatus.className = 'text-[10px] text-error font-bold mt-0.5 block';
  }

  if (totalBatchProfit >= 0) {
    profitRecoveryLabel.textContent = 'Total Potensi Laba';
    metricTotalProfit.textContent = formatRupiah(totalBatchProfit);
    metricTotalProfit.className = 'text-sm font-black text-primary block mt-0.5 tabular-nums';
  } else {
    profitRecoveryLabel.textContent = 'Potensi Defisit';
    metricTotalProfit.textContent = `- ${formatRupiah(Math.abs(totalBatchProfit))}`;
    metricTotalProfit.className = 'text-sm font-black text-error block mt-0.5 tabular-nums';
  }

  // Laju penjualan & expired
  const daysToExhaust = Math.ceil(stok / velocity);
  displayRunRate.textContent = `Habis dalam ${daysToExhaust} hari (${velocity}/hari)`;

  const today = new Date();
  const expDate = new Date();
  expDate.setDate(today.getDate() + hariTersisa);
  displayExpiredDate.textContent = `Expired ${formatDateIndo(expDate)} (${hariTersisa} hari)`;

  // Rekomendasi tanggal berbasis event (hari besar, tanggal khusus, gajian, weekend)
  if (typeof recommendPromoDate === 'function') {
    const reco = recommendPromoDate({ hari: hariTersisa, velocity: velocity, stok: stok }, today);
    const reasonText = reco.reasons.length ? ' • ' + reco.reasons.slice(0, 2).join(', ') : '';
    promoDateRange.innerHTML = `${formatDateIndo(reco.startDate)} — ${formatDateIndo(reco.endDate)}${reasonText}`;
    promoDurationLabel.textContent = `${reco.durationDays} Hari`;
  } else {
    promoDateRange.textContent = `Hari ini — ${formatDateIndo(expDate)}`;
    promoDurationLabel.textContent = `${Math.min(hariTersisa, 5)} Hari`;
  }

  // Status kelayakan
  const alertDays = parseInt(document.getElementById('pref-alert-days')?.value) || 3;
  const isUrgent = daysToExhaust > hariTersisa || hariTersisa <= alertDays;
  const isLoss = actualProfit < 0;
  const isMet = actualProfit >= targetLaba;

  // Kondisi form masih kosong: jangan tampilkan status "aman" palsu
  const hasData = normalPrice > 0 && modal > 0;
  if (!hasData) {
    statusCard.className = 'rounded-xl p-4 border bg-slate-50 border-slate-200 text-slate-700';
    statusIcon.className = 'w-8 h-8 rounded-full bg-slate-400 text-white flex items-center justify-center shrink-0';
    statusIcon.innerHTML = '<span class="material-symbols-outlined text-[18px]">edit_note</span>';
    statusText.textContent = 'ISI DATA PRODUK UNTUK MEMULAI ANALISIS';
    statusBadgePill.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0';
    statusBadgePill.textContent = 'Menunggu Input';
    urgencyDesc.textContent = 'Masukkan modal dan harga normal produk untuk melihat kelayakan diskon.';
    momentumBadge.className = 'px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-slate-200 text-slate-700 shrink-0';
    momentumBadge.textContent = 'Belum Ada Data';
    promoDateRange.textContent = 'Belum ada rekomendasi';
    promoDurationLabel.textContent = '—';
    timingTip.textContent = 'Lengkapi data untuk melihat rekomendasi waktu.';
    recPoint1.textContent = '• Lengkapi nama, modal, dan harga normal produk.';
    recPoint2.textContent = '• Sistem akan menghitung batas diskon aman secara otomatis.';
    if (typeof velocityAnalysisText !== 'undefined' && velocityAnalysisText) {
      velocityAnalysisText.textContent = 'Analisis laju penjualan akan muncul setelah data lengkap.';
    }
    return;
  }

  if (isLoss) {
    statusCard.className = 'rounded-xl p-4 border bg-rose-50 border-rose-200 text-rose-950';
    statusIcon.className = 'w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0';
    statusIcon.innerHTML = '<span class="material-symbols-outlined text-[18px]">cancel</span>';
    statusText.textContent = 'TIDAK LAYAK: BONCOS / RUGI MODAL';
    statusBadgePill.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0';
    statusBadgePill.textContent = 'Rugi Total';

    metricProfitUnit.className = 'text-base font-black text-error mt-1 tabular-nums';
    metricProfitPill.className = 'text-[10px] text-error font-bold mt-0.5';
    metricProfitStatus.textContent = `Rugi ${formatRupiah(Math.abs(actualProfit))}/unit`;

    urgencyDesc.textContent = `Diskon terlalu dalam. Anda rugi ${formatRupiah(Math.abs(actualProfit))} setiap produk laku. Hentikan promo harga ini.`;
    recPoint1.innerHTML = `• <strong>Diskon ${discountPct}% tidak layak.</strong> Boncos <strong>${formatRupiah(Math.abs(actualProfit))}</strong> per unit (total ${formatRupiah(Math.abs(totalBatchProfit))}).`;
    recPoint2.innerHTML = `• Turunkan diskon maksimal ke <strong>${Math.max(0, maxDiscountPct)}%</strong> (harga minimal aman <strong>${formatRupiah(minSafePrice)}</strong>).`;

    momentumBadge.className = 'px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-rose-500 text-white flex items-center gap-1 shrink-0';
    momentumBadge.innerHTML = 'Batalkan Promo';

    if (typeof velocityAnalysisText !== 'undefined' && velocityAnalysisText) {
      velocityAnalysisText.textContent = `Peringatan: diskon ${discountPct}% menghanguskan laba meskipun ${stok} unit terjual cepat.`;
    }
    timingTip.textContent = `Saran: batasi diskon maksimal ${Math.max(0, maxDiscountPct)}%.`;

  } else if (!isMet) {
    statusCard.className = 'rounded-xl p-4 border bg-amber-50 border-amber-200 text-amber-950';
    statusIcon.className = 'w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0';
    statusIcon.innerHTML = '<span class="material-symbols-outlined text-[18px]">warning</span>';
    statusText.textContent = 'LABA TIPIS (DI BAWAH TARGET)';
    statusBadgePill.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0';
    statusBadgePill.textContent = 'Di Bawah Target';

    metricProfitUnit.className = 'text-base font-black text-amber-700 mt-1 tabular-nums';
    metricProfitPill.className = 'text-[10px] text-amber-700 font-bold mt-0.5';
    metricProfitStatus.textContent = `Di bawah target ${formatRupiah(targetLaba)}`;

    urgencyDesc.textContent = `Masih untung, namun laba ${formatRupiah(actualProfit)} di bawah target ${formatRupiah(targetLaba)}.`;
    recPoint1.innerHTML = `• Diskon <strong>${discountPct}%</strong> memotong laba di bawah target. Potensi laba batch <strong>${formatRupiah(totalBatchProfit)}</strong>.`;
    recPoint2.innerHTML = `• Diskon maksimum yang disarankan <strong>${Math.max(0, maxDiscountPct)}%</strong> untuk mengamankan target.`;

    momentumBadge.className = 'px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-amber-400 text-amber-950 flex items-center gap-1 shrink-0';
    momentumBadge.innerHTML = 'Urgensi Sedang';

    if (typeof velocityAnalysisText !== 'undefined' && velocityAnalysisText) {
      velocityAnalysisText.textContent = `Butuh ${daysToExhaust} hari untuk menghabiskan ${stok} stok; sisa expired ${hariTersisa} hari.`;
    }
    timingTip.textContent = 'Saran: bundling dengan produk bermargin tebal.';

  } else {
    statusCard.className = 'rounded-xl p-4 border bg-emerald-50/90 border-emerald-200 text-emerald-950';
    statusIcon.className = 'w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0';
    statusIcon.innerHTML = '<span class="material-symbols-outlined text-[18px]">check_circle</span>';
    statusText.textContent = 'STATUS KELAYAKAN: AMAN DIBERIKAN (LAYAK DISKON)';
    statusBadgePill.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0';
    statusBadgePill.textContent = 'Aman Diberikan';

    metricProfitUnit.className = 'text-base font-black text-emerald-600 mt-1 tabular-nums';
    metricProfitPill.className = 'text-[10px] text-emerald-700 font-bold mt-0.5';
    metricProfitStatus.textContent = `Di atas target ${formatRupiah(targetLaba)}`;

    if (isUrgent) {
      urgencyDesc.textContent = `Butuh ${daysToExhaust} hari untuk habis, sisa expired ${hariTersisa} hari. Mulai promo SEGERA untuk likuidasi modal.`;
      momentumBadge.className = 'px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-amber-400 text-amber-950 shrink-0';
      momentumBadge.innerHTML = 'Urgensi Tinggi';
    } else {
      urgencyDesc.textContent = `Diskon ${discountPct}% aman dan menghasilkan laba riil ${formatRupiah(actualProfit)}/unit, di atas target ${formatRupiah(targetLaba)}.`;
      momentumBadge.className = 'px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-emerald-400 text-emerald-950 shrink-0';
      momentumBadge.innerHTML = 'Momentum Normal';
    }

    if (typeof velocityAnalysisText !== 'undefined' && velocityAnalysisText) {
      velocityAnalysisText.textContent = `Laju ${velocity}/hari butuh ${daysToExhaust} hari untuk ${stok} stok; sisa waktu ${hariTersisa} hari.`;
    }
    timingTip.textContent = `Momentum: eksekusi saat "Flash Sale / Payday Promo".`;

    recPoint1.innerHTML = `• Diskon <strong>${discountPct}%</strong> aman karena laba per unit <strong>${formatRupiah(actualProfit)}</strong> masih di atas target <strong>${formatRupiah(targetLaba)}</strong> (total laba batch <strong>${formatRupiah(totalBatchProfit)}</strong>).`;
    recPoint2.innerHTML = `• Jangan menurunkan harga di bawah <strong>${formatRupiah(minSafePrice)}</strong> (batas diskon aman <strong>${Math.max(0, maxDiscountPct)}%</strong>).`;
  }
}
