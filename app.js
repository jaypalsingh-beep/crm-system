import { authService } from './js/services/authService.js';
import { leadsService } from './js/services/leadsService.js';
import { activitiesService } from './js/services/activitiesService.js';
import { usersService } from './js/services/usersService.js';
import { settingsService } from './js/services/settingsService.js';

// --- State Management ---
let currentUser = null;
let currentEventAssignments = {};
let currentFormOptions = { events: [], sources: [], reasons: [], actions: [], statuses: [] };
let cachedLeads = []; // For local search/filtering if needed, but we'll mostly use services


let currentViewingLeadId = null;

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const viewSections = document.querySelectorAll('.view-section');
const pageTitle = document.getElementById('pageTitle');

// Leads List & Global Elements
const leadsTableBody = document.getElementById('leadsTableBody');
const recentLeadsTableBody = document.getElementById('recentLeadsTableBody');
const staleLeadsTableBody = document.getElementById('staleLeadsTableBody');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');

// Dashboard stat container
const analyticsDashboard = document.getElementById('analyticsDashboard');

// Lead Detail Elements
const leadDetailsView = document.getElementById('lead-details-view');
const backToLeadsBtn = document.getElementById('backToLeadsBtn');
const notesTimeline = document.getElementById('notesTimeline');
const newNoteText = document.getElementById('newNoteText');
const addNoteBtn = document.getElementById('addNoteBtn');
const detailStatusSelect = document.getElementById('detailStatusSelect');
const editLeadFromDetailBtn = document.getElementById('editLeadFromDetailBtn');

// Floating Action Button
const addLeadFab = document.getElementById('addLeadFab');

// Bulk Import Elements
const bulkImportBtn = document.getElementById('bulkImportBtn');
const bulkImportInput = document.getElementById('bulkImportInput');
const downloadSampleBtn = document.getElementById('downloadSampleBtn');
const dateFromFilter = document.getElementById('dateFromFilter');
const dateToFilter = document.getElementById('dateToFilter');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

// User Management Elements
const userForm = document.getElementById('userForm');
const usersTableBody = document.getElementById('usersTableBody');
const userEventsContainer = document.getElementById('userEventsContainer');
const userPasswordInput = document.getElementById('userPassword');
const editingUserIdInput = document.getElementById('editingUserId');
const userFormTitle = document.getElementById('userFormTitle');
const userSubmitBtn = document.getElementById('userSubmitBtn');
const clearUserBtn = document.getElementById('clearUserBtn');
const userRoleInput = document.getElementById('userRole');
const userRoleSwitcher = document.getElementById('userRoleSwitcher');
const currentUserDisplayName = document.getElementById('currentUserDisplayName');
const currentUserAvatar = document.getElementById('currentUserAvatar');

function showView(viewId, title) {
    if (!currentUser && viewId !== 'login-view') {
        viewId = 'login-view';
        title = 'Login';
    }

    viewSections.forEach(section => {
        section.classList.remove('active');
        if (section.id === viewId) section.classList.add('active');
    });
    
    if (title) pageTitle.innerText = title;

    const isLogin = viewId === 'login-view';
    const sidebar = document.querySelector('.sidebar');
    const topHeader = document.querySelector('.top-header');

    if (sidebar) sidebar.style.display = isLogin ? 'none' : 'flex';
    if (topHeader) topHeader.style.display = isLogin ? 'none' : 'flex';

    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === viewId) item.classList.add('active');
    });
}

const loginView = document.getElementById('login-view');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

// --- Navigation Listeners ---
navItems.forEach(item => {
    item.addEventListener('click', () => {
        if (!currentUser) return; // Prevent navigation if not logged in
        const page = item.getAttribute('data-page');
        showView(page, item.innerText.replace(/[^\w\s]|_/g, "").trim());

        if (page === 'dashboard-view') renderDashboard();
        if (page === 'leads-view') renderLeads();
        if (page === 'users-view') renderUsers();
        if (page === 'settings-view') renderSettings();
        if (page === 'lead-requests-view') renderLeadRequests();

        // Close mobile menu if open
        const sidebarNav = document.querySelector('.sidebar-nav');
        if (sidebarNav) sidebarNav.classList.remove('active');
        
        // Refresh icons after view change
        if (window.lucide) lucide.createIcons();
    });
});

const mobileMenuBtn = document.getElementById('mobileMenuBtn');
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        const sidebarNav = document.querySelector('.sidebar-nav');
        if (sidebarNav) sidebarNav.classList.toggle('active');
    });
}

// --- Auth Logic ---
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.style.display = 'none';
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        console.log("Attempting sign in for:", email);
        const { data, error, success } = await authService.signIn(email, password);
        console.log("Sign in result:", { success, error });
        if (success) {
            showToast("Login successful!", "success");
            await checkAuth();
        } else {
            showToast(error, "error");
            loginError.innerText = error;
            loginError.style.display = 'block';
        }
    });
}


if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await authService.signOut();
        location.reload(); // Simplest way to reset state
    });
}

