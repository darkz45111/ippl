// ==================== CONFIGURATION ====================
// Paste your Google Apps Script URL here
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyP3Xl_9rT5YEsENUCh_mDWn2Blxo88oWkMb6K3zisnxroOfTnZf74yiwX2O36rOaMb/exec';

// Your business WhatsApp number (format: country code without '+' or spaces, e.g. 628123456789)
const WA_NUMBER = '628123456789';

// ==================== STATE MANAGEMENT ====================
const state = {
  cars: [],
  filteredCars: [],
  categories: [],
  selectedCategory: 'Semua',
  searchQuery: '',
  isLoading: true,
  isAdmin: false
};

// Mock Data Fallback (Used when SCRIPT_URL is empty or not yet configured)
const MOCK_CARS = [
  {
    id_mobil: "MBL-001",
    kategori: "SUV",
    nama_mobil: "Pajero Sport",
    merk: "Mitsubishi",
    transmisi: "Automatic",
    kursi: 7,
    plat_nomor: "B 1945 ADS",
    harga_sewa: 850000,
    status: "Tersedia",
    image_url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800"
  },
  {
    id_mobil: "MBL-002",
    kategori: "MPV",
    nama_mobil: "Avanza Veloz",
    merk: "Toyota",
    transmisi: "Manual",
    kursi: 7,
    plat_nomor: "D 4821 XYZ",
    harga_sewa: 350000,
    status: "Tersedia",
    image_url: "https://images.unsplash.com/photo-1617469767053-d3b508a0d825?auto=format&fit=crop&q=80&w=800"
  },
  {
    id_mobil: "MBL-003",
    kategori: "Sedan",
    nama_mobil: "Civic Turbo",
    merk: "Honda",
    transmisi: "Automatic",
    kursi: 5,
    plat_nomor: "L 9021 BCD",
    harga_sewa: 950000,
    status: "Disewa",
    image_url: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&q=80&w=800"
  },
  {
    id_mobil: "MBL-004",
    kategori: "MPV",
    nama_mobil: "Innova Zenix",
    merk: "Toyota",
    transmisi: "Automatic",
    kursi: 7,
    plat_nomor: "B 2024 ZNX",
    harga_sewa: 700000,
    status: "Tersedia",
    image_url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=800"
  },
  {
    id_mobil: "MBL-005",
    kategori: "SUV",
    nama_mobil: "Hyundai Creta",
    merk: "Hyundai",
    transmisi: "Automatic",
    kursi: 5,
    plat_nomor: "D 888 CRT",
    harga_sewa: 500000,
    status: "Disewa",
    image_url: "https://images.unsplash.com/photo-1631857455684-a54a2f03665f?auto=format&fit=crop&q=80&w=800"
  },
  {
    id_mobil: "MBL-006",
    kategori: "Sedan",
    nama_mobil: "Camry Hybrid",
    merk: "Toyota",
    transmisi: "Automatic",
    kursi: 5,
    plat_nomor: "B 1111 CMR",
    harga_sewa: 1200000,
    status: "Tersedia",
    image_url: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=800"
  }
];

