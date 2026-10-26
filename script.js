/**
 * PeopleDesk - Enterprise HR Employee Management System
 * Vanilla JavaScript (ES6+) Frontend Application Controller
 * Handles State, Validation, Debouncing, DOM Rendering, and REST API Integration
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. Configuration & Global State
  // =========================================================================
  const CONFIG = {
    API_BASE_URL: 'https://peopledesk-api.onrender.com/api',,
    DEBOUNCE_DELAY_MS: 300,
    TOAST_DURATION_MS: 4000,
    CURRENCY_LOCALE: 'en-IN',
    CURRENCY_CODE: 'INR'
  };

  const state = {
    employees: [],
    allEmployees: [],
    departments: [
      { name: 'IT', desc: 'Software Engineering, Cloud, & Systems Architecture', icon: 'laptop', color: '#2563EB' },
      { name: 'HR', desc: 'People Operations, Recruitment, & Workplace Culture', icon: 'users', color: '#9333EA' },
      { name: 'Finance', desc: 'Accounting, Budgeting, Taxation, & Payroll Audits', icon: 'calculator', color: '#059669' },
      { name: 'Marketing', desc: 'Brand Positioning, Content, & Demand Generation', icon: 'megaphone', color: '#EA580C' },
      { name: 'Sales', desc: 'Enterprise Accounts, Pipeline, & Revenue Growth', icon: 'trending-up', color: '#0D9488' },
      { name: 'Operations', desc: 'Supply Chain, Logistics, & Business Process Optimization', icon: 'layers', color: '#475569' }
    ],
    activeView: 'employees',
    summary: {
      totalEmployees: 0,
      totalPayroll: 0,
      departmentCount: 0
    },
    searchQuery: '',
    selectedDepartment: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    isLoading: false,
    isApiOnline: true,
    currentSearchAbortController: null,
    searchSequence: 0,
    activeDeleteTarget: null // Holds { id, name } of employee pending deletion
  };

  // Avatar pastel backgrounds for visual distinction
  const AVATAR_PALETTE = [
    { bg: '#EFF6FF', text: '#2563EB' }, // Blue
    { bg: '#FAF5FF', text: '#9333EA' }, // Purple
    { bg: '#ECFDF5', text: '#059669' }, // Emerald
    { bg: '#FFF7ED', text: '#EA580C' }, // Orange
    { bg: '#F0FDFA', text: '#0D9488' }, // Teal
    { bg: '#FDF2F8', text: '#DB2777' }, // Pink
    { bg: '#F1F5F9', text: '#475569' }  // Slate
  ];

  // View configuration and titles
  const VIEW_TITLES = {
    dashboard: {
      title: 'Executive Dashboard',
      subtitle: 'Real-time organization health, department allocations, and workforce metrics.'
    },
    employees: {
      title: 'Employee Management',
      subtitle: 'Manage your team and employee records.'
    },
    departments: {
      title: 'Department Directory',
      subtitle: 'Overview of all active operational departments and their teams.'
    },
    payroll: {
      title: 'Payroll Analytics & Ledger',
      subtitle: 'Compensation distribution, department payroll expenditures, and salary bands.'
    }
  };

  // =========================================================================
  // 2. DOM Elements Cache
  // =========================================================================
  const DOM = {
    // Page Title & Header
    pageTitle: document.getElementById('pageTitle'),
    pageSubtitle: document.getElementById('pageSubtitle'),

    // Top Navigation & System Status
    apiErrorBanner: document.getElementById('apiErrorBanner'),
    apiEndpointLabel: document.getElementById('apiEndpointLabel'),
    retryConnectionBtn: document.getElementById('retryConnectionBtn'),
    systemStatusPill: document.getElementById('systemStatusPill'),
    systemStatusText: document.getElementById('systemStatusText'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    closeSidebarBtn: document.getElementById('closeSidebarBtn'),
    sidebar: document.getElementById('sidebar'),
    sidebarBackdrop: document.getElementById('sidebarBackdrop'),
    navBadgeCount: document.getElementById('navBadgeCount'),
    navDeptBadge: document.getElementById('navDeptBadge'),
    navLinks: document.querySelectorAll('.sidebar-nav .nav-item'),

    // App Views Containers
    viewDashboard: document.getElementById('viewDashboard'),
    viewEmployees: document.getElementById('viewEmployees'),
    viewDepartments: document.getElementById('viewDepartments'),
    viewPayroll: document.getElementById('viewPayroll'),

    // Dashboard View Elements
    dashTotalStaff: document.getElementById('dashTotalStaff'),
    dashTotalDepts: document.getElementById('dashTotalDepts'),
    dashTotalPayroll: document.getElementById('dashTotalPayroll'),
    dashAnnualPayroll: document.getElementById('dashAnnualPayroll'),
    dashAvgSalary: document.getElementById('dashAvgSalary'),
    dashDeptBarsContainer: document.getElementById('dashDeptBarsContainer'),
    dashSalaryTiersContainer: document.getElementById('dashSalaryTiersContainer'),
    dashRecentHiresBody: document.getElementById('dashRecentHiresBody'),
    dashViewDeptsBtn: document.getElementById('dashViewDeptsBtn'),
    dashViewPayrollBtn: document.getElementById('dashViewPayrollBtn'),
    dashAddEmployeeBtn: document.getElementById('dashAddEmployeeBtn'),
    dashGoDirectoryBtn: document.getElementById('dashGoDirectoryBtn'),
    dashGoPayrollBtn: document.getElementById('dashGoPayrollBtn'),
    dashViewAllHiresBtn: document.getElementById('dashViewAllHiresBtn'),

    // Departments View Elements
    deptHeaderTotalStaff: document.getElementById('deptHeaderTotalStaff'),
    deptHeaderTotalPayroll: document.getElementById('deptHeaderTotalPayroll'),
    deptHeaderTotalDepts: document.getElementById('deptHeaderTotalDepts'),
    openAddDeptModalBtn: document.getElementById('openAddDeptModalBtn'),
    departmentsGridContainer: document.getElementById('departmentsGridContainer'),

    // Payroll View Elements
    payrollStatMonthly: document.getElementById('payrollStatMonthly'),
    payrollStatAnnual: document.getElementById('payrollStatAnnual'),
    payrollStatAverage: document.getElementById('payrollStatAverage'),
    payrollStatHighest: document.getElementById('payrollStatHighest'),
    payrollStatHighestName: document.getElementById('payrollStatHighestName'),
    payrollDeptTableBody: document.getElementById('payrollDeptTableBody'),
    payrollLedgerBody: document.getElementById('payrollLedgerBody'),
    payrollAddEmployeeBtn: document.getElementById('payrollAddEmployeeBtn'),

    // Directory Summary Cards
    statTotalEmployees: document.getElementById('statTotalEmployees'),
    statTotalDepartments: document.getElementById('statTotalDepartments'),
    statTotalPayroll: document.getElementById('statTotalPayroll'),

    // Table & Directory
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    deptFilterSelect: document.getElementById('deptFilterSelect'),
    sortBySelect: document.getElementById('sortBySelect'),
    refreshTableBtn: document.getElementById('refreshTableBtn'),
    employeesTable: document.getElementById('employeesTable'),
    employeesTableBody: document.getElementById('employeesTableBody'),
    tableLoadingState: document.getElementById('tableLoadingState'),
    emptyDirectoryState: document.getElementById('emptyDirectoryState'),
    noSearchResultsState: document.getElementById('noSearchResultsState'),
    noResultsQueryText: document.getElementById('noResultsQueryText'),
    resetSearchBtn: document.getElementById('resetSearchBtn'),
    emptyAddBtn: document.getElementById('emptyAddBtn'),
    displayedCount: document.getElementById('displayedCount'),
    totalMatchingCount: document.getElementById('totalMatchingCount'),

    // Header CSV Export
    exportPayrollCsvBtn: document.getElementById('exportPayrollCsvBtn'),

    // Add / Edit Modal & Live ID Badge Preview
    employeeModal: document.getElementById('employeeModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalSubtitle: document.getElementById('modalSubtitle'),
    openAddModalBtn: document.getElementById('openAddModalBtn'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn'),
    employeeForm: document.getElementById('employeeForm'),
    employeeIdInput: document.getElementById('employeeIdInput'),
    fullNameInput: document.getElementById('fullNameInput'),
    departmentSelect: document.getElementById('departmentSelect'),
    roleInput: document.getElementById('roleInput'),
    salaryInput: document.getElementById('salaryInput'),
    joinDateInput: document.getElementById('joinDateInput'),
    joinDateDisplay: document.getElementById('joinDateDisplay'),
    nativeDatePicker: document.getElementById('nativeDatePicker'),
    openCalendarBtn: document.getElementById('openCalendarBtn'),
    nameError: document.getElementById('nameError'),
    departmentError: document.getElementById('departmentError'),
    roleError: document.getElementById('roleError'),
    salaryError: document.getElementById('salaryError'),
    joinDateError: document.getElementById('joinDateError'),
    saveEmployeeBtn: document.getElementById('saveEmployeeBtn'),
    saveBtnSpinner: document.getElementById('saveBtnSpinner'),
    saveBtnIcon: document.getElementById('saveBtnIcon'),
    saveBtnText: document.getElementById('saveBtnText'),

    // Live Badge Preview Elements
    previewBadgeAvatar: document.getElementById('previewBadgeAvatar'),
    previewBadgeName: document.getElementById('previewBadgeName'),
    previewBadgeRole: document.getElementById('previewBadgeRole'),
    previewBadgeDept: document.getElementById('previewBadgeDept'),
    previewBadgeSalary: document.getElementById('previewBadgeSalary'),
    previewBadgeDate: document.getElementById('previewBadgeDate'),

    // Delete Modal
    deleteModal: document.getElementById('deleteModal'),
    closeDeleteModalBtn: document.getElementById('closeDeleteModalBtn'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    deleteEmployeeName: document.getElementById('deleteEmployeeName'),
    deleteBtnSpinner: document.getElementById('deleteBtnSpinner'),
    deleteBtnIcon: document.getElementById('deleteBtnIcon'),
    deleteBtnText: document.getElementById('deleteBtnText'),

    // Delete Department Modal
    deleteDeptModal: document.getElementById('deleteDeptModal'),
    closeDeleteDeptModalBtn: document.getElementById('closeDeleteDeptModalBtn'),
    cancelDeleteDeptBtn: document.getElementById('cancelDeleteDeptBtn'),
    confirmDeleteDeptBtn: document.getElementById('confirmDeleteDeptBtn'),
    deleteDeptName: document.getElementById('deleteDeptName'),
    deleteDeptWarningText: document.getElementById('deleteDeptWarningText'),
    deleteDeptBtnSpinner: document.getElementById('deleteDeptBtnSpinner'),
    deleteDeptBtnIcon: document.getElementById('deleteDeptBtnIcon'),
    deleteDeptBtnText: document.getElementById('deleteDeptBtnText'),

    // Add Department Modal
    departmentModal: document.getElementById('departmentModal'),
    deptModalTitle: document.getElementById('deptModalTitle'),
    closeDeptModalBtn: document.getElementById('closeDeptModalBtn'),
    cancelDeptModalBtn: document.getElementById('cancelDeptModalBtn'),
    departmentForm: document.getElementById('departmentForm'),
    deptNameInput: document.getElementById('deptNameInput'),
    deptDescInput: document.getElementById('deptDescInput'),
    deptNameError: document.getElementById('deptNameError'),
    deptIconPicker: document.getElementById('deptIconPicker'),
    deptSelectedIcon: document.getElementById('deptSelectedIcon'),
    deptSelectedColor: document.getElementById('deptSelectedColor'),
    saveDeptBtn: document.getElementById('saveDeptBtn'),
    saveDeptSpinner: document.getElementById('saveDeptSpinner'),
    saveDeptIcon: document.getElementById('saveDeptIcon'),
    saveDeptText: document.getElementById('saveDeptText'),

    // Toast
    toastContainer: document.getElementById('toastContainer')
  };

  // =========================================================================
  // 3. Security, Formatting & Helper Utilities
  // =========================================================================

  /**
   * Escapes untrusted text to prevent XSS attacks before DOM insertion
   */
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Formats numeric salary into Indian Rupees with Indian comma grouping
   * e.g. 125000 -> ₹1,25,000
   */
  function formatINR(amount) {
    const num = Number(amount) || 0;
    try {
      return new Intl.NumberFormat(CONFIG.CURRENCY_LOCALE, {
        style: 'currency',
        currency: CONFIG.CURRENCY_CODE,
        maximumFractionDigits: 0
      }).format(num);
    } catch (e) {
      return '₹' + num.toLocaleString('en-IN');
    }
  }

  /**
   * Formats ISO Date to dd/mm/yy localized string (e.g. "15/01/23")
   * Prevents off-by-one errors by parsing UTC year, month, date
   */
  function formatDate(dateInput) {
    if (!dateInput) return 'N/A';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'Invalid Date';

    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const shortYear = String(d.getUTCFullYear()).slice(-2);

    return `${day}/${month}/${shortYear}`;
  }

  /**
   * Parses dd/mm/yy or dd/mm/yyyy string into valid YYYY-MM-DD ISO string
   */
  function parseDDMMYYtoYYYYMMDD(str) {
    if (!str) return null;
    const clean = str.trim();
    const parts = clean.split('/');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;

    // Convert 2-digit year to 4-digit year (cutoff year 50)
    if (year < 100) {
      year += (year <= 50 ? 2000 : 1900);
    } else if (year < 1900 || year > 2100) {
      return null;
    }

    // Verify calendar days validity (e.g. no 31st of February)
    const testDate = new Date(year, month - 1, day);
    if (testDate.getFullYear() !== year || testDate.getMonth() !== month - 1 || testDate.getDate() !== day) {
      return null;
    }

    const yyyy = String(year);
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Converts ISO date to dd/mm/yy format for text inputs
   */
  function formatISOtoDDMMYY(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const yy = String(d.getUTCFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  /**
   * Real-time auto-slash masking for dd/mm/yy input
   */
  function handleDateInputMask(e) {
    if (e.inputType === 'deleteContentBackward') {
      syncHiddenJoinDate();
      return;
    }

    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 6) val = val.substring(0, 6);

    const parts = [];
    if (val.length > 0) parts.push(val.substring(0, 2));
    if (val.length > 2) parts.push(val.substring(2, 4));
    if (val.length > 4) parts.push(val.substring(4, 6));

    e.target.value = parts.join('/');
    syncHiddenJoinDate();
  }

  /**
   * Clears a field specific validation error
   */
  function clearFieldError(errorEl, inputEl) {
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
    if (inputEl) {
      inputEl.classList.remove('is-invalid');
    }
  }

  /**
   * Synchronizes the visible dd/mm/yy input with the hidden YYYY-MM-DD input
   */
  function syncHiddenJoinDate() {
    if (!DOM.joinDateDisplay) return;
    const raw = DOM.joinDateDisplay.value.trim();
    const isoDate = parseDDMMYYtoYYYYMMDD(raw);
    if (isoDate) {
      DOM.joinDateInput.value = isoDate;
      if (DOM.nativeDatePicker) DOM.nativeDatePicker.value = isoDate;
      clearFieldError(DOM.joinDateError, DOM.joinDateDisplay);
    } else {
      DOM.joinDateInput.value = '';
    }
  }

  /**
   * Converts a date to YYYY-MM-DD format for HTML <input type="date">
   */
  function toInputDateFormat(dateInput) {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Generates initials from an employee name (e.g. "Aarav Sharma" -> "AS")
   */
  function getInitials(name) {
    if (!name) return 'EP';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /**
   * Deterministically returns an avatar color pair based on employee name
   */
  function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_PALETTE.length;
    return AVATAR_PALETTE[index];
  }

  /**
   * Safely updates Lucide SVG icons if the CDN library is available
   */
  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  /**
   * Debounce utility to prevent spamming the backend during real-time typing
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // =========================================================================
  // 4. Toast Notification System
  // =========================================================================
  function showToast(message, type = 'info', title = null) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconName = 'info';
    let defaultTitle = 'Notification';
    if (type === 'success') {
      iconName = 'check-circle-2';
      defaultTitle = 'Success';
    } else if (type === 'error') {
      iconName = 'alert-circle';
      defaultTitle = 'Error';
    }

    toast.innerHTML = `
      <i data-lucide="${iconName}" class="toast-icon"></i>
      <div class="toast-body">
        <span class="toast-title">${escapeHTML(title || defaultTitle)}</span>
        <span class="toast-message">${escapeHTML(message)}</span>
      </div>
      <button class="toast-close-btn" aria-label="Close notification">
        <i data-lucide="x"></i>
      </button>
    `;

    DOM.toastContainer.appendChild(toast);
    refreshIcons();

    const closeBtn = toast.querySelector('.toast-close-btn');
    const dismiss = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 250);
    };

    closeBtn.addEventListener('click', dismiss);
    setTimeout(dismiss, CONFIG.TOAST_DURATION_MS);
  }

  // =========================================================================
  // 5. REST API Client Layer
  // =========================================================================

  /**
   * Generic API fetch wrapper with centralized error handling
   */
  async function apiRequest(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const error = new Error(data?.message || `HTTP ${response.status}: Request failed`);
        error.status = response.status;
        error.errors = data?.errors || null;
        error.data = data;
        throw error;
      }

      setSystemStatus(true);
      return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        // Ignored for canceled debounced searches
        throw err;
      }

      // If connection refused / network error
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setSystemStatus(false, 'Cannot reach server');
      }

      throw err;
    }
  }

  /**
   * Updates UI indicator for backend / database connectivity
   */
  function setSystemStatus(isOnline, customText = null) {
    state.isApiOnline = isOnline;
    if (isOnline) {
      DOM.systemStatusPill.className = 'system-status-indicator connected';
      DOM.systemStatusText.textContent = 'MongoDB Connected';
      DOM.apiErrorBanner.classList.add('hidden');
    } else {
      DOM.systemStatusPill.className = 'system-status-indicator error';
      DOM.systemStatusText.textContent = customText || 'Server Offline';
      DOM.apiErrorBanner.classList.remove('hidden');
    }
  }

  /**
   * Health check to test backend on startup
   */
  async function checkHealth() {
    try {
      const result = await apiRequest('/health');
      if (result && result.success) {
        setSystemStatus(true);
      } else {
        setSystemStatus(false, 'DB Degraded');
      }
    } catch (e) {
      setSystemStatus(false, 'Server Offline');
    }
  }

  // =========================================================================
  // 6. Data Loading & Synchronizing
  // =========================================================================

  /**
   * Fetches active departments catalog from backend with localStorage fallback
   */
  async function fetchDepartments() {
    try {
      const result = await apiRequest('/departments');
      if (result && result.success && Array.isArray(result.data) && result.data.length > 0) {
        state.departments = result.data;
        try {
          localStorage.setItem('peopledesk_departments', JSON.stringify(result.data));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Could not fetch departments from API, checking local storage:', err.message);
      try {
        const stored = localStorage.getItem('peopledesk_departments');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length >= 6) {
            state.departments = parsed;
          }
        }
      } catch (e) {}
    }
    syncDepartmentDropdowns();
  }

  /**
   * Synchronizes department options across all filter selects, pills, and modals
   */
  function syncDepartmentDropdowns() {
    // 1. Directory Filter Select
    if (DOM.deptFilterSelect) {
      const current = DOM.deptFilterSelect.value;
      let optHtml = '<option value="">All Departments</option>';
      state.departments.forEach((d) => {
        const selected = current === d.name ? 'selected' : '';
        optHtml += `<option value="${escapeHTML(d.name)}" ${selected}>${escapeHTML(d.name)}</option>`;
      });
      DOM.deptFilterSelect.innerHTML = optHtml;
    }

    // 2. Add / Edit Employee Modal Department Select
    if (DOM.departmentSelect) {
      const current = DOM.departmentSelect.value;
      let modalOptHtml = '<option value="" disabled selected>Select department...</option>';
      state.departments.forEach((d) => {
        const selected = current === d.name ? 'selected' : '';
        modalOptHtml += `<option value="${escapeHTML(d.name)}" ${selected}>${escapeHTML(d.name)}</option>`;
      });
      DOM.departmentSelect.innerHTML = modalOptHtml;
    }
  }

  /**
   * Fetches employees from backend with active search, sort, and updates summary cards
   */
  async function loadEmployees() {
    state.isLoading = true;
    showTableLoading(true);

    // Cancel any in-flight search request to prevent race conditions
    if (state.currentSearchAbortController) {
      state.currentSearchAbortController.abort();
    }
    state.currentSearchAbortController = new AbortController();
    const currentSeq = ++state.searchSequence;

    try {
      const params = new URLSearchParams();
      if (state.selectedDepartment) {
        params.append('department', state.selectedDepartment);
      }
      if (state.searchQuery.trim()) {
        params.append('search', state.searchQuery.trim());
      }
      if (state.sortBy) {
        params.append('sortBy', state.sortBy);
      }
      if (state.sortOrder) {
        params.append('order', state.sortOrder);
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await apiRequest(`/employees${queryString}`, {
        signal: state.currentSearchAbortController.signal
      });

      // Discard older out-of-order responses
      if (currentSeq !== state.searchSequence) return;

      state.employees = response.data || [];
      if (!state.searchQuery && !state.selectedDepartment) {
        state.allEmployees = [...state.employees];
      }
      if (response.summary) {
        state.summary = response.summary;
      }

      renderSummaryCards();
      renderEmployeeTable(response.total || state.employees.length);
      renderActiveViews();
    } catch (error) {
      if (error.name === 'AbortError') return;

      console.error('Failed to load employees:', error);
      showToast(error.message || 'Failed to retrieve employee records', 'error');
      renderErrorState();
    } finally {
      state.isLoading = false;
      showTableLoading(false);
    }
  }

  // =========================================================================
  // 7. UI Rendering Functions
  // =========================================================================

  /**
   * Renders the top dashboard summary cards and updates department quick pills
   */
  function renderSummaryCards() {
    const { totalEmployees, totalPayroll, departmentCount } = state.summary;

    DOM.statTotalEmployees.textContent = totalEmployees.toLocaleString('en-IN');
    if (DOM.statTotalDepartments) {
      DOM.statTotalDepartments.textContent = departmentCount.toString();
    }
    DOM.statTotalPayroll.textContent = formatINR(totalPayroll);
    DOM.navBadgeCount.textContent = totalEmployees.toString();
  }

  /**
   * Renders the data table rows or empty states
   */
  function renderEmployeeTable(totalMatching) {
    const tbody = DOM.employeesTableBody;
    tbody.innerHTML = '';

    DOM.displayedCount.textContent = state.employees.length.toString();
    DOM.totalMatchingCount.textContent = (totalMatching !== undefined ? totalMatching : state.employees.length).toString();

    // 1. If overall database is empty (no employees at all and no search query)
    if (state.summary.totalEmployees === 0 && !state.searchQuery) {
      DOM.employeesTable.classList.add('hidden');
      DOM.emptyDirectoryState.classList.remove('hidden');
      DOM.noSearchResultsState.classList.add('hidden');
      return;
    }

    // 2. If search has no results
    if (state.employees.length === 0 && state.searchQuery) {
      DOM.employeesTable.classList.add('hidden');
      DOM.emptyDirectoryState.classList.add('hidden');
      DOM.noSearchResultsState.classList.remove('hidden');
      DOM.noResultsQueryText.textContent = escapeHTML(state.searchQuery);
      return;
    }

    // 3. Render employee rows
    DOM.employeesTable.classList.remove('hidden');
    DOM.emptyDirectoryState.classList.add('hidden');
    DOM.noSearchResultsState.classList.add('hidden');

    const fragment = document.createDocumentFragment();

    state.employees.forEach((emp) => {
      const tr = document.createElement('tr');
      tr.dataset.id = emp._id || emp.id;

      const initials = getInitials(emp.name);
      const color = getAvatarColor(emp.name);
      const deptClass = `dept-${emp.department}`;
      const shortId = (emp._id || emp.id || '').substring(0, 8);

      tr.innerHTML = `
        <td>
          <div class="employee-cell">
            <div class="employee-avatar" style="background-color: ${color.bg}; color: ${color.text};">
              ${escapeHTML(initials)}
            </div>
            <div class="employee-meta">
              <span class="employee-name">${escapeHTML(emp.name)}</span>
              <span class="employee-id-sub" data-full-id="${escapeHTML(emp._id || emp.id)}" title="Click to copy full ID">
                ID: #${escapeHTML(shortId)}
                <i data-lucide="copy" class="copy-id-icon" style="width: 11px; height: 11px; margin-left: 2px; opacity: 0.7;"></i>
              </span>
            </div>
          </div>
        </td>
        <td>
          <span class="dept-badge ${deptClass}" ${(() => {
            const dobj = state.departments.find(d => d.name === emp.department);
            return (dobj && dobj.color) ? `style="background-color: ${dobj.color}1f; color: ${dobj.color};"` : '';
          })()}>
            ${escapeHTML(emp.department)}
          </span>
        </td>
        <td>
          <span class="role-text">${escapeHTML(emp.role)}</span>
        </td>
        <td>
          <span class="salary-cell">${formatINR(emp.salary)}</span>
        </td>
        <td>
          <span class="date-text">${formatDate(emp.joinDate)}</span>
        </td>
        <td>
          <div class="actions-cell">
            <button class="action-btn edit-btn" data-id="${escapeHTML(emp._id || emp.id)}" title="Edit Employee">
              <i data-lucide="edit-3"></i>
            </button>
            <button class="action-btn delete-btn" data-id="${escapeHTML(emp._id || emp.id)}" data-name="${escapeHTML(emp.name)}" title="Delete Employee">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      `;

      fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);
    refreshIcons();
  }

  // =========================================================================
  // 7b. Multi-View Management & Screen Renderers
  // =========================================================================

  /**
   * Switches active screen view (dashboard, employees, departments, payroll)
   */
  function switchView(viewName, updateHash = true) {
    if (!['dashboard', 'employees', 'departments', 'payroll'].includes(viewName)) {
      viewName = 'employees';
    }

    state.activeView = viewName;
    if (updateHash && window.location.hash !== `#${viewName}`) {
      window.location.hash = `#${viewName}`;
    }

    // 1. Update Navigation Links active class
    DOM.navLinks.forEach((link) => {
      const targetView = link.dataset.view;
      if (targetView === viewName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // 2. Update Page Header Titles
    if (VIEW_TITLES[viewName] && DOM.pageTitle) {
      DOM.pageTitle.textContent = VIEW_TITLES[viewName].title;
      DOM.pageSubtitle.textContent = VIEW_TITLES[viewName].subtitle;
    }

    // 3. Toggle View Containers
    const viewMap = {
      dashboard: DOM.viewDashboard,
      employees: DOM.viewEmployees,
      departments: DOM.viewDepartments,
      payroll: DOM.viewPayroll
    };

    Object.keys(viewMap).forEach((key) => {
      const container = viewMap[key];
      if (container) {
        if (key === viewName) {
          container.classList.remove('hidden');
          container.classList.add('active');
        } else {
          container.classList.add('hidden');
          container.classList.remove('active');
        }
      }
    });

    // 4. Render the data for all views
    renderActiveViews();
    refreshIcons();

    // 5. Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Orchestrates rendering across all views
   */
  function renderActiveViews() {
    renderDashboard();
    renderDepartments();
    renderPayroll();
    refreshIcons();
  }

  /**
   * Renders the Executive Dashboard analytics and quick summaries
   */
  function renderDashboard() {
    const list = state.allEmployees.length ? state.allEmployees : state.employees;
    const totalStaff = state.summary.totalEmployees || list.length;
    const totalPayroll = state.summary.totalPayroll || list.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);
    const avgSalary = totalStaff > 0 ? Math.round(totalPayroll / totalStaff) : 0;
    const annualPayroll = totalPayroll * 12;

    if (DOM.dashTotalStaff) DOM.dashTotalStaff.textContent = totalStaff.toLocaleString('en-IN');
    if (DOM.dashTotalDepts) DOM.dashTotalDepts.textContent = (state.summary.departmentCount || 6).toString();
    if (DOM.dashTotalPayroll) DOM.dashTotalPayroll.textContent = formatINR(totalPayroll);
    if (DOM.dashAvgSalary) DOM.dashAvgSalary.textContent = formatINR(avgSalary);
    if (DOM.dashAnnualPayroll) {
      const annualFormatted = annualPayroll >= 10000000 
        ? `Run-rate: ₹${(annualPayroll / 10000000).toFixed(2)} Cr / yr`
        : `Run-rate: ₹${(annualPayroll / 100000).toFixed(2)} L / yr`;
      DOM.dashAnnualPayroll.textContent = annualFormatted;
    }

    // 1. Department Allocation Bars
    if (DOM.dashDeptBarsContainer) {
      const depts = ['IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations'];
      const deptColors = {
        IT: '#2563EB',
        HR: '#9333EA',
        Finance: '#059669',
        Marketing: '#EA580C',
        Sales: '#0D9488',
        Operations: '#475569'
      };

      let barsHtml = '';
      depts.forEach((dept) => {
        const deptStaff = list.filter((e) => e.department === dept);
        const deptSpend = deptStaff.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);
        const percent = totalPayroll > 0 ? ((deptSpend / totalPayroll) * 100).toFixed(1) : 0;
        const color = deptColors[dept] || '#3157D5';

        barsHtml += `
          <div class="dept-alloc-item">
            <div class="dept-alloc-header">
              <div class="dept-alloc-title-group">
                <span class="dept-alloc-dot" style="background-color: ${color};"></span>
                <span class="dept-alloc-name">${dept}</span>
                <span class="dept-alloc-count">${deptStaff.length} ${deptStaff.length === 1 ? 'member' : 'members'}</span>
              </div>
              <div class="dept-alloc-values">
                <span class="dept-alloc-spend">${formatINR(deptSpend)}</span>
                <span class="dept-alloc-percent">${percent}%</span>
              </div>
            </div>
            <div class="dept-alloc-bar-bg">
              <div class="dept-alloc-bar-fill" style="width: ${percent}%; background-color: ${color};"></div>
            </div>
          </div>
        `;
      });
      DOM.dashDeptBarsContainer.innerHTML = barsHtml;
    }

    // 2. Salary Tiers
    if (DOM.dashSalaryTiersContainer) {
      const tiers = [
        { label: 'Executive & Principal', range: '> ₹1,30,000 / mo', min: 130001, max: Infinity },
        { label: 'Senior Specialist', range: '₹1,10,000 – ₹1,30,000 / mo', min: 110000, max: 130000 },
        { label: 'Mid-Level Professional', range: '₹90,000 – ₹1,09,999 / mo', min: 90000, max: 109999 },
        { label: 'Associate & Entry', range: '< ₹90,000 / mo', min: 0, max: 89999 }
      ];

      let tiersHtml = '';
      tiers.forEach((t) => {
        const inTier = list.filter((e) => (Number(e.salary) || 0) >= t.min && (Number(e.salary) || 0) <= t.max);
        tiersHtml += `
          <div class="salary-tier-item">
            <div class="salary-tier-info">
              <span class="salary-tier-name">${t.label}</span>
              <span class="salary-tier-range">${t.range}</span>
            </div>
            <div class="salary-tier-stat">
              <span class="salary-tier-count">${inTier.length} staff</span>
            </div>
          </div>
        `;
      });
      DOM.dashSalaryTiersContainer.innerHTML = tiersHtml;
    }

    // 3. Recent Hires
    if (DOM.dashRecentHiresBody) {
      const sortedHires = [...list].sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate)).slice(0, 5);
      if (sortedHires.length === 0) {
        DOM.dashRecentHiresBody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 2rem; color: var(--text-muted);">No employee records found.</td></tr>`;
      } else {
        DOM.dashRecentHiresBody.innerHTML = sortedHires.map((emp) => {
          const initials = getInitials(emp.name);
          const color = getAvatarColor(emp.name);
          const deptClass = `dept-${emp.department}`;
          return `
            <tr>
              <td>
                <div class="employee-cell">
                  <div class="employee-avatar" style="background-color: ${color.bg}; color: ${color.text};">
                    ${escapeHTML(initials)}
                  </div>
                  <div class="employee-meta">
                    <span class="employee-name">${escapeHTML(emp.name)}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="dept-badge ${deptClass}">${escapeHTML(emp.department)}</span>
              </td>
              <td><span class="role-text">${escapeHTML(emp.role)}</span></td>
              <td><span class="date-text">${formatDate(emp.joinDate)}</span></td>
              <td><span class="salary-cell">${formatINR(emp.salary)}</span></td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  /**
   * Renders the interactive Departments Directory cards with avatar stacks
   */
  function renderDepartments() {
    const list = state.allEmployees.length ? state.allEmployees : state.employees;
    const totalStaff = state.summary.totalEmployees || list.length;
    const totalPayroll = state.summary.totalPayroll || list.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);

    if (DOM.deptHeaderTotalStaff) DOM.deptHeaderTotalStaff.textContent = `${totalStaff} Staff`;
    if (DOM.deptHeaderTotalPayroll) DOM.deptHeaderTotalPayroll.textContent = formatINR(totalPayroll);
    if (DOM.deptHeaderTotalDepts) DOM.deptHeaderTotalDepts.textContent = `${state.departments.length} Active`;

    if (!DOM.departmentsGridContainer) return;

    let gridHtml = '';
    state.departments.forEach((d) => {
      const deptMembers = list.filter((e) => e.department === d.name);
      const count = deptMembers.length;
      const deptPayroll = deptMembers.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);
      const avgSalary = count > 0 ? Math.round(deptPayroll / count) : 0;
      const deptColor = d.color || '#2563EB';

      // Build Avatar stack (up to 4 members)
      let avatarStackHtml = '<div class="avatar-stack">';
      const previewMembers = deptMembers.slice(0, 4);
      previewMembers.forEach((m) => {
        const initials = getInitials(m.name);
        const col = getAvatarColor(m.name);
        avatarStackHtml += `
          <div class="avatar-stack-item" style="background-color: ${col.bg}; color: ${col.text};" title="${escapeHTML(m.name)} (${escapeHTML(m.role)})">
            ${escapeHTML(initials)}
          </div>
        `;
      });
      if (deptMembers.length > 4) {
        avatarStackHtml += `<div class="avatar-stack-more">+${deptMembers.length - 4}</div>`;
      }
      if (count === 0) {
        avatarStackHtml += `<span style="font-size: 0.75rem; color: var(--text-muted);">No members yet</span>`;
      }
      avatarStackHtml += '</div>';

      gridHtml += `
        <div class="department-card card-dept-${escapeHTML(d.name)}">
          <div class="dept-card-top">
            <div class="dept-card-title-group">
              <div class="dept-icon-box" style="background-color: ${deptColor}1f; color: ${deptColor};">
                <i data-lucide="${escapeHTML(d.icon || 'building-2')}"></i>
              </div>
              <div>
                <h3 class="dept-card-name">${escapeHTML(d.name)}</h3>
                <span class="dept-badge" style="background-color: ${deptColor}1f; color: ${deptColor};">${count} ${count === 1 ? 'member' : 'members'}</span>
              </div>
            </div>
            <button 
              type="button" 
              class="dept-delete-btn" 
              data-dept="${escapeHTML(d.name)}" 
              data-count="${count}"
              title="Delete ${escapeHTML(d.name)} Department" 
              aria-label="Delete ${escapeHTML(d.name)} Department"
            >
              <i data-lucide="trash-2"></i>
            </button>
          </div>
          <p class="dept-card-role-preview">${escapeHTML(d.desc || 'Operational department domain and team responsibilities.')}</p>
          <div class="dept-card-stats-row">
            <div class="dept-card-stat">
              <span class="dept-card-stat-label">Monthly Spend</span>
              <span class="dept-card-stat-val">${formatINR(deptPayroll)}</span>
            </div>
            <div class="dept-card-stat">
              <span class="dept-card-stat-label">Avg. Salary</span>
              <span class="dept-card-stat-val">${count > 0 ? formatINR(avgSalary) : '₹0'}</span>
            </div>
          </div>
          <div class="dept-card-footer">
            ${avatarStackHtml}
            <button class="btn btn-sm btn-outline view-dept-members-btn" data-dept="${escapeHTML(d.name)}" type="button">
              <span>View Team</span>
              <i data-lucide="arrow-right" class="btn-icon"></i>
            </button>
          </div>
        </div>
      `;
    });

    // Append the interactive "+ Add Department" Card
    gridHtml += `
      <div class="department-card dept-card-add" id="cardAddDepartment" role="button" tabindex="0" title="Create a new department">
        <div class="dept-add-inner">
          <div class="dept-add-icon-box">
            <i data-lucide="plus"></i>
          </div>
          <div class="dept-add-text">
            <h3 class="dept-add-title">Add Department</h3>
            <p class="dept-add-desc">Establish a new business unit and start assigning team members</p>
          </div>
          <button class="btn btn-sm btn-outline-primary" type="button" tabindex="-1">
            <i data-lucide="plus" class="btn-icon"></i>
            <span>Create Department</span>
          </button>
        </div>
      </div>
    `;

    DOM.departmentsGridContainer.innerHTML = gridHtml;
    refreshIcons();
  }

  /**
   * Renders the Payroll Analytics breakdown and complete compensation ledger
   */
  function renderPayroll() {
    const list = state.allEmployees.length ? state.allEmployees : state.employees;
    const totalStaff = state.summary.totalEmployees || list.length;
    const totalPayroll = state.summary.totalPayroll || list.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);
    const avgSalary = totalStaff > 0 ? Math.round(totalPayroll / totalStaff) : 0;
    const annualPayroll = totalPayroll * 12;

    if (DOM.payrollStatMonthly) DOM.payrollStatMonthly.textContent = formatINR(totalPayroll);
    if (DOM.payrollStatAnnual) {
      DOM.payrollStatAnnual.textContent = annualPayroll >= 10000000
        ? `₹${(annualPayroll / 10000000).toFixed(2)} Cr`
        : `₹${(annualPayroll / 100000).toFixed(2)} L`;
    }
    if (DOM.payrollStatAverage) DOM.payrollStatAverage.textContent = formatINR(avgSalary);

    // Highest Earner
    const sortedBySalary = [...list].sort((a, b) => (Number(b.salary) || 0) - (Number(a.salary) || 0));
    const highest = sortedBySalary[0];
    if (DOM.payrollStatHighest) {
      DOM.payrollStatHighest.textContent = highest ? formatINR(highest.salary) : '₹0';
    }
    if (DOM.payrollStatHighestName) {
      DOM.payrollStatHighestName.textContent = highest ? `${highest.name} (${highest.department})` : 'No data';
    }

    // 1. Department Payroll Breakdown Table
    if (DOM.payrollDeptTableBody) {
      let deptRows = '';
      state.departments.forEach((d) => {
        const dept = d.name;
        const deptStaff = list.filter((e) => e.department === dept);
        const count = deptStaff.length;
        const spend = deptStaff.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);
        const share = totalPayroll > 0 ? ((spend / totalPayroll) * 100).toFixed(1) : 0;
        const deptAvg = count > 0 ? Math.round(spend / count) : 0;
        const topDeptEarner = [...deptStaff].sort((a, b) => b.salary - a.salary)[0];
        const deptColor = d.color || '#2563EB';

        deptRows += `
          <tr>
            <td>
              <span class="dept-badge" style="background-color: ${deptColor}1f; color: ${deptColor};">
                ${escapeHTML(dept)}
              </span>
            </td>
            <td><strong>${count}</strong> staff</td>
            <td><span class="salary-cell">${formatINR(spend)}</span></td>
            <td>
              <div class="share-progress-container">
                <div class="share-progress-bar">
                  <div class="share-progress-fill" style="width: ${share}%;"></div>
                </div>
                <span class="share-progress-text">${share}%</span>
              </div>
            </td>
            <td><span class="salary-cell">${count > 0 ? formatINR(deptAvg) : '₹0'}</span></td>
            <td>${topDeptEarner ? `<span class="employee-name">${escapeHTML(topDeptEarner.name)}</span> <span class="text-muted" style="font-size: 0.75rem;">(${formatINR(topDeptEarner.salary)})</span>` : '<span class="text-muted">None</span>'}</td>
            <td class="text-right">
              <button class="btn btn-sm btn-ghost view-dept-members-btn" data-dept="${dept}" type="button">
                Filter Team &rarr;
              </button>
            </td>
          </tr>
        `;
      });
      DOM.payrollDeptTableBody.innerHTML = deptRows;
    }

    // 2. Full Compensation Ledger
    if (DOM.payrollLedgerBody) {
      if (sortedBySalary.length === 0) {
        DOM.payrollLedgerBody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 2rem; color: var(--text-muted);">No payroll records found.</td></tr>`;
      } else {
        DOM.payrollLedgerBody.innerHTML = sortedBySalary.map((emp, idx) => {
          const rank = idx + 1;
          const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';
          const initials = getInitials(emp.name);
          const color = getAvatarColor(emp.name);
          const deptClass = `dept-${emp.department}`;
          const share = totalPayroll > 0 ? ((emp.salary / totalPayroll) * 100).toFixed(1) : 0;

          return `
            <tr>
              <td>
                <span class="rank-badge ${rankClass}">#${rank}</span>
              </td>
              <td>
                <div class="employee-cell">
                  <div class="employee-avatar" style="background-color: ${color.bg}; color: ${color.text};">
                    ${escapeHTML(initials)}
                  </div>
                  <div class="employee-meta">
                    <span class="employee-name">${escapeHTML(emp.name)}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="dept-badge ${deptClass}">${escapeHTML(emp.department)}</span>
              </td>
              <td><span class="role-text">${escapeHTML(emp.role)}</span></td>
              <td><span class="salary-cell">${formatINR(emp.salary)}</span></td>
              <td>
                <div class="share-progress-container">
                  <div class="share-progress-bar">
                    <div class="share-progress-fill" style="width: ${share * 3}%; max-width: 100%;"></div>
                  </div>
                  <span class="share-progress-text">${share}%</span>
                </div>
              </td>
              <td><span class="date-text">${formatDate(emp.joinDate)}</span></td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  function showTableLoading(show) {
    if (show) {
      DOM.tableLoadingState.classList.remove('hidden');
      DOM.emptyDirectoryState.classList.add('hidden');
      DOM.noSearchResultsState.classList.add('hidden');
    } else {
      DOM.tableLoadingState.classList.add('hidden');
    }
  }

  function renderErrorState() {
    DOM.employeesTable.classList.add('hidden');
    DOM.emptyDirectoryState.classList.add('hidden');
    DOM.noSearchResultsState.classList.add('hidden');
  }

  // =========================================================================
  // 8. Client-side Form Validation
  // =========================================================================
  const VALID_DEPARTMENTS = ['IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations'];

  function clearFormErrors() {
    const errorContainers = [
      DOM.nameError,
      DOM.departmentError,
      DOM.roleError,
      DOM.salaryError,
      DOM.joinDateError
    ];
    errorContainers.forEach((el) => {
      el.textContent = '';
      el.classList.add('hidden');
    });

    const inputs = DOM.employeeForm.querySelectorAll('.form-control');
    inputs.forEach((input) => input.classList.remove('is-invalid'));
  }

  function showFieldError(errorEl, inputEl, message) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    inputEl.classList.add('is-invalid');
  }

  function validateForm() {
    clearFormErrors();
    let isValid = true;

    // 1. Name validation
    const name = DOM.fullNameInput.value.trim();
    if (!name) {
      showFieldError(DOM.nameError, DOM.fullNameInput, 'Employee full name is required');
      isValid = false;
    } else if (name.length < 2) {
      showFieldError(DOM.nameError, DOM.fullNameInput, 'Name must be at least 2 characters');
      isValid = false;
    } else if (name.length > 100) {
      showFieldError(DOM.nameError, DOM.fullNameInput, 'Name cannot exceed 100 characters');
      isValid = false;
    }

    // 2. Department validation
    const dept = DOM.departmentSelect.value;
    const allowedDeptNames = state.departments ? state.departments.map((d) => d.name) : [];
    if (!dept || !allowedDeptNames.includes(dept)) {
      showFieldError(DOM.departmentError, DOM.departmentSelect, 'Please select a valid department');
      isValid = false;
    }

    // 3. Job Role validation
    const role = DOM.roleInput.value.trim();
    if (!role) {
      showFieldError(DOM.roleError, DOM.roleInput, 'Job role is required');
      isValid = false;
    } else if (role.length < 2) {
      showFieldError(DOM.roleError, DOM.roleInput, 'Job role must be at least 2 characters');
      isValid = false;
    } else if (role.length > 100) {
      showFieldError(DOM.roleError, DOM.roleInput, 'Job role cannot exceed 100 characters');
      isValid = false;
    }

    // 4. Monthly Salary validation
    const salaryVal = DOM.salaryInput.value.trim();
    const salaryNum = Number(salaryVal);
    if (!salaryVal) {
      showFieldError(DOM.salaryError, DOM.salaryInput, 'Monthly salary is required');
      isValid = false;
    } else if (isNaN(salaryNum) || !Number.isFinite(salaryNum)) {
      showFieldError(DOM.salaryError, DOM.salaryInput, 'Salary must be a valid number');
      isValid = false;
    } else if (salaryNum < 0) {
      showFieldError(DOM.salaryError, DOM.salaryInput, 'Salary cannot be negative');
      isValid = false;
    } else if (salaryNum > 100000000) {
      showFieldError(DOM.salaryError, DOM.salaryInput, 'Salary exceeds maximum limit of ₹10,00,00,000');
      isValid = false;
    }

    // 5. Joining Date validation (dd/mm/yy)
    const joinDisplay = DOM.joinDateDisplay ? DOM.joinDateDisplay.value.trim() : '';
    if (!joinDisplay) {
      showFieldError(DOM.joinDateError, DOM.joinDateDisplay || DOM.joinDateInput, 'Joining date is required (dd/mm/yy)');
      isValid = false;
    } else {
      const isoDate = parseDDMMYYtoYYYYMMDD(joinDisplay);
      if (!isoDate) {
        showFieldError(DOM.joinDateError, DOM.joinDateDisplay || DOM.joinDateInput, 'Please enter a valid date in dd/mm/yy format');
        isValid = false;
      } else {
        const selectedDate = new Date(isoDate);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        if (selectedDate > endOfToday) {
          showFieldError(DOM.joinDateError, DOM.joinDateDisplay || DOM.joinDateInput, 'Joining date cannot be set in the future');
          isValid = false;
        } else {
          DOM.joinDateInput.value = isoDate;
        }
      }
    }

    return isValid;
  }

  // =========================================================================
  // 9. Add & Edit Modal Handlers & Live ID Badge Preview
  // =========================================================================

  /**
   * Signature Element: Updates the Live ID Badge Preview in real-time as user types
   */
  function updateModalBadgePreview() {
    if (!DOM.previewBadgeName) return;

    const name = DOM.fullNameInput ? DOM.fullNameInput.value.trim() : '';
    const dept = DOM.departmentSelect ? DOM.departmentSelect.value : '';
    const role = DOM.roleInput ? DOM.roleInput.value.trim() : '';
    const salary = DOM.salaryInput ? DOM.salaryInput.value.trim() : '';
    const date = DOM.joinDateDisplay ? DOM.joinDateDisplay.value.trim() : '';

    const initials = name ? getInitials(name) : 'EP';
    const avatarColor = name ? getAvatarColor(name) : { bg: '#EFF6FF', text: '#2563EB' };

    DOM.previewBadgeAvatar.textContent = initials;
    DOM.previewBadgeAvatar.style.backgroundColor = avatarColor.bg;
    DOM.previewBadgeAvatar.style.color = avatarColor.text;

    DOM.previewBadgeName.textContent = name || 'Employee Name';
    DOM.previewBadgeRole.textContent = role || 'Job Role Title';

    if (dept) {
      DOM.previewBadgeDept.textContent = dept;
      const deptObj = state.departments.find((d) => d.name === dept);
      if (deptObj && deptObj.color) {
        DOM.previewBadgeDept.className = 'dept-badge';
        DOM.previewBadgeDept.style.backgroundColor = `${deptObj.color}1f`;
        DOM.previewBadgeDept.style.color = deptObj.color;
      } else {
        DOM.previewBadgeDept.className = `dept-badge dept-${dept}`;
        DOM.previewBadgeDept.style.backgroundColor = '';
        DOM.previewBadgeDept.style.color = '';
      }
    } else {
      DOM.previewBadgeDept.textContent = 'Department';
      DOM.previewBadgeDept.className = 'dept-badge badge-neutral';
      DOM.previewBadgeDept.style.backgroundColor = '';
      DOM.previewBadgeDept.style.color = '';
    }

    if (salary && !isNaN(Number(salary))) {
      DOM.previewBadgeSalary.textContent = `${formatINR(Number(salary))} / mo`;
    } else {
      DOM.previewBadgeSalary.textContent = '₹0 / mo';
    }

    DOM.previewBadgeDate.textContent = date || 'dd/mm/yy';
  }

  /**
   * Opens modal configured for adding a new employee
   */
  function openAddModal() {
    clearFormErrors();
    DOM.employeeForm.reset();
    DOM.employeeIdInput.value = '';
    DOM.modalTitle.textContent = 'Add New Employee';
    DOM.modalSubtitle.textContent = 'Fill in the employee details below. All fields are required.';
    DOM.saveBtnText.textContent = 'Save Employee';

    // Reset and initialize joining date inputs
    if (DOM.joinDateDisplay) {
      DOM.joinDateDisplay.value = '';
    }
    DOM.joinDateInput.value = '';
    if (DOM.nativeDatePicker) {
      const today = new Date().toISOString().split('T')[0];
      DOM.nativeDatePicker.setAttribute('max', today);
      DOM.nativeDatePicker.value = '';
    }

    updateModalBadgePreview();
    DOM.employeeModal.classList.remove('hidden');
    DOM.fullNameInput.focus();
  }

  /**
   * Opens modal pre-populated with an existing employee record
   */
  async function openEditModal(id) {
    clearFormErrors();
    DOM.modalTitle.textContent = 'Edit Employee';
    DOM.modalSubtitle.textContent = 'Update employee details. Changes will persist directly to MongoDB.';
    DOM.saveBtnText.textContent = 'Update Employee';

    // Set default max date to today
    const today = new Date().toISOString().split('T')[0];
    if (DOM.nativeDatePicker) {
      DOM.nativeDatePicker.setAttribute('max', today);
    }

    try {
      // Fetch fresh record from backend to ensure data currency
      const result = await apiRequest(`/employees/${id}`);
      const emp = result.data;

      if (!emp) throw new Error('Employee record could not be loaded');

      DOM.employeeIdInput.value = emp._id || emp.id;
      DOM.fullNameInput.value = emp.name || '';
      DOM.departmentSelect.value = emp.department || '';
      DOM.roleInput.value = emp.role || '';
      DOM.salaryInput.value = emp.salary !== undefined ? emp.salary : '';
      
      const isoDate = toInputDateFormat(emp.joinDate);
      DOM.joinDateInput.value = isoDate;
      if (DOM.joinDateDisplay) {
        DOM.joinDateDisplay.value = formatISOtoDDMMYY(emp.joinDate);
      }
      if (DOM.nativeDatePicker) {
        DOM.nativeDatePicker.value = isoDate;
      }

      updateModalBadgePreview();
      DOM.employeeModal.classList.remove('hidden');
      DOM.fullNameInput.focus();
    } catch (error) {
      showToast(error.message || 'Could not load employee details', 'error');
    }
  }

  function closeEmployeeModal() {
    DOM.employeeModal.classList.add('hidden');
    DOM.employeeForm.reset();
    clearFormErrors();
    DOM.employeeIdInput.value = '';
  }

  /**
   * Handles Form Submission (Create or Update)
   */
  async function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const id = DOM.employeeIdInput.value.trim();
    const isEdit = Boolean(id);

    const payload = {
      name: DOM.fullNameInput.value.trim(),
      department: DOM.departmentSelect.value,
      role: DOM.roleInput.value.trim(),
      salary: Number(DOM.salaryInput.value.trim()),
      joinDate: DOM.joinDateInput.value
    };

    // UI Loading state on submit button
    setModalSubmitting(true);

    try {
      let result;
      if (isEdit) {
        result = await apiRequest(`/employees/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast(`Employee "${payload.name}" updated successfully!`, 'success');
      } else {
        result = await apiRequest('/employees', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast(`Employee "${payload.name}" created successfully!`, 'success');
      }

      closeEmployeeModal();
      await loadEmployees();
    } catch (error) {
      console.error('Save failed:', error);

      // Map backend field validation errors if provided
      if (error.errors && typeof error.errors === 'object') {
        if (error.errors.name) showFieldError(DOM.nameError, DOM.fullNameInput, error.errors.name);
        if (error.errors.department) showFieldError(DOM.departmentError, DOM.departmentSelect, error.errors.department);
        if (error.errors.role) showFieldError(DOM.roleError, DOM.roleInput, error.errors.role);
        if (error.errors.salary) showFieldError(DOM.salaryError, DOM.salaryInput, error.errors.salary);
        if (error.errors.joinDate) showFieldError(DOM.joinDateError, DOM.joinDateInput, error.errors.joinDate);
      } else {
        showToast(error.message || 'Failed to save employee record', 'error');
      }
    } finally {
      setModalSubmitting(false);
    }
  }

  function setModalSubmitting(isSubmitting) {
    DOM.saveEmployeeBtn.disabled = isSubmitting;
    DOM.cancelModalBtn.disabled = isSubmitting;
    if (isSubmitting) {
      DOM.saveBtnSpinner.classList.remove('hidden');
      DOM.saveBtnIcon.classList.add('hidden');
      DOM.saveBtnText.textContent = 'Saving...';
    } else {
      DOM.saveBtnSpinner.classList.add('hidden');
      DOM.saveBtnIcon.classList.remove('hidden');
      DOM.saveBtnText.textContent = DOM.employeeIdInput.value ? 'Update Employee' : 'Save Employee';
    }
  }

  // =========================================================================
  // 10. Delete Confirmation Modal Handlers
  // =========================================================================

  function openDeleteModal(id, name) {
    state.activeDeleteTarget = { id, name };
    DOM.deleteEmployeeName.textContent = name;
    DOM.deleteModal.classList.remove('hidden');
    DOM.confirmDeleteBtn.focus();
  }

  function closeDeleteModal() {
    DOM.deleteModal.classList.add('hidden');
    state.activeDeleteTarget = null;
    setDeleteSubmitting(false);
  }

  async function handleConfirmDelete() {
    if (!state.activeDeleteTarget) return;
    const { id, name } = state.activeDeleteTarget;

    setDeleteSubmitting(true);

    try {
      await apiRequest(`/employees/${id}`, {
        method: 'DELETE'
      });

      showToast(`Employee "${name}" deleted permanently.`, 'success');
      closeDeleteModal();
      await loadEmployees();
    } catch (error) {
      console.error('Delete failed:', error);
      showToast(error.message || `Failed to delete ${name}`, 'error');
      setDeleteSubmitting(false);
    }
  }

  function setDeleteSubmitting(isSubmitting) {
    DOM.confirmDeleteBtn.disabled = isSubmitting;
    DOM.cancelDeleteBtn.disabled = isSubmitting;
    if (isSubmitting) {
      DOM.deleteBtnSpinner.classList.remove('hidden');
      DOM.deleteBtnIcon.classList.add('hidden');
      DOM.deleteBtnText.textContent = 'Deleting...';
    } else {
      DOM.deleteBtnSpinner.classList.add('hidden');
      DOM.deleteBtnIcon.classList.remove('hidden');
      DOM.deleteBtnText.textContent = 'Delete Employee';
    }
  }

  // =========================================================================
  // 10c. Delete Department Confirmation Modal Handlers
  // =========================================================================

  let pendingDeleteDeptName = null;
  let pendingDeleteDeptCount = 0;

  function openDeleteDeptModal(deptName, memberCount) {
    pendingDeleteDeptName = deptName;
    pendingDeleteDeptCount = memberCount || 0;

    if (DOM.deleteDeptName) DOM.deleteDeptName.textContent = deptName;
    if (DOM.deleteDeptWarningText) {
      if (pendingDeleteDeptCount > 0) {
        DOM.deleteDeptWarningText.innerHTML = `⚠️ This department currently has <strong>${pendingDeleteDeptCount} active employee(s)</strong>. Deleting it will permanently remove the department from directory.`;
      } else {
        DOM.deleteDeptWarningText.textContent = 'This department has no active members and will be permanently removed from the organizational directory.';
      }
    }

    if (DOM.deleteDeptModal) DOM.deleteDeptModal.classList.remove('hidden');
    if (DOM.confirmDeleteDeptBtn) DOM.confirmDeleteDeptBtn.focus();
    refreshIcons();
  }

  function closeDeleteDeptModal() {
    if (DOM.deleteDeptModal) DOM.deleteDeptModal.classList.add('hidden');
    pendingDeleteDeptName = null;
    pendingDeleteDeptCount = 0;
    if (DOM.deleteDeptBtnSpinner) DOM.deleteDeptBtnSpinner.classList.add('hidden');
    if (DOM.deleteDeptBtnIcon) DOM.deleteDeptBtnIcon.classList.remove('hidden');
    if (DOM.deleteDeptBtnText) DOM.deleteDeptBtnText.textContent = 'Delete Department';
    if (DOM.confirmDeleteDeptBtn) DOM.confirmDeleteDeptBtn.disabled = false;
    if (DOM.cancelDeleteDeptBtn) DOM.cancelDeleteDeptBtn.disabled = false;
  }

  async function handleConfirmDeleteDept() {
    if (!pendingDeleteDeptName) return;
    const deptName = pendingDeleteDeptName;

    if (DOM.deleteDeptBtnSpinner) DOM.deleteDeptBtnSpinner.classList.remove('hidden');
    if (DOM.deleteDeptBtnIcon) DOM.deleteDeptBtnIcon.classList.add('hidden');
    if (DOM.deleteDeptBtnText) DOM.deleteDeptBtnText.textContent = 'Deleting...';
    if (DOM.confirmDeleteDeptBtn) DOM.confirmDeleteDeptBtn.disabled = true;
    if (DOM.cancelDeleteDeptBtn) DOM.cancelDeleteDeptBtn.disabled = true;

    try {
      try {
        await apiRequest(`/departments/${encodeURIComponent(deptName)}?force=true`, {
          method: 'DELETE'
        });
      } catch (apiErr) {
        // If 404 or already absent from server, proceed with client removal
        if (!apiErr.message?.toLowerCase().includes('not found')) {
          throw apiErr;
        }
      }

      // Remove from client state
      state.departments = state.departments.filter(
        (d) => d.name.toLowerCase() !== deptName.toLowerCase()
      );

      try {
        localStorage.setItem('peopledesk_departments', JSON.stringify(state.departments));
      } catch (err) {}

      showToast(`Department "${deptName}" deleted successfully!`, 'success');
      closeDeleteDeptModal();

      syncDepartmentDropdowns();
      renderDepartments();
      renderSummaryCards();
      renderPayroll();
    } catch (err) {
      console.error('Delete department failed:', err);
      showToast(err.message || `Failed to delete ${deptName}`, 'error');
      closeDeleteDeptModal();
    }
  }

  // =========================================================================
  // 10b. Add Department Modal Handlers & Live Preview
  // =========================================================================

  function clearDeptFormErrors() {
    if (DOM.deptNameError) {
      DOM.deptNameError.textContent = '';
      DOM.deptNameError.classList.add('hidden');
    }
    if (DOM.deptNameInput) DOM.deptNameInput.classList.remove('is-invalid');
  }

  const DEPT_ICON_COLORS = {
    'laptop': '#2563EB',
    'users': '#9333EA',
    'calculator': '#059669',
    'megaphone': '#EA580C',
    'trending-up': '#0D9488',
    'layers': '#475569',
    'palette': '#DB2777',
    'shield-check': '#0284C7',
    'code-2': '#4F46E5',
    'headphones': '#8B5CF6',
    'sparkles': '#D97706',
    'building-2': '#2563EB'
  };

  function updateDeptPreview() {
    // Safe no-op retained for backwards compatibility
  }

  function openAddDeptModal() {
    clearDeptFormErrors();
    if (DOM.departmentForm) DOM.departmentForm.reset();
    if (DOM.deptSelectedIcon) DOM.deptSelectedIcon.value = 'palette';
    if (DOM.deptSelectedColor) DOM.deptSelectedColor.value = DEPT_ICON_COLORS['palette'] || '#DB2777';

    // Highlight default icon
    const iconChips = document.querySelectorAll('#deptIconPicker .icon-picker-chip');
    iconChips.forEach((chip) => {
      chip.classList.toggle('active', chip.dataset.icon === 'palette');
    });

    if (DOM.deptNameInput) DOM.deptNameInput.value = '';
    if (DOM.deptDescInput) DOM.deptDescInput.value = '';

    if (DOM.departmentModal) {
      DOM.departmentModal.classList.remove('hidden');
      setTimeout(() => DOM.deptNameInput?.focus(), 60);
    }
  }

  function closeAddDeptModal() {
    if (DOM.departmentModal) DOM.departmentModal.classList.add('hidden');
    clearDeptFormErrors();
  }

  async function handleDeptFormSubmit(e) {
    e.preventDefault();
    clearDeptFormErrors();

    const name = DOM.deptNameInput ? DOM.deptNameInput.value.trim() : '';
    const desc = DOM.deptDescInput ? DOM.deptDescInput.value.trim() : '';
    const icon = DOM.deptSelectedIcon ? DOM.deptSelectedIcon.value : 'building-2';
    const color = DOM.deptSelectedColor ? DOM.deptSelectedColor.value : '#2563EB';

    if (!name) {
      if (DOM.deptNameError) {
        DOM.deptNameError.textContent = 'Department name is required';
        DOM.deptNameError.classList.remove('hidden');
      }
      DOM.deptNameInput?.classList.add('is-invalid');
      return;
    }

    if (name.length < 2) {
      if (DOM.deptNameError) {
        DOM.deptNameError.textContent = 'Department name must be at least 2 characters';
        DOM.deptNameError.classList.remove('hidden');
      }
      DOM.deptNameInput?.classList.add('is-invalid');
      return;
    }

    if (name.length > 50) {
      if (DOM.deptNameError) {
        DOM.deptNameError.textContent = 'Department name cannot exceed 50 characters';
        DOM.deptNameError.classList.remove('hidden');
      }
      DOM.deptNameInput?.classList.add('is-invalid');
      return;
    }

    const exists = state.departments.some((d) => d.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      if (DOM.deptNameError) {
        DOM.deptNameError.textContent = `Department '${name}' already exists in directory`;
        DOM.deptNameError.classList.remove('hidden');
      }
      DOM.deptNameInput?.classList.add('is-invalid');
      return;
    }

    // Submit to backend
    if (DOM.saveDeptSpinner) DOM.saveDeptSpinner.classList.remove('hidden');
    if (DOM.saveDeptIcon) DOM.saveDeptIcon.classList.add('hidden');
    if (DOM.saveDeptText) DOM.saveDeptText.textContent = 'Creating...';
    if (DOM.saveDeptBtn) DOM.saveDeptBtn.disabled = true;

    try {
      const res = await apiRequest('/departments', {
        method: 'POST',
        body: JSON.stringify({ name, desc, icon, color })
      });

      const newDept = (res && res.data) ? res.data : { name, desc, icon, color, isCustom: true };
      
      // Update state and persistence
      if (!state.departments.some((d) => d.name.toLowerCase() === newDept.name.toLowerCase())) {
        state.departments.push(newDept);
      }
      try {
        localStorage.setItem('peopledesk_departments', JSON.stringify(state.departments));
      } catch (err) {}

      showToast(`Department "${name}" created successfully!`, 'success');
      closeAddDeptModal();

      syncDepartmentDropdowns();
      renderDepartments();
      renderSummaryCards();
      renderPayroll();
    } catch (err) {
      if (DOM.deptNameError) {
        DOM.deptNameError.textContent = err.message || 'Failed to create department';
        DOM.deptNameError.classList.remove('hidden');
      }
      DOM.deptNameInput?.classList.add('is-invalid');
      showToast(err.message || 'Could not create department', 'error');
    } finally {
      if (DOM.saveDeptSpinner) DOM.saveDeptSpinner.classList.add('hidden');
      if (DOM.saveDeptIcon) DOM.saveDeptIcon.classList.remove('hidden');
      if (DOM.saveDeptText) DOM.saveDeptText.textContent = 'Create Department';
      if (DOM.saveDeptBtn) DOM.saveDeptBtn.disabled = false;
    }
  }

  // =========================================================================
  // 11. Search & Sort Event Handlers
  // =========================================================================

  const handleSearchInput = debounce((e) => {
    state.searchQuery = e.target.value.trim();
    if (state.searchQuery) {
      DOM.clearSearchBtn.classList.remove('hidden');
    } else {
      DOM.clearSearchBtn.classList.add('hidden');
    }
    loadEmployees();
  }, CONFIG.DEBOUNCE_DELAY_MS);

  function handleClearSearch() {
    DOM.searchInput.value = '';
    state.searchQuery = '';
    DOM.clearSearchBtn.classList.add('hidden');
    loadEmployees();
    DOM.searchInput.focus();
  }

  function handleSortChange(e) {
    const val = e.target.value;
    const [field, order] = val.split(':');
    state.sortBy = field;
    state.sortOrder = order;
    loadEmployees();
  }

  // =========================================================================
  // 12. Setup Event Listeners
  // =========================================================================
  function initEventListeners() {
    // Search
    DOM.searchInput.addEventListener('input', handleSearchInput);
    DOM.clearSearchBtn.addEventListener('click', handleClearSearch);
    DOM.resetSearchBtn.addEventListener('click', handleClearSearch);

    // Sorting, Department Filter & Refresh
    if (DOM.deptFilterSelect) {
      DOM.deptFilterSelect.addEventListener('change', (e) => {
        state.selectedDepartment = e.target.value;
        loadEmployees();
      });
    }

    DOM.sortBySelect.addEventListener('change', handleSortChange);
    DOM.refreshTableBtn.addEventListener('click', () => {
      showToast('Refreshing records from MongoDB...', 'info');
      loadEmployees();
    });

    // Reset search button also resets department filter
    DOM.resetSearchBtn.addEventListener('click', () => {
      DOM.searchInput.value = '';
      state.searchQuery = '';
      DOM.clearSearchBtn.classList.add('hidden');
      if (DOM.deptFilterSelect) {
        DOM.deptFilterSelect.value = '';
        state.selectedDepartment = '';
      }
      loadEmployees();
    });

    // Add Modal Triggers
    DOM.openAddModalBtn.addEventListener('click', openAddModal);
    DOM.emptyAddBtn.addEventListener('click', openAddModal);
    DOM.closeModalBtn.addEventListener('click', closeEmployeeModal);
    DOM.cancelModalBtn.addEventListener('click', closeEmployeeModal);
    DOM.employeeForm.addEventListener('submit', handleFormSubmit);

    // Close Add modal on backdrop click
    DOM.employeeModal.addEventListener('click', (e) => {
      if (e.target === DOM.employeeModal) closeEmployeeModal();
    });

    // Table Action Delegations (Edit / Delete)
    DOM.employeesTableBody.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.edit-btn');
      const deleteBtn = e.target.closest('.delete-btn');

      if (editBtn) {
        const id = editBtn.dataset.id;
        if (id) openEditModal(id);
      } else if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        const name = deleteBtn.dataset.name;
        if (id) openDeleteModal(id, name);
      }
    });

    // Delete Modal Actions
    DOM.closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    DOM.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    DOM.confirmDeleteBtn.addEventListener('click', handleConfirmDelete);

    // Close Delete modal on backdrop click
    DOM.deleteModal.addEventListener('click', (e) => {
      if (e.target === DOM.deleteModal) closeDeleteModal();
    });

    // Global Keyboard Shortcuts (Escape to dismiss modals)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!DOM.employeeModal.classList.contains('hidden')) closeEmployeeModal();
        if (!DOM.deleteModal.classList.contains('hidden')) closeDeleteModal();
      }
    });

    // Retry server connection
    DOM.retryConnectionBtn.addEventListener('click', async () => {
      showToast('Checking connection to MongoDB backend...', 'info');
      await checkHealth();
      await loadEmployees();
    });

    // Navigation Links (Sidebar switching)
    DOM.navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = link.dataset.view;
        if (targetView) {
          switchView(targetView);
          // On mobile, close sidebar drawer
          DOM.sidebar.classList.remove('open');
          DOM.sidebarBackdrop.classList.remove('active');
        }
      });
    });

    // Hash change handler for browser back/forward buttons
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash && ['dashboard', 'employees', 'departments', 'payroll'].includes(hash)) {
        switchView(hash, false);
      }
    });

    // View Shortcut Buttons
    if (DOM.dashViewDeptsBtn) DOM.dashViewDeptsBtn.addEventListener('click', () => switchView('departments'));
    if (DOM.dashViewPayrollBtn) DOM.dashViewPayrollBtn.addEventListener('click', () => switchView('payroll'));
    if (DOM.dashAddEmployeeBtn) DOM.dashAddEmployeeBtn.addEventListener('click', openAddModal);
    if (DOM.dashGoDirectoryBtn) DOM.dashGoDirectoryBtn.addEventListener('click', () => switchView('employees'));
    if (DOM.dashGoPayrollBtn) DOM.dashGoPayrollBtn.addEventListener('click', () => switchView('payroll'));
    if (DOM.dashViewAllHiresBtn) DOM.dashViewAllHiresBtn.addEventListener('click', () => switchView('employees'));
    if (DOM.payrollAddEmployeeBtn) DOM.payrollAddEmployeeBtn.addEventListener('click', openAddModal);

    // Global Department Filter Action (From Department card or payroll table)
    document.body.addEventListener('click', (e) => {
      const deptBtn = e.target.closest('.view-dept-members-btn');
      if (deptBtn) {
        const deptName = deptBtn.dataset.dept;
        if (deptName) {
          switchView('employees');
          if (DOM.deptFilterSelect) {
            DOM.deptFilterSelect.value = deptName;
            state.selectedDepartment = deptName;
          }
          DOM.searchInput.value = '';
          state.searchQuery = '';
          DOM.clearSearchBtn.classList.add('hidden');
          loadEmployees();
          if (DOM.deptFilterSelect) {
            DOM.deptFilterSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    });

    // Joining Date Masking & Calendar Picker Events
    if (DOM.joinDateDisplay) {
      DOM.joinDateDisplay.addEventListener('input', handleDateInputMask);
      DOM.joinDateDisplay.addEventListener('blur', syncHiddenJoinDate);
    }

    if (DOM.openCalendarBtn && DOM.nativeDatePicker) {
      DOM.openCalendarBtn.addEventListener('click', () => {
        try {
          if (typeof DOM.nativeDatePicker.showPicker === 'function') {
            DOM.nativeDatePicker.showPicker();
          } else {
            DOM.nativeDatePicker.focus();
            DOM.nativeDatePicker.click();
          }
        } catch (err) {
          DOM.nativeDatePicker.click();
        }
      });

      DOM.nativeDatePicker.addEventListener('change', (e) => {
        const val = e.target.value; // YYYY-MM-DD
        if (val) {
          const [yyyy, mm, dd] = val.split('-');
          const yy = yyyy.slice(-2);
          if (DOM.joinDateDisplay) {
            DOM.joinDateDisplay.value = `${dd}/${mm}/${yy}`;
          }
          DOM.joinDateInput.value = val;
          clearFieldError(DOM.joinDateError, DOM.joinDateDisplay);
          updateModalBadgePreview();
        }
      });
    }

    // Real-time Live ID Badge Preview updates
    if (DOM.employeeForm) {
      DOM.employeeForm.addEventListener('input', updateModalBadgePreview);
      DOM.employeeForm.addEventListener('change', updateModalBadgePreview);
    }


    // Export Payroll Ledger to CSV
    if (DOM.exportPayrollCsvBtn) {
      DOM.exportPayrollCsvBtn.addEventListener('click', exportPayrollToCSV);
    }

    // Global Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // '/' to focus search input (if user not currently typing in a form field)
      if (e.key === '/' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        switchView('employees');
        if (DOM.searchInput) {
          DOM.searchInput.focus();
          DOM.searchInput.select();
        }
      }
      // 'Escape' closes open modal dialog
      if (e.key === 'Escape') {
        if (!DOM.employeeModal.classList.contains('hidden')) {
          closeEmployeeModal();
        } else if (DOM.departmentModal && !DOM.departmentModal.classList.contains('hidden')) {
          closeAddDeptModal();
        } else if (!DOM.deleteModal.classList.contains('hidden')) {
          closeDeleteModal();
        } else if (DOM.deleteDeptModal && !DOM.deleteDeptModal.classList.contains('hidden')) {
          closeDeleteDeptModal();
        }
      }
    });

    // Delete Department Modal Triggers & Controls
    if (DOM.closeDeleteDeptModalBtn) {
      DOM.closeDeleteDeptModalBtn.addEventListener('click', closeDeleteDeptModal);
    }
    if (DOM.cancelDeleteDeptBtn) {
      DOM.cancelDeleteDeptBtn.addEventListener('click', closeDeleteDeptModal);
    }
    if (DOM.confirmDeleteDeptBtn) {
      DOM.confirmDeleteDeptBtn.addEventListener('click', handleConfirmDeleteDept);
    }
    if (DOM.deleteDeptModal) {
      DOM.deleteDeptModal.addEventListener('click', (e) => {
        if (e.target === DOM.deleteDeptModal) closeDeleteDeptModal();
      });
    }

    // Add Department Modal Triggers & Controls
    if (DOM.openAddDeptModalBtn) {
      DOM.openAddDeptModalBtn.addEventListener('click', openAddDeptModal);
    }

    if (DOM.closeDeptModalBtn) {
      DOM.closeDeptModalBtn.addEventListener('click', closeAddDeptModal);
    }

    if (DOM.cancelDeptModalBtn) {
      DOM.cancelDeptModalBtn.addEventListener('click', closeAddDeptModal);
    }

    // Close department modal on backdrop click
    if (DOM.departmentModal) {
      DOM.departmentModal.addEventListener('click', (e) => {
        if (e.target === DOM.departmentModal) closeAddDeptModal();
      });
    }

    // Delegation for "+ Add Department" dashed card in departments grid
    document.body.addEventListener('click', (e) => {
      const addCard = e.target.closest('#cardAddDepartment');
      if (addCard) {
        openAddDeptModal();
        return;
      }

      const deleteDeptBtn = e.target.closest('.dept-delete-btn');
      if (deleteDeptBtn) {
        e.stopPropagation();
        e.preventDefault();
        const deptName = deleteDeptBtn.dataset.dept;
        const count = parseInt(deleteDeptBtn.dataset.count, 10) || 0;
        if (deptName) openDeleteDeptModal(deptName, count);
      }
    });

    // Icon Picker Chip Clicks
    if (DOM.deptIconPicker) {
      DOM.deptIconPicker.addEventListener('click', (e) => {
        const chip = e.target.closest('.icon-picker-chip');
        if (!chip) return;
        const iconName = chip.dataset.icon;
        if (!iconName) return;

        document.querySelectorAll('#deptIconPicker .icon-picker-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        if (DOM.deptSelectedIcon) DOM.deptSelectedIcon.value = iconName;
        if (DOM.deptSelectedColor) DOM.deptSelectedColor.value = DEPT_ICON_COLORS[iconName] || '#2563EB';
      });
    }

    // Department Form Submit
    if (DOM.departmentForm) {
      DOM.departmentForm.addEventListener('submit', handleDeptFormSubmit);
    }

    // Click to copy employee MongoDB ID chip
    document.body.addEventListener('click', (e) => {
      const copyIdChip = e.target.closest('.employee-id-sub');
      if (copyIdChip) {
        const idText = copyIdChip.dataset.fullId || copyIdChip.textContent.replace('ID: #', '').trim();
        if (idText) {
          navigator.clipboard.writeText(idText).then(() => {
            showToast(`Copied ID: #${idText.substring(0, 8)} to clipboard`, 'info');
          }).catch(() => {});
        }
      }
    });

    // Mobile Sidebar Drawer Controls
    DOM.mobileMenuBtn.addEventListener('click', () => {
      DOM.sidebar.classList.add('open');
      DOM.sidebarBackdrop.classList.add('active');
    });

    const closeMobileSidebar = () => {
      DOM.sidebar.classList.remove('open');
      DOM.sidebarBackdrop.classList.remove('active');
    };

    DOM.closeSidebarBtn.addEventListener('click', closeMobileSidebar);
    DOM.sidebarBackdrop.addEventListener('click', closeMobileSidebar);
  }

  /**
   * Generates and downloads a clean, executive CSV file of the employee payroll ledger
   */
  function exportPayrollToCSV() {
    const list = state.allEmployees.length ? state.allEmployees : state.employees;
    if (!list.length) {
      showToast('No payroll records available to export', 'info');
      return;
    }

    const sorted = [...list].sort((a, b) => (Number(b.salary) || 0) - (Number(a.salary) || 0));
    const totalPayroll = sorted.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);

    const headers = [
      'Rank',
      'Employee Name',
      'Department',
      'Job Role',
      'Monthly Salary (INR)',
      'Annual Projected (INR)',
      'Share of Payroll (%)',
      'Joining Date (dd/mm/yy)'
    ];

    const rows = sorted.map((emp, idx) => {
      const rank = idx + 1;
      const annual = (Number(emp.salary) || 0) * 12;
      const share = totalPayroll > 0 ? (((Number(emp.salary) || 0) / totalPayroll) * 100).toFixed(2) : '0';
      const dateStr = formatDate(emp.joinDate);
      return [
        `"#${rank}"`,
        `"${(emp.name || '').replace(/"/g, '""')}"`,
        `"${(emp.department || '').replace(/"/g, '""')}"`,
        `"${(emp.role || '').replace(/"/g, '""')}"`,
        `"${emp.salary}"`,
        `"${annual}"`,
        `"${share}%"`,
        `"${dateStr}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PeopleDesk_Payroll_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Payroll ledger CSV exported successfully', 'success');
  }

  // =========================================================================
  // 13. Application Initialization
  // =========================================================================
  async function initApp() {
    refreshIcons();
    initEventListeners();
    await checkHealth();
    await fetchDepartments();
    await loadEmployees();

    // Check initial hash in URL
    const initialHash = window.location.hash.replace('#', '').toLowerCase();
    if (['dashboard', 'departments', 'payroll'].includes(initialHash)) {
      switchView(initialHash, false);
    } else {
      switchView('employees', false);
    }
  }

  // Run on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