async function checkAuth() {
    console.log("Checking auth state...");
    const { data: user, success } = await authService.getCurrentUser();
    
    if (success && user) {
        document.body.classList.add('logged-in');
        await usersService.ensureProfile(user);
        currentUser = user;
        applyPermissions();
        
        // Only redirect to dashboard if we are currently on the login view or no view is active
        const activeView = document.querySelector('.view-section.active');
        if (!activeView || activeView.id === 'login-view') {
            loginView.classList.remove('active');
            logoutBtn.style.display = 'block';
            await loadInitialData();
            showView('dashboard-view', 'Dashboard');
            renderDashboard();
        } else {
            // Just refresh data without forcing a view change
            await loadInitialData();
        }
    } else {
        document.body.classList.remove('logged-in');
        currentUser = null;
        showView('login-view', 'Login');
    }
}

// Global Auth Listener
authService.onAuthChange((event, session) => {
    console.log("Auth Event:", event);
    if (event === 'SIGNED_IN') checkAuth();
    if (event === 'SIGNED_OUT') {
        document.body.classList.remove('logged-in');
        location.reload();
    }
});

// Initial call
checkAuth();

async function loadInitialData() {
    const [optionsRes, assignmentsRes] = await Promise.all([
        settingsService.getFormOptions(),
        usersService.getEventAssignments()
    ]);
    
    if (optionsRes.success) {
        // Alphabetically sort all categories
        currentFormOptions = {
            events: (optionsRes.data.events || []).sort((a, b) => a.localeCompare(b)),
            sources: (optionsRes.data.sources || []).sort((a, b) => a.localeCompare(b)),
            reasons: (optionsRes.data.reasons || []).sort((a, b) => a.localeCompare(b)),
            actions: (optionsRes.data.actions || []).sort((a, b) => a.localeCompare(b)),
            statuses: (optionsRes.data.statuses || []).sort((a, b) => a.localeCompare(b))
        };
    }
    if (assignmentsRes.success) currentEventAssignments = assignmentsRes.data;
    
    renderDynamicOptions();
}

// --- Dynamic Form Rendering ---
function renderDynamicOptions() {
    // Populate Selects
    renderSelectOptions(document.getElementById('leadSource'), currentFormOptions.sources, "Select Source");
    renderSelectOptions(document.getElementById('primaryEvent'), currentFormOptions.events, "Select Primary Event");

    // Populate Multi-selects
    renderMultiSelectOptions(document.getElementById('eventsInterestedContainer'), currentFormOptions.events, 'ev');
    
    // Populate the new single selects
    renderSelectOptions(document.getElementById('reasonsSelect'), currentFormOptions.reasons, "Select Reason");
    renderSelectOptions(document.getElementById('actionsSelect'), currentFormOptions.actions, "Select Action");
    renderSelectOptions(document.getElementById('participantStatus'), currentFormOptions.statuses, "Select Status");
    renderSelectOptions(detailStatusSelect, currentFormOptions.statuses);

    renderUserEventOptions();
}

function renderUserEventOptions(excludeExceptUserId = null) {
    if (!userEventsContainer) return;
    
    // Filter events: don't show if already assigned to SOMEONE ELSE
    const assignedToOthers = Object.entries(currentEventAssignments)
        .filter(([ev, assignment]) => assignment.id !== excludeExceptUserId)
        .map(([ev, assignment]) => ev);
        
    const availableEventsForUsers = currentFormOptions.events.filter(ev => !assignedToOthers.includes(ev));
    renderMultiSelectOptions(userEventsContainer, availableEventsForUsers, 'u_ev');
}

function renderSelectOptions(selectElement, opts, placeholder = null) {
    if (!selectElement) return;
    let html = placeholder ? `<option value="" disabled selected>${placeholder}</option>` : '';
    let processedOpts = [...opts];
    const otherIndex = processedOpts.findIndex(opt => opt.toLowerCase() === 'other');
    if (otherIndex !== -1) {
        processedOpts.push(processedOpts.splice(otherIndex, 1)[0]);
    } else {
        processedOpts.push('Other');
    }
    html += processedOpts.map(opt => `<option value="${opt}">${opt}</option>`).join('');
    selectElement.innerHTML = html;
}

function renderMultiSelectOptions(container, opts, prefix) {
    if (!container) return;
    const listContainer = container.querySelector('.checkbox-list');
    if (!listContainer) return;

    let processedOpts = [...opts];
    if (!processedOpts.some(opt => opt.toLowerCase() === 'other')) {
        processedOpts.push('Other');
    }

    // Sort options alphabetically, moving 'Other' to the end.
    const sortedOpts = processedOpts.sort((a, b) => {
        if (a.toLowerCase() === 'other') return 1;
        if (b.toLowerCase() === 'other') return -1;
        return a.localeCompare(b);
    });

    listContainer.innerHTML = sortedOpts.map((opt, index) => `
        <div class="checkbox-item" data-value="${opt.toLowerCase()}">
            <input type="checkbox" id="${prefix}_${index}" value="${opt}">
            <label for="${prefix}_${index}">
                <i data-lucide="check" class="check-icon"></i>
                <span>${opt}</span>
            </label>
        </div>
    `).join('');
    if (window.lucide) lucide.createIcons();

    if (container.id === 'eventsInterestedContainer') {
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.addEventListener('change', togglePrimaryEventVisibility));
    }
}