// ==================== DOM ELEMENTS ====================
const DOM = {
  // Views
  publicView: document.getElementById('public-view'),
  adminView: document.getElementById('admin-view'),
  
  // Public View Elements
  navbar: document.getElementById('navbar'),
  statTotalArmadaPub: document.getElementById('stat-total-armada-pub'),
  statTersediaPub: document.getElementById('stat-tersedia-pub'),
  statDisewaPub: document.getElementById('stat-disewa-pub'),
  categoryFilter: document.getElementById('category-filter'),
  searchInput: document.getElementById('search-input'),
  carsSkeleton: document.getElementById('cars-skeleton'),
  carsGrid: document.getElementById('cars-grid'),
  emptyState: document.getElementById('empty-state'),
  btnLoginTrigger: document.getElementById('btn-login-trigger'),
  
  // Login Modal Elements
  loginModal: document.getElementById('login-modal'),
  loginModalPanel: document.getElementById('login-modal-panel'),
  btnLoginClose: document.getElementById('btn-login-close'),
  btnLoginCloseBackdrop: document.getElementById('btn-login-close-backdrop'),
  loginForm: document.getElementById('login-form'),
  loginError: document.getElementById('login-error'),
  btnSubmitLogin: document.getElementById('btn-submit-login'),
  usernameInput: document.getElementById('username'),
  passwordInput: document.getElementById('password'),
  
  // Admin Dashboard Elements
  adminCurrentDate: document.getElementById('admin-current-date'),
  statTotalArmada: document.getElementById('stat-total-armada'),
  statTersedia: document.getElementById('stat-tersedia'),
  statDisewa: document.getElementById('stat-disewa'),
  adminSearch: document.getElementById('admin-search'),
  adminCarsTbody: document.getElementById('admin-cars-tbody'),
  adminEmptyState: document.getElementById('admin-empty-state'),
  btnLogout: document.getElementById('btn-logout'),
};

// ==================== HELPER FUNCTIONS ====================

// Check if SCRIPT_URL has been configured
function isMockMode() {
  return !SCRIPT_URL || SCRIPT_URL === 'PASTE_URL_GAS_DI_SINI' || SCRIPT_URL.trim() === '';
}

