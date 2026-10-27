// ============================================================
// TAB NAVIGATION
// ============================================================
const tabs = ['kalkulator', 'jadwal', 'bundling'];
const tabTitles = {
  'kalkulator': { title: 'Diskon yang Tepat, Bukan Asal Potong Harga', sub: 'Hitung batas diskon aman dari target laba dan kondisi stok Anda.' },
  'jadwal': { title: 'Kalender Rekomendasi Diskon', sub: 'Kalender acuan promosi: tanggal kembar, akhir pekan, payday, dan hari besar. Tidak terkait data produk.' },
  'bundling': { title: 'Kalkulator Bundling', sub: 'Hitung harga paket, penghematan pelanggan, dan estimasi laba.' }
};

function showTab(tabId) {
  tabs.forEach(t => {
    const content = document.getElementById('tab-' + t);
    const navBtn = document.getElementById('nav-btn-' + t);
    const mBtn = document.getElementById('m-btn-' + t);
    const isActive = t === tabId;

    if (content) {
      if (isActive) content.classList.add('active');
      else content.classList.remove('active');
    }

    if (navBtn) {
      if (isActive) {
        navBtn.classList.add('bg-blue-50', 'text-primary', 'border-blue-100', 'font-semibold');
        navBtn.classList.remove('text-slate-600', 'font-medium', 'border-transparent');
        const dot = navBtn.querySelector('.active-indicator');
        if (dot) {
          dot.classList.add('bg-primary');
          dot.classList.remove('bg-transparent');
        }
      } else {
        navBtn.classList.remove('bg-blue-50', 'text-primary', 'border-blue-100', 'font-semibold');
        navBtn.classList.add('text-slate-600', 'font-medium', 'border-transparent');
        const dot = navBtn.querySelector('.active-indicator');
        if (dot) {
          dot.classList.remove('bg-primary');
          dot.classList.add('bg-transparent');
        }
      }
    }

    if (mBtn) {
      if (isActive) {
        mBtn.classList.add('bg-white', 'shadow-xs', 'text-primary', 'font-bold');
        mBtn.classList.remove('text-secondary');
      } else {
        mBtn.classList.remove('bg-white', 'shadow-xs', 'text-primary', 'font-bold');
        mBtn.classList.add('text-secondary');
      }
    }
  });

  if (tabTitles[tabId]) {
    document.getElementById('header-page-title').textContent = tabTitles[tabId].title;
    document.getElementById('header-page-sub').textContent = tabTitles[tabId].sub;
  }

  // Pastikan data selalu segar saat tab dibuka
  if (tabId === 'jadwal' && typeof renderKalender === 'function') {
    renderKalender();
  }
  if (tabId === 'bundling' && typeof generateAutoBundles === 'function') {
    generateAutoBundles(true);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// TOAST
// ============================================================
function showToast(message, icon = 'check_circle') {
  const toast = document.getElementById('toast');
  const msg = document.getElementById('toast-msg');
  const ic = document.getElementById('toast-icon');
  if (!toast || !msg || !ic) return;

  msg.textContent = message;
  ic.textContent = icon;

  toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
  toast.classList.add('translate-y-0', 'opacity-100');

  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
  }, 2600);
}

// ============================================================
// ELEMENT REFERENCES (KALKULATOR)
// ============================================================
const slider = document.getElementById('discount_slider');
const sliderLabel = document.getElementById('slider_percentage_label');

const inputNama = document.getElementById('nama_produk');
const inputModal = document.getElementById('modal_per_unit');
const inputNormal = document.getElementById('harga_jual_normal');
const inputTargetLaba = document.getElementById('target_laba_min');
const inputStok = document.getElementById('stok_tersisa');
const inputVelocity = document.getElementById('sales_velocity');
const inputHari = document.getElementById('hari_tersisa');

const statusCard = document.getElementById('status_card');
const statusIcon = document.getElementById('status_icon');
const statusText = document.getElementById('status_text');
const statusBadgePill = document.getElementById('status_badge_pill');
const urgencyDesc = document.getElementById('urgency_desc');

const momentumBadge = document.getElementById('momentum_badge');
const promoDateRange = document.getElementById('promo_date_range');
const promoDurationLabel = document.getElementById('promo_duration_label');
const velocityAnalysisText = document.getElementById('velocity_analysis_text');
const timingTip = document.getElementById('timing_tip');
const displayExpiredDate = document.getElementById('display_expired_date');
const displayRunRate = document.getElementById('display_run_rate');

const metricFinalPrice = document.getElementById('metric_final_price');
const metricDiscountCut = document.getElementById('metric_discount_cut');
const metricProfitUnit = document.getElementById('metric_profit_unit');
const metricProfitPill = document.getElementById('metric_profit_pill');
const metricProfitStatus = document.getElementById('metric_profit_status');
const metricMaxDiscount = document.getElementById('metric_max_discount');
const metricMaxCut = document.getElementById('metric_max_cut');
const metricMinSafePrice = document.getElementById('metric_min_safe_price');
const metricMinSafeDesc = document.getElementById('metric_min_safe_desc');

const recoveryHeading = document.getElementById('recovery_heading');
const recoveryBatchBadge = document.getElementById('recovery_batch_badge');
const metricCashRecovered = document.getElementById('metric_cash_recovered');
const metricCashStatus = document.getElementById('metric_cash_status');
const profitRecoveryLabel = document.getElementById('profit_recovery_label');
const metricTotalProfit = document.getElementById('metric_total_profit');
const metricTotalTurnover = document.getElementById('metric_total_turnover');

const recPoint1 = document.getElementById('recommendation_point_1');
const recPoint2 = document.getElementById('recommendation_point_2');

// ============================================================
// INIT
// ============================================================
function initApp() {
  loadSavedPreferences();
  recalculate();

  renderKalender();
  initBundleTab();

  showTab('kalkulator');
}