function togglePrimaryEventVisibility() {
    const selectedEvents = getMultiSelectValues(document.getElementById('eventsInterestedContainer'));
    const primaryEventGroup = document.getElementById('primaryEventGroup');
    const primaryEventSelect = document.getElementById('primaryEvent');
    
    if (selectedEvents.length > 1) {
        primaryEventGroup.style.display = 'block';
        primaryEventSelect.required = true;
    } else {
        primaryEventGroup.style.display = 'none';
        primaryEventSelect.required = false;
        if (selectedEvents.length === 1) {
            primaryEventSelect.value = selectedEvents[0];
            // Update assigned to field based on this event
            const assignedName = currentEventAssignments[selectedEvents[0]]?.name;
            assignToInput.value = assignedName || currentUser?.full_name || currentUser?.email || 'Unassigned';
        } else {
            primaryEventSelect.value = '';
            assignToInput.value = currentUser?.full_name || currentUser?.email || 'Unassigned';
        }
    }
}

// --- Multi-select Search Logic ---
function initMultiSelectSearch() {
    const searchInputs = document.querySelectorAll('.inner-search-input');
    searchInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const container = e.target.closest('.multi-select-container');
            const items = container.querySelectorAll('.checkbox-item');
            
            items.forEach(item => {
                const val = item.getAttribute('data-value');
                if (val.includes(term)) {
                    item.style.display = 'inline-flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

// --- Sidebar logic removed (now permanent) ---
function openLeadSidebar() {}
function closeLeadSidebar() {}


// --- RBAC & Permissions ---
function applyPermissions() {
    if (!currentUser) return;

    // Superadmin Role Switcher (Specific to Jaypal)
    const roleSwitcherContainer = document.getElementById('roleSwitcherContainer');
    const roleSwitcher = document.getElementById('superAdminRoleSwitcher');
    
    const isSuperAdmin = currentUser.email === 'jaypalsingh@invinciblengo.org';
    
    if (isSuperAdmin && roleSwitcherContainer) {
        roleSwitcherContainer.style.display = 'flex';
        // Initialize with user's actual role if not already changed
        if (!roleSwitcher.hasAttribute('data-init')) {
            roleSwitcher.value = currentUser.role || 'Executive';
            roleSwitcher.setAttribute('data-init', 'true');
        }
    }

    // Role to use for UI logic (allow override if superadmin)
    const effectiveRole = (isSuperAdmin && roleSwitcher) ? roleSwitcher.value : currentUser.role;

    // Sidebar items
    const navTeam = document.getElementById('nav-team');
    const navRequests = document.getElementById('nav-requests');
    const navSettings = document.getElementById('nav-settings');

    // Reset visibility
    if (navTeam) navTeam.style.display = 'flex';
    if (navRequests) navRequests.style.display = 'flex';
    if (navSettings) navSettings.style.display = 'flex';

    // Bulk Import toggle
    if (bulkImportBtn) bulkImportBtn.style.display = (effectiveRole === 'Admin') ? 'flex' : 'none';
    if (downloadSampleBtn) downloadSampleBtn.style.display = (effectiveRole === 'Admin') ? 'flex' : 'none';

    // Hide based on role (allowing preview for Superadmin)
    if (effectiveRole === 'Executive') {
        if (navTeam) navTeam.style.display = 'none';
        if (navRequests) navRequests.style.display = 'none';
        if (navSettings) navSettings.style.display = 'none';
    } else if (effectiveRole === 'Manager') {
        if (navRequests) navRequests.style.display = 'none';
        if (navSettings) navSettings.style.display = 'none';
    }

    // Lead Form Permissions
    const assignToField = document.getElementById('assignTo');
    
    // Admin & Manager can assign leads. Executive cannot.
    if (effectiveRole === 'Executive') {
        if (assignToField) assignToField.setAttribute('disabled', true);
    } else {
        if (assignToField) assignToField.removeAttribute('disabled');
    }

    // Lead Detail Permissions
    const editLeadBtn = document.getElementById('editLeadFromDetailBtn');
    
    // Admin can edit core details. Manager/Executive cannot.
    if (editLeadBtn) {
        if (effectiveRole === 'Admin') {
            editLeadBtn.style.display = 'block';
        } else {
            editLeadBtn.style.display = 'none';
        }
    }

    // Update Display
    currentUserDisplayName.innerText = currentUser.full_name || currentUser.email;
    currentUserAvatar.innerText = (currentUser.full_name || currentUser.email).substring(0, 2).toUpperCase();
}

// Superadmin Role Switcher Event
const roleSwitcher = document.getElementById('superAdminRoleSwitcher');
if (roleSwitcher) {
    roleSwitcher.addEventListener('change', async () => {
        applyPermissions();
        showToast("UI View updated to " + document.getElementById('superAdminRoleSwitcher').value, "info");
        
        // Refresh current view structure & data
        const activeView = document.querySelector('.view-section.active');
        if (activeView) {
            if (activeView.id === 'dashboard-view') await renderDashboard();
            if (activeView.id === 'leads-view') await renderLeads();
            if (activeView.id === 'settings-view') await renderSettings();
        }
        
        // Ensure icons are refreshed for new elements
        if (window.lucide) lucide.createIcons();
    });
}

// --- Auto-Assignment ---
const primaryEventSelectGlobal = document.getElementById('primaryEvent');
if (primaryEventSelectGlobal) {
    primaryEventSelectGlobal.addEventListener('change', (e) => {
        const event = e.target.value;
        const assignToInput = document.getElementById('assignTo');
        if (assignToInput) {
            assignToInput.value = currentEventAssignments[event]?.name || currentUser?.full_name || currentUser?.email || "Unassigned";
        }
    });
}

// --- Helper: Get Multi-select values ---
function getMultiSelectValues(container) {
    const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

function setMultiSelectValues(container, values) {
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        cb.checked = values.includes(cb.value);
    });
}

// --- Status Helpers ---
function getStatusClass(status) {
    return 'status-' + status.toLowerCase().replace(/\s+/g, '-');
}

// --- Dashboard Rendering ---
function createStatCard(title, value, iconName) {
    const div = document.createElement('div');
    div.className = 'stat-card';
    div.innerHTML = `
        <div class="stat-icon">
            <i data-lucide="${iconName}"></i>
        </div>
        <div class="stat-info">
            <h3>${title}</h3>
            <p>${value}</p>
        </div>
    `;
    return div;
}

window.renderDashboard = renderDashboard;
window.renderLeads = renderLeads;

async function renderDashboard() {
    try {
        const { data: leads, success } = await leadsService.getLeads();
        if (!success) {
            console.error("Failed to fetch leads for dashboard");
            return;
        }

    if (analyticsDashboard) {
        analyticsDashboard.innerHTML = "";
        
        let totalStatTitle = "Total Inquiries";
        let activeStatTitle = "Active Pipeline";
        let wonStatTitle = "Leads Won";
        
        let pendingCondition = l => !['Booked', 'Payment Done', 'Not Interested', 'Resolved'].includes(l.status);
        let wonCondition = l => ['Booked', 'Payment Done'].includes(l.status);

        if (currentUser && ['Refund Manager', 'Special Camp Manager'].includes(currentUser.role)) {
            totalStatTitle = "Total Issues";
            activeStatTitle = "Pending Issues";
            wonStatTitle = "Resolved Issues";
            wonCondition = l => l.status === 'Resolved';
        }

        const total = leads.length;
        const pending = leads.filter(pendingCondition).length;
        const won = leads.filter(wonCondition).length;
        const urgent = leads.filter(l => l.status === 'Follow-up Needed').length;

        analyticsDashboard.appendChild(createStatCard(totalStatTitle, total, "users"));
        analyticsDashboard.appendChild(createStatCard(activeStatTitle, pending, "layers"));
        analyticsDashboard.appendChild(createStatCard(wonStatTitle, won, "check-circle"));
        analyticsDashboard.appendChild(createStatCard("Urgent Actions", urgent, "alert-circle"));
    }

    // Recent Inquiries Table
    const recentLeads = leads.slice(0, 5);
    recentLeadsTableBody.innerHTML = recentLeads.map(lead => `
        <tr onclick="viewLeadDetail(${lead.id})">
            <td>${new Date(lead.created_at).toLocaleDateString()}</td>
            <td><strong>${lead.full_name}</strong></td>
            <td>${lead.primary_event}</td>
            <td><span class="badge ${getStatusClass(lead.status)}">${lead.status}</span></td>
            <td>${lead.profiles?.full_name || 'Unassigned'}</td>
        </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No inquiries found</td></tr>';

    // Stale Inquiries Logic (No update in 3 days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const staleLeads = leads.filter(l => {
        const lastUpdate = new Date(l.updated_at || l.created_at);
        // exclude won/lost/resolved leads from being "stale"
        const isActive = !['Booked', 'Payment Done', 'Not Interested', 'Resolved', 'Camp Completed'].includes(l.status);
        return isActive && lastUpdate < threeDaysAgo;
    }).sort((a,b) => new Date(a.updated_at || a.created_at) - new Date(b.updated_at || b.created_at));

    if (staleLeadsTableBody) {
        staleLeadsTableBody.innerHTML = staleLeads.map(lead => {
            const lastUpdate = new Date(lead.updated_at || lead.created_at);
            const daysDiff = Math.floor((new Date() - lastUpdate) / (1000 * 60 * 60 * 24));
            
            return `
                <tr onclick="viewLeadDetail(${lead.id})" style="background: rgba(255, 0, 0, 0.02);">
                    <td style="color: var(--error); font-weight: 500;">${daysDiff} days ago</td>
                    <td><strong>${lead.full_name}</strong></td>
                    <td>${lead.phone}</td>
                    <td><span class="badge ${getStatusClass(lead.status)}">${lead.status}</span></td>
                    <td>${lead.profiles?.full_name || 'Unassigned'}</td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--text-muted);">No stale inquiries found. Good job!</td></tr>';
    }

    // Event Analytics
    const eventStats = {};
    leads.forEach(l => eventStats[l.primary_event] = (eventStats[l.primary_event] || 0) + 1);
    const eventBody = document.getElementById('eventAnalyticsBody');
    if (eventBody) {
        eventBody.innerHTML = Object.entries(eventStats).map(([ev, count]) => `
            <tr><td>${ev}</td><td><strong>${count}</strong></td></tr>
        `).join('');
    }

    // User Analytics
    const userStats = {};
    leads.forEach(l => {
        if (!['Booked', 'Not Interested'].includes(l.status)) {
            const userName = l.profiles?.full_name || 'Unassigned';
            userStats[userName] = (userStats[userName] || 0) + 1;
        }
    });
    const userBody = document.getElementById('userAnalyticsBody');
    if (userBody) {
        userBody.innerHTML = Object.entries(userStats).map(([user, count]) => `
            <tr><td>${user}</td><td><span class="badge status-ready-to-book">${count} Active</span></td></tr>
        `).join('');
    }

    if (window.lucide) lucide.createIcons();
    } catch (err) {
        console.error("renderDashboard error:", err);
    }
}

// --- Leads List Rendering ---
async function renderLeads() {
    const filters = {
        status: statusFilter.value,
        search: searchInput.value,
        date_from: dateFromFilter.value,
        date_to: dateToFilter.value
    };

    const { data: leads, success } = await leadsService.getLeads(filters);
    if (!success) return;

    leadsTableBody.innerHTML = leads.map(lead => `
        <tr onclick="viewLeadDetail(${lead.id})">
            <td><strong>${lead.full_name}</strong></td>
            <td>${lead.phone}</td>
            <td>${lead.source}</td>
            <td>${lead.primary_event}</td>
            <td>${lead.travel_date}</td>
            <td><span class="badge ${getStatusClass(lead.status)}">${lead.status}</span></td>
            <td>${lead.profiles?.full_name || 'Unassigned'}</td>
            <td>${(lead.actions_required || []).join(', ') || '-'}</td>
        </tr>
    `).join('') || '<tr><td colspan="9" style="text-align:center; padding: 3rem;">No leads found matching criteria</td></tr>';
    
    if (window.lucide) lucide.createIcons();
}

// --- Lead Detail Logic ---
window.viewLeadDetail = async (id) => {
    const { data: lead, success } = await leadsService.getLeadById(id);
    if (!success || !lead) return;

    currentViewingLeadId = id;
    
    // Fill Details
    document.getElementById('detailFullName').innerText = lead.full_name;
    document.getElementById('detailPhone').innerText = lead.phone;
    document.getElementById('detailSource').innerText = lead.source;
    document.getElementById('detailEvents').innerText = (lead.events_interested || []).join(', ');
    document.getElementById('detailPrimaryEvent').innerText = lead.primary_event;
    document.getElementById('detailTravelDate').innerText = lead.travel_date;
    document.getElementById('detailReasons').innerText = (lead.reasons_to_call || []).join(', ');
    document.getElementById('detailAssigned').innerText = lead.profiles?.full_name || "Unassigned";
    document.getElementById('detailParticipantStatus').innerText = lead.status;
    
    const badge = document.getElementById('detailStatusBadge');
    badge.innerText = lead.status;
    badge.className = `badge ${getStatusClass(lead.status)}`;
    
    document.getElementById('detailCreatedDate').innerText = new Date(lead.created_at).toLocaleDateString();
    document.getElementById('detailActionsRequired').innerText = (lead.actions_required || []).join(', ');
    
    detailStatusSelect.value = lead.status;

    // Show Resolve Issue button for specialized managers
    const resolveBtn = document.getElementById('resolveIssueBtn');
    if (currentUser && ['Refund Manager', 'Special Camp Manager'].includes(currentUser.role)) {
        resolveBtn.style.display = 'inline-block';
    } else {
        resolveBtn.style.display = 'none';
    }

    await renderTimeline(id);
    showView('lead-details-view', 'Inquiry Details');
};

async function renderTimeline(leadId) {
    notesTimeline.innerHTML = '<p style="color: var(--text-muted); font-size: 0.875rem;">Loading activity...</p>';
    console.log("renderTimeline called for lead:", leadId);
    const { data: activities, success, error } = await activitiesService.getActivities(leadId);
    console.log("Activities result:", { success, activities, error });

    notesTimeline.innerHTML = '';
    if (!success || !activities || activities.length === 0) {
        notesTimeline.innerHTML = '<p style="color: var(--text-muted); font-size: 0.875rem;">No activity yet.</p>';
        return;
    }

    // Create table
    const table = document.createElement('table');
    table.className = 'notes-table';
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Timestamp</th><th>User</th><th>Note</th></tr>';
    const tbody = document.createElement('tbody');

    activities.forEach(act => {
        const dateStr = new Date(act.created_at).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
        const userName = act.profiles?.full_name || 'System';
        const row = document.createElement('tr');
        row.innerHTML = `<td>${dateStr}</td><td>${userName}</td><td>${act.content}</td>`;
        tbody.appendChild(row);
    });
    table.appendChild(thead);
    table.appendChild(tbody);
    notesTimeline.appendChild(table);
}

if (addNoteBtn) {
    addNoteBtn.addEventListener('click', async () => {
        const text = newNoteText.value.trim();
        if (!text || !currentViewingLeadId) return;

        const { success } = await activitiesService.addActivity(currentViewingLeadId, 'note', text);
        if (success) {
            showToast("Note added successfully!");
            newNoteText.value = '';
            await renderTimeline(currentViewingLeadId);
        } else {
            showToast("Error adding note", "error");
        }
    });
}


if (detailStatusSelect) {
    detailStatusSelect.addEventListener('change', async (e) => {
    const newStatus = e.target.value;
    if (!currentViewingLeadId) return;

    const { data: lead } = await leadsService.getLeadById(currentViewingLeadId);
    const oldStatus = lead.status;

    const { success } = await leadsService.updateLead(currentViewingLeadId, { status: newStatus });
    if (success) {
        showToast("Status updated to " + newStatus);
        await activitiesService.logStatusChange(currentViewingLeadId, oldStatus, newStatus);
        await viewLeadDetail(currentViewingLeadId); // Refresh view
        await renderDashboard(); // Update counts
    } else {
        showToast("Error updating status", "error");
    }
    });
}

if (backToLeadsBtn) {
    backToLeadsBtn.addEventListener('click', () => {
        showView('leads-view', 'Leads');
        renderLeads();
    });
}

const resolveBtn = document.getElementById('resolveIssueBtn');
if (resolveBtn) {
    resolveBtn.addEventListener('click', async () => {
        if (!currentViewingLeadId) return;
        if (!confirm("Mark this issue as Resolved?")) return;

        const { data: lead } = await leadsService.getLeadById(currentViewingLeadId);
        const oldStatus = lead.status;
        const newStatus = "Resolved";

        const { success, error } = await leadsService.updateLead(currentViewingLeadId, { status: newStatus });
        if (success) {
            showToast("Issue Resolved successfully", "success");
            await activitiesService.logStatusChange(currentViewingLeadId, oldStatus, newStatus);
            await viewLeadDetail(currentViewingLeadId); // Refresh view
            await renderDashboard(); // Update counts
        } else {
            showToast("Error resolving issue: " + error, "error");
        }
    });
}

if (editLeadFromDetailBtn) {
    editLeadFromDetailBtn.addEventListener('click', () => {
        if (currentViewingLeadId) {
            showView('leads-view', 'Leads');
            editLead(currentViewingLeadId);
        }
    });
}

// --- Form & Action Handlers ---
// --- Filters ---
if (searchInput) searchInput.addEventListener('input', renderLeads);
if (statusFilter) statusFilter.addEventListener('change', renderLeads);
if (dateFromFilter) dateFromFilter.addEventListener('change', renderLeads);
if (dateToFilter) dateToFilter.addEventListener('change', renderLeads);

if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
        searchInput.value = '';
        statusFilter.value = 'All';
        dateFromFilter.value = '';
        dateToFilter.value = '';
        renderLeads();
    });
}