// Format number to Rupiah IDR currency
function formatRupiah(value) {
  const number = Number(value);
  if (isNaN(number)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
}

// Generate customizable WA link
function generateWALink(car) {
  const text = `Halo AutoRent, saya ingin menanyakan ketersediaan mobil:
- Nama: ${car.nama_mobil}
- Merk: ${car.merk}
- Kategori: ${car.kategori}
- Plat Nomor: ${car.plat_nomor}
- Harga: ${formatRupiah(car.harga_sewa)}/hari

Apakah unit ini tersedia untuk disewa?`;
  
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

// Format today's date in Indonesian style (e.g. Selasa, 16 Juni 2026)
function formatIndonesianDate() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date().toLocaleDateString('id-ID', options);
}

// ==================== UI STATE RENDERING ====================

// Set Loading state
function setLoading(loading) {
  state.isLoading = loading;
  if (loading) {
    DOM.carsSkeleton.classList.remove('hidden');
    DOM.carsGrid.classList.add('hidden');
  } else {
    DOM.carsSkeleton.classList.add('hidden');
    DOM.carsGrid.classList.remove('hidden');
  }
}

// Populate statistics cards
function updateStatistics() {
  const total = state.cars.length;
  const tersedia = state.cars.filter(c => c.status && c.status.toLowerCase() === 'tersedia').length;
  const disewa = state.cars.filter(c => c.status && c.status.toLowerCase() === 'disewa').length;

  // Public Stats
  DOM.statTotalArmadaPub.textContent = total;
  DOM.statTersediaPub.textContent = tersedia;
  DOM.statDisewaPub.textContent = disewa;

  // Admin Stats
  DOM.statTotalArmada.textContent = total;
  DOM.statTersedia.textContent = tersedia;
  DOM.statDisewa.textContent = disewa;
}

// Render Kategori Dropdown Option list
function renderCategoriesDropdown() {
  // Extract unique categories
  const rawCategories = state.cars.map(c => c.kategori).filter(Boolean);
  const uniqueCategories = [...new Set(rawCategories)];
  state.categories = ['Semua', ...uniqueCategories];
  
  // Preserve current selection if exists
  const currentSelection = DOM.categoryFilter.value || 'Semua';
  
  DOM.categoryFilter.innerHTML = state.categories.map(cat => {
    return `<option value="${cat}" ${cat === currentSelection ? 'selected' : ''}>${cat}</option>`;
  }).join('');
}

// Filter Cars based on Category and Search queries
function applyFilters() {
  state.filteredCars = state.cars.filter(car => {
    const matchCategory = state.selectedCategory === 'Semua' || car.kategori === state.selectedCategory;
    const searchString = `${car.nama_mobil} ${car.merk} ${car.kategori}`.toLowerCase();
    const matchSearch = searchString.includes(state.searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  renderPublicGrid();
}

// Render Public Card Grid
function renderPublicGrid() {
  if (state.filteredCars.length === 0) {
    DOM.carsGrid.classList.add('hidden');
    DOM.emptyState.classList.remove('hidden');
    DOM.emptyState.classList.add('flex');
    return;
  }

  DOM.emptyState.classList.add('hidden');
  DOM.emptyState.classList.remove('flex');
  DOM.carsGrid.classList.remove('hidden');

  DOM.carsGrid.innerHTML = state.filteredCars.map(car => {
    const isAvailable = car.status && car.status.toLowerCase() === 'tersedia';
    
    // Status badges styling
    const statusBadge = isAvailable
      ? `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><i class="fa-solid fa-circle-check text-[10px] mr-1"></i> Tersedia</span>`
      : `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20"><i class="fa-solid fa-circle-xmark text-[10px] mr-1"></i> Disewa</span>`;

    // WhatsApp Action Button
    const waButton = isAvailable
      ? `<a href="${generateWALink(car)}" target="_blank" class="w-full text-center py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition duration-300 shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 glow-emerald">
          <i class="fa-brands fa-whatsapp text-lg"></i>
          <span>Hubungi WA</span>
         </a>`
      : `<button disabled class="w-full py-2.5 rounded-xl text-sm font-semibold bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed flex items-center justify-center space-x-2">
          <i class="fa-solid fa-ban text-xs"></i>
          <span>Sedang Disewa</span>
         </button>`;

    return `
      <div class="glass-card rounded-2xl p-4 flex flex-col justify-between h-[450px] fade-in">
        <div>
          <!-- Car Image -->
          <div class="card-img-container h-48 w-full bg-slate-900 flex items-center justify-center mb-4">
            <img src="${car.image_url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'}" 
                 alt="${car.nama_mobil}"
                 class="w-full h-full object-cover rounded-xl"
                 onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800';">
          </div>

          <!-- Kategori & Status Badge -->
          <div class="flex justify-between items-center mb-2.5">
            <span class="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded">${car.kategori}</span>
            ${statusBadge}
          </div>

          <!-- Car Details -->
          <h3 class="text-xl font-bold text-white truncate leading-tight">${car.nama_mobil}</h3>
          <p class="text-xs text-gray-500 mt-0.5">${car.merk}</p>

          <!-- Specifications Row -->
          <div class="grid grid-cols-3 gap-1 py-3 border-y border-white/5 my-3.5 text-center text-xs text-gray-400">
            <div class="flex flex-col items-center justify-center border-r border-white/5">
              <i class="fa-solid fa-gears text-indigo-400 mb-1"></i>
              <span class="font-medium truncate max-w-full">${car.transmisi}</span>
            </div>
            <div class="flex flex-col items-center justify-center border-r border-white/5">
              <i class="fa-solid fa-users text-indigo-400 mb-1"></i>
              <span>${car.kursi} Kursi</span>
            </div>
            <div class="flex flex-col items-center justify-center">
              <i class="fa-solid fa-fingerprint text-indigo-400 mb-1"></i>
              <span class="font-mono text-[10px] tracking-tight truncate max-w-full">${car.plat_nomor}</span>
            </div>
          </div>
        </div>

        <!-- Rental Price & Action -->
        <div class="flex items-center justify-between mt-2 pt-2 border-t border-white/5 gap-4">
          <div class="shrink-0">
            <span class="text-[10px] text-gray-500 block">Harga Sewa</span>
            <span class="text-lg font-extrabold text-indigo-400">${formatRupiah(car.harga_sewa)}<span class="text-xs font-normal text-gray-400">/hari</span></span>
          </div>
          <div class="flex-grow">
            ${waButton}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Render Admin Data Table
function renderAdminTable(dataToRender = state.cars) {
  // Remove skeletons
  const skeletons = DOM.adminCarsTbody.querySelectorAll('.admin-table-skeleton');
  skeletons.forEach(s => s.remove());

  if (dataToRender.length === 0) {
    DOM.adminCarsTbody.innerHTML = '';
    DOM.adminEmptyState.classList.remove('hidden');
    return;
  }

  DOM.adminEmptyState.classList.add('hidden');

  DOM.adminCarsTbody.innerHTML = dataToRender.map(car => {
    const isAvailable = car.status && car.status.toLowerCase() === 'tersedia';
    
    // Mini badges for Status Column
    const badge = isAvailable
      ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>Tersedia</span>`
      : `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20"><span class="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5"></span>Disewa</span>`;

    return `
      <tr class="border-b border-white/5 hover:bg-slate-900/30 transition duration-150">
        <td class="py-4 px-6 font-mono text-xs text-indigo-400 font-semibold">${car.id_mobil}</td>
        <td class="py-4 px-6 text-sm font-semibold text-white">
          ${car.nama_mobil}
          <span class="block text-xs font-normal text-gray-500">${car.merk}</span>
        </td>
        <td class="py-4 px-6 font-mono text-xs text-gray-300 uppercase">${car.plat_nomor}</td>
        <td class="py-4 px-6">
          <span class="text-xs bg-slate-800 text-gray-300 px-2 py-1 rounded-lg border border-white/5">${car.kategori}</span>
        </td>
        <td class="py-4 px-6 text-sm font-semibold text-right text-indigo-400 font-mono">${formatRupiah(car.harga_sewa)}</td>
        <td class="py-4 px-6 text-center">${badge}</td>
      </tr>
    `;
  }).join('');
}

// ==================== CORE INITIALIZATION ====================

// Fetch Data from API or Fallback
async function loadData() {
  setLoading(true);
  
  if (isMockMode()) {
    console.warn("⚠️ AUTO-RENT: Running in DEMO MODE (Mock Data Fallback). Configure your SCRIPT_URL to fetch real Google Apps Script data.");
    // Simulate API delay for polished UX
    await new Promise(resolve => setTimeout(resolve, 800));
    state.cars = [...MOCK_CARS];
  } else {
    try {
      const response = await fetch(`${SCRIPT_URL}?action=getMobil`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      state.cars = data;
    } catch (error) {
      console.error("❌ AUTO-RENT: Failed to fetch API data.", error);
      // Fail gracefully and use mock data so page doesn't look broken
      alert("Gagal terhubung ke backend API. Sistem akan memuat data demonstrasi.");
      state.cars = [...MOCK_CARS];
    }
  }

  setLoading(false);
  
  // Sync state
  state.filteredCars = [...state.cars];
  
  // Render views
  updateStatistics();
  renderCategoriesDropdown();
  renderPublicGrid();
  renderAdminTable();
}

// ==================== MODAL CONTROLLER ====================

function showLoginModal() {
  DOM.loginModal.classList.remove('hidden');
  // Trigger animation reflow
  setTimeout(() => {
    DOM.loginModalPanel.classList.remove('scale-95', 'opacity-0');
    DOM.loginModalPanel.classList.add('scale-100', 'opacity-100');
  }, 10);
  DOM.usernameInput.focus();
}

function hideLoginModal() {
  DOM.loginModalPanel.classList.remove('scale-100', 'opacity-100');
  DOM.loginModalPanel.classList.add('scale-95', 'opacity-0');
  DOM.loginError.classList.add('hidden');
  DOM.loginForm.reset();
  
  // Wait for transition duration
  setTimeout(() => {
    DOM.loginModal.classList.add('hidden');
  }, 300);
}

// ==================== AUTHENTICATION LOGIC ====================

async function handleLoginSubmit(event) {
  event.preventDefault();
  
  const username = DOM.usernameInput.value.trim();
  const password = DOM.passwordInput.value.trim();
  
  // Loading button state
  DOM.btnSubmitLogin.disabled = true;
  DOM.btnSubmitLogin.innerHTML = `<i class="fa-solid fa-spinner spinner text-sm mr-2"></i> <span>Memproses...</span>`;
  DOM.loginError.classList.add('hidden');

  let success = false;

  if (isMockMode()) {
    // Demo mode: standard admin/admin validation
    await new Promise(resolve => setTimeout(resolve, 600)); // simulates network delay
    if (username === 'admin' && password === 'admin') {
      success = true;
    }
  } else {
    try {
      const loginUrl = `${SCRIPT_URL}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      const response = await fetch(loginUrl);
      if (!response.ok) throw new Error("HTTP error during login");
      const result = await response.json();
      
      // Expected backend schema: { success: true } or similar
      if (result && result.success) {
        success = true;
      }
    } catch (error) {
      console.error("❌ AUTO-RENT: Login request error.", error);
    }
  }

  // Restore button state
  DOM.btnSubmitLogin.disabled = false;
  DOM.btnSubmitLogin.innerHTML = `<span>Masuk Sekarang</span> <i class="fa-solid fa-arrow-right text-xs"></i>`;

  if (success) {
    state.isAdmin = true;
    hideLoginModal();
    switchToAdminView();
  } else {
    DOM.loginError.classList.remove('hidden');
    DOM.passwordInput.value = '';
    DOM.passwordInput.focus();
  }
}

// Switch between views (SPA transitions)
function switchToAdminView() {
  DOM.publicView.classList.add('hidden');
  DOM.adminView.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleLogout() {
  state.isAdmin = false;
  DOM.adminView.classList.add('hidden');
  DOM.publicView.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== EVENT LISTENERS ====================

function initEventListeners() {
  // Navbar Scrolled listener for backdrop blur addition
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      DOM.navbar.classList.add('nav-scrolled');
      DOM.navbar.classList.remove('py-4');
      DOM.navbar.classList.add('py-2.5');
    } else {
      DOM.navbar.classList.remove('nav-scrolled');
      DOM.navbar.classList.add('py-4');
      DOM.navbar.classList.remove('py-2.5');
    }
  });

  // Category Filter select changes
  DOM.categoryFilter.addEventListener('change', (e) => {
    state.selectedCategory = e.target.value;
    applyFilters();
  });

  // Public Search Bar inputs
  DOM.searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    applyFilters();
  });

  // Admin Search Bar inputs
  DOM.adminSearch.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = state.cars.filter(car => {
      return `${car.nama_mobil} ${car.merk} ${car.plat_nomor} ${car.kategori}`
        .toLowerCase()
        .includes(query);
    });
    renderAdminTable(filtered);
  });

  // Login Trigger Buttons
  DOM.btnLoginTrigger.addEventListener('click', showLoginModal);
  DOM.btnLoginClose.addEventListener('click', hideLoginModal);
  DOM.btnLoginCloseBackdrop.addEventListener('click', hideLoginModal);
  DOM.loginForm.addEventListener('submit', handleLoginSubmit);

  // Logout Trigger Buttons
  DOM.btnLogout.addEventListener('click', handleLogout);
}

// ==================== INITIALIZATION ON WINDOW LOAD ====================
window.onload = () => {
  // Set date in dashboard
  DOM.adminCurrentDate.innerHTML = `<i class="fa-regular fa-calendar-check text-indigo-400"></i> ${formatIndonesianDate()}`;
  
  // Set listeners
  initEventListeners();
  
  // Fetch data
  loadData();
};