window.editLead = async (id) => {
    window.location.href = `new-inquiry.html?id=${id}`;
};

// --- Form Helpers Removed (Moved to new-inquiry.html) ---

// Listeners
// The duplicates are removed
// --- UI Helpers ---
window.appendQuickNote = (targetId, text) => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const currentVal = el.value.trim();
    el.value = currentVal ? currentVal + "\n" + text : text;
    el.focus();
};

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'x-circle' : 'info');
    
    toast.innerHTML = `
        <i data-lucide="${icon}"></i>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- User Management Logic ---
async function renderUsers() {
    console.log("renderUsers: Fetching users...");
    const { data: users, success, error } = await usersService.getUsers();
    console.log("renderUsers: Result:", { success, users, error });
    if (!success) {
        console.error("renderUsers failed:", error);
        return;
    }

    usersTableBody.innerHTML = users.map(user => {
        const displayName = user.full_name || (user.email ? user.email.split('@')[0] : 'Unknown');
        const initial = displayName.substring(0,2).toUpperCase();
        return `
        <tr>
            <td>
                <div class="user-cell">
                    <div class="user-avatar-sm">${initial}</div>
                    <div class="user-meta">
                        <span class="user-name-text">${displayName}</span>
                        <span class="user-email-text">${user.email}</span>
                    </div>
                </div>
            </td>
            <td><span class="badge" style="background: var(--bg-main); border: 1px solid var(--border);">${user.role || 'Executive'}</span></td>
            <td>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${(user.event_assignments || []).map(e => `<span class="badge status-interested">${e.event_value}</span>`).join('')}
                </div>
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon btn-edit" onclick="editUser('${user.id}')" title="Edit User"><i data-lucide="edit-3"></i></button>
                    <button class="btn-icon btn-delete" onclick="deleteUser('${user.id}')" ${currentUser.role !== 'Admin' ? 'disabled style="opacity:0.3;"' : ''} title="Delete User"><i data-lucide="trash-2"></i></button>
                </div>
            </td>
        </tr>
    `}).join('') || '<tr><td colspan="4" style="text-align:center; padding: 2rem;">No team members found</td></tr>';
    
    if (window.lucide) lucide.createIcons();
}

function generatePassword() {
    const pass = 'CRM-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    document.getElementById('userPassword').value = pass;
    return pass;
}

if (userForm) {
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('userName').value;
        const email = document.getElementById('userEmail').value;
        const role = userRoleInput.value;
        const assignedEvents = getMultiSelectValues(userEventsContainer);
        const editingId = editingUserIdInput.value;

        const generatedPass = document.getElementById('userPassword').value || generatePassword();

        let result;
        if (editingId) {
            result = await usersService.updateProfile(editingId, { full_name: name, role });
            if (result.success) {
                await usersService.saveEventAssignments(editingId, assignedEvents);
                showToast("User updated successfully!");
            }
        } else {
            // Direct User Creation
            const signupRes = await authService.signUp(email, generatedPass, { full_name: name, role });
            if (signupRes.success) {
                const newUser = signupRes.data.user;
                await usersService.saveEventAssignments(newUser.id, assignedEvents);
                showToast("User created successfully!", "success");
                result = { success: true };
            } else {
                showToast("Signup failed: " + signupRes.error, "error");
                return;
            }
        }

        if (result && result.success) {
            resetUserForm();
            await renderUsers();
            await loadInitialData(); // Refresh assignments map
        }
    });
}

window.deleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user profile? This won't delete their Auth account but will remove their association with leads and events.")) return;
    const { success, error } = await usersService.deleteUser(id);
    if (success) {
        showToast("User profile deleted.");
        await renderUsers();
        await loadInitialData();
    } else {
        showToast("Delete failed: " + error, "error");
    }
};

window.editUser = async (id) => {
    const { data: users } = await usersService.getUsers();
    const user = users.find(u => u.id === id);
    if (!user) return;

    editingUserIdInput.value = user.id;
    document.getElementById('userName').value = user.full_name;
    document.getElementById('userEmail').value = user.email;
    document.getElementById('userEmail').setAttribute('disabled', true);
    userRoleInput.value = user.role || "Executive";
    
    renderUserEventOptions(user.id);
    const events = (user.event_assignments || []).map(a => a.event_value);
    setMultiSelectValues(userEventsContainer, events);

    userFormTitle.innerText = "Edit User";
    userSubmitBtn.innerText = "Update User";
};



function resetUserForm() {
    userForm.reset();
    editingUserIdInput.value = "";
    userFormTitle.innerText = "Add New User";
    userSubmitBtn.innerText = "Save User";
    renderUserEventOptions();
}

// --- Settings Management ---
async function renderSettings() {
    console.log("renderSettings: Fetching form options...");
    const { data: options, success, error } = await settingsService.getFormOptions();
    console.log("renderSettings: Result:", { success, options, error });
    if (!success) {
        console.error("renderSettings failed:", error);
        return;
    }
    currentFormOptions = options;

    renderSettingsList('events', document.getElementById('settings-events-list'));
    renderSettingsList('sources', document.getElementById('settings-sources-list'));
    renderSettingsList('reasons', document.getElementById('settings-reasons-list'));
    renderSettingsList('actions', document.getElementById('settings-actions-list'));
    renderSettingsList('statuses', document.getElementById('settings-statuses-list'));
}

function renderSettingsList(type, container) {
    if (!container) return;
    container.innerHTML = currentFormOptions[type].map(opt => `
        <div class="settings-item">
            <span class="settings-item-text">${opt}</span>
            <div class="settings-item-actions">
                <button class="btn-icon btn-delete" onclick="deleteOption('${type}', '${opt}')" title="Remove Option">
                    <i data-lucide="x"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    if (window.lucide) lucide.createIcons();
}

window.showAddOption = async (type) => {
    const newVal = prompt(`Enter new ${type.slice(0, -1)}:`);
    if (newVal && newVal.trim() !== "") {
        const res = await settingsService.addFormOption(type, newVal.trim());
        if (res.success) {
            showToast("Option added successfully");
            await renderSettings();
            renderDynamicOptions();
        } else {
            showToast("Error adding option", "error");
        }
    }
};

window.deleteOption = async (type, value) => {
    if (confirm(`Remove "${value}" from ${type}?`)) {
        console.log(`Attempting to delete ${type}: ${value}`);
        const res = await settingsService.deleteFormOption(type, value);
        if (res.success) {
            showToast("Option removed");
            await renderSettings();
            renderDynamicOptions();
        } else {
            console.error("Deletion failed:", res.error);
            showToast(`Error: ${res.error || 'Failed to remove option'}`, "error");
        }
    }
};

if (clearUserBtn) {
    clearUserBtn.addEventListener('click', resetUserForm);
}

// --- Lead Requests Management ---
async function renderLeadRequests() {
    const container = document.getElementById('leadRequestsTableBody');
    if (!container) return;
    
    container.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading requests...</td></tr>';
    const { data: requests, success } = await leadsService.getLeadRequests();
    
    if (!success || !requests || requests.length === 0) {
        container.innerHTML = '<tr><td colspan="6" style="text-align:center;">No pending requests found.</td></tr>';
        return;
    }
    
    container.innerHTML = requests.map(req => {
        const date = new Date(req.created_at).toLocaleDateString('en-IN');
        const events = Array.isArray(req.events_interested) ? req.events_interested.join(', ') : req.events_interested;
        
        return `
            <tr>
                <td>${date}</td>
                <td>${req.phone}</td>
                <td>${events}</td>
                <td>${req.primary_event}</td>
                <td>${req.requester_id === currentUser.id ? 'You' : 'Another User'}</td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-primary btn-sm" onclick="approveRequest('${req.id}', '${req.phone}', ${JSON.stringify(req.events_interested).replace(/"/g, '&quot;')}, '${req.primary_event}')">Approve</button>
                        <button class="btn btn-secondary btn-sm" style="background: var(--error); color: white;" onclick="rejectRequest('${req.id}')">Reject</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.approveRequest = async (id, phone, events, primaryEvent) => {
    if (!confirm("Are you sure you want to approve this change?")) return;
    
    const updates = {
        phone: phone,
        events_interested: events,
        primary_event: primaryEvent
    };
    
    const res = await leadsService.approveLeadRequest(id, updates);
    if (res.success) {
        showToast("Request approved and lead updated!");
        renderLeadRequests();
    } else {
        showToast("Error approving request: " + res.error, "error");
    }
};

window.rejectRequest = async (id) => {
    if (!confirm("Are you sure you want to reject this request?")) return;
    
    const res = await leadsService.rejectLeadRequest(id);
    if (res.success) {
        showToast("Request rejected.");
        renderLeadRequests();
    } else {
        showToast("Error rejecting request: " + res.error, "error");
    }
};

// --- Bulk Import ---
if (bulkImportBtn) {
    bulkImportBtn.addEventListener('click', () => {
        bulkImportInput.click();
    });
}

if (bulkImportInput) {
    bulkImportInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const csv = event.target.result;
            const lines = csv.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            
            // Expected headers: name, phone, source, primary_event, travel_date, remarks
            let successCount = 0;
            let skipCount = 0;
            let errorCount = 0;

            showToast("Processing bulk import...", "info");

            const users = await usersService.getUsers();
            const assignmentMap = await usersService.getEventAssignments();

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                
                const values = lines[i].split(',').map(v => v.trim());
                const row = {};
                headers.forEach((h, index) => {
                    row[h] = values[index];
                });

                const phone = row.phone || "";
                if (!phone) {
                    skipCount++;
                    continue;
                }

                // Check duplicate
                const { data: existing } = await leadsService.getLeadByPhone(phone);
                if (existing) {
                    skipCount++;
                    continue;
                }

                const leadData = {
                    full_name: row.name || row.full_name || "Unknown",
                    phone: phone,
                    source: row.source || "Bulk Import",
                    events_interested: [row.primary_event].filter(Boolean),
                    primary_event: row.primary_event || "",
                    travel_date: row.travel_date || null,
                    reasons_to_call: [], 
                    status: "New Inquiry",
                    actions_required: [],
                    assigned_to: null,
                    remarks: row.remarks || "Imported via bulk upload"
                };

                // Auto-assignment logic
                if (assignmentMap.success && assignmentMap.data[leadData.primary_event]) {
                    const assignedUserName = assignmentMap.data[leadData.primary_event];
                    const userObj = users.data.find(u => u.full_name === assignedUserName);
                    if (userObj) leadData.assigned_to = userObj.id;
                }

                if (!leadData.assigned_to && currentUser) {
                    leadData.assigned_to = currentUser.id;
                }

                const res = await leadsService.createLead(leadData);
                if (res.success) {
                    successCount++;
                    await activitiesService.addActivity(res.data.id, 'status_change', `Lead created via bulk import`);
                } else {
                    errorCount++;
                }
            }

            showToast(`Import completed: ${successCount} saved, ${skipCount} skipped (duplicates/empty), ${errorCount} errors.`, "success");
            bulkImportInput.value = "";
            renderDashboard();
            renderLeads();
        };
        reader.readAsText(file);
    });
}

if (downloadSampleBtn) {
    downloadSampleBtn.addEventListener('click', () => {
        const headers = "name,phone,source,primary_event,travel_date,remarks";
        const sampleRow = "John Doe,1234567890,Google Search,Bali Retreat 2024,2024-12-31,Highly interested";
        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + sampleRow;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "crm_bulk_import_sample.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    initMultiSelectSearch();
    checkAuth();
});
