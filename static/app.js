const API_URL = "";

const THEMES = ["theme-dark", "theme-light", "theme-midnight", "theme-sand", "theme-sky"];

let token = localStorage.getItem("token") || "";
let currentUserRole = localStorage.getItem("user_role") || "manager";
let currentLang = localStorage.getItem("crm_lang") || "ru";
let currentTheme = localStorage.getItem("crm_theme") || "theme-dark";
let currentSection = "dashboard";
let uploadedImages = [];

let galleryImagesList = [];
let galleryActiveIndex = 0;
let calendarEvents = [];

// ─── TOAST-УВЕДОМЛЕНИЯ ───────────────────────────────────────────
function showToast(message, type = "success") {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);
    // Анимация появления
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 350);
    }, 3000);
}

// ─── MODAL HELPERS ────────────────────────────────────────────────
function openModal(name) {
    const modal = document.getElementById(`modal-${name}`);
    if (!modal) return;
    modal.classList.remove("hidden");
    // Автофокус на первое текстовое поле
    setTimeout(() => {
        const first = modal.querySelector("input[type=text], input[type=number], input[type=datetime-local], input[type=date], textarea");
        if (first) first.focus();
    }, 80);
}

function closeModal(name) {
    const modal = document.getElementById(`modal-${name}`);
    if (!modal) return;
    modal.classList.add("hidden");
    // Сбрасываем форму
    const form = modal.querySelector("form");
    if (form) form.reset();
}

// Escape закрывает любую открытую модалку
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        document.querySelectorAll(".modal:not(.hidden)").forEach(m => {
            m.classList.add("hidden");
            const form = m.querySelector("form");
            if (form) form.reset();
        });
    }
});

// Клик по тёмному overlay (не по контенту) закрывает модалку
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
        e.target.classList.add("hidden");
        const form = e.target.querySelector("form");
        if (form) form.reset();
    }
});

// ─── EMPTY STATE HELPER ───────────────────────────────────────────
function renderEmptyState(tbody, cols, message = "Нет данных") {
    tbody.innerHTML = `<tr><td colspan="${cols}" style="text-align:center;padding:40px;color:var(--text-muted);"><i class="fas fa-inbox" style="font-size:28px;display:block;margin-bottom:12px;opacity:0.3;"></i>${message}</td></tr>`;
}

// СЛОВАРЬ ПЕРЕВОДОВ ИНТЕРФЕЙСА (RU, EN, TR)
const TRANSLATIONS = {
    ru: {
        menu_dashboard: "Главная",
        menu_leads: "Лиды",
        menu_opps: "Сделки",
        menu_contacts: "Контакты",
        menu_developers: "Застройщики",
        menu_estate: "Объекты",
        menu_activities: "Деятельность",
        menu_emails: "Эл. письма",
        menu_meetings: "Встречи",
        menu_calls: "Звонки",
        menu_tasks: "Задачи",
        menu_calendar: "Календарь",
        menu_admin: "Администрирование",
        menu_users: "Сотрудники и роли",
        search: "Поиск...",
        stat_leads: "Новых лидов",
        stat_opps: "Активных сделок",
        stat_estate: "Объектов в базе",
        recent_leads: "Последние лиды",
        th_name: "Имя",
        th_phone: "Телефон",
        th_quiz: "Результаты квиза",
        th_date: "Дата",
        title_leads: "Лиды",
        th_status: "Статус",
        title_opps: "Сделки",
        btn_create_opp: "Создать сделку",
        th_title: "Название",
        th_stage: "Этап",
        th_amount: "Сумма (EUR)",
        th_contact: "Контакт",
        title_contacts: "Контакты",
        btn_add_contact: "Добавить контакт",
        th_full_name: "Имя Фамилия",
        th_desc: "Описание",
        title_developers: "Застройщики (Контрагенты)",
        btn_add_dev: "Добавить застройщика",
        th_company: "Название компании",
        th_website: "Веб-сайт",
        title_users: "Сотрудники и права доступа",
        btn_add_user: "Добавить сотрудника",
        th_username: "Логин",
        th_role: "Роль в системе",
        th_permissions: "Права доступа",
        subsections: "Подразделы",
        cat_all: "Все объекты",
        cat_studio: "Студия",
        cat_townhouse: "Таунхаус",
        cat_villa: "Вилла",
        all_estate: "Все объекты недвижимости",
        btn_create_estate: "Создать объект",
        title_emails: "Электронные письма",
        btn_send_email: "Отправить письмо",
        th_subject: "Тема",
        th_from: "От кого",
        th_to: "Кому",
        th_text: "Текст письма",
        title_meetings: "Встречи",
        btn_add_meeting: "Запланировать встречу",
        th_meet_title: "Тема встречи",
        th_datetime: "Дата и время",
        th_duration: "Длительность",
        th_client: "Клиент",
        title_calls: "Звонки",
        btn_add_call: "Запланировать звонок",
        th_call_title: "Тема звонка",
        title_tasks: "Задачи",
        btn_add_task: "Добавить задачу",
        th_task_title: "Название задачи",
        th_due: "Срок выполнения",
        title_calendar: "Календарь событий",
        day_mon: "Пн", day_tue: "Вт", day_wed: "Ср", day_thu: "Чт", day_fri: "Пт", day_sat: "Сб", day_sun: "Вс"
    },
    en: {
        menu_dashboard: "Dashboard",
        menu_leads: "Leads",
        menu_opps: "Deals",
        menu_contacts: "Contacts",
        menu_developers: "Developers",
        menu_estate: "Properties",
        menu_activities: "Activities",
        menu_emails: "Emails",
        menu_meetings: "Meetings",
        menu_calls: "Calls",
        menu_tasks: "Tasks",
        menu_calendar: "Calendar",
        menu_admin: "Administration",
        menu_users: "Team & Roles",
        search: "Search...",
        stat_leads: "New Leads",
        stat_opps: "Active Deals",
        stat_estate: "Properties in DB",
        recent_leads: "Recent Leads",
        th_name: "Name",
        th_phone: "Phone",
        th_quiz: "Quiz Results",
        th_date: "Date",
        title_leads: "Leads",
        th_status: "Status",
        title_opps: "Deals",
        btn_create_opp: "Create Deal",
        th_title: "Title",
        th_stage: "Stage",
        th_amount: "Amount (EUR)",
        th_contact: "Contact",
        title_contacts: "Contacts",
        btn_add_contact: "Add Contact",
        th_full_name: "Full Name",
        th_desc: "Description",
        title_developers: "Developers (Partners)",
        btn_add_dev: "Add Developer",
        th_company: "Company Name",
        th_website: "Website",
        title_users: "Team & Permissions",
        btn_add_user: "Add User",
        th_username: "Username",
        th_role: "Role",
        th_permissions: "Permissions",
        subsections: "Categories",
        cat_all: "All Properties",
        cat_studio: "Studio",
        cat_townhouse: "Townhouse",
        cat_villa: "Villa",
        all_estate: "All Real Estate Properties",
        btn_create_estate: "Create Property",
        title_emails: "Emails",
        btn_send_email: "Send Email",
        th_subject: "Subject",
        th_from: "From",
        th_to: "To",
        th_text: "Body",
        title_meetings: "Meetings",
        btn_add_meeting: "Schedule Meeting",
        th_meet_title: "Meeting Title",
        th_datetime: "Date & Time",
        th_duration: "Duration",
        th_client: "Client",
        title_calls: "Calls",
        btn_add_call: "Schedule Call",
        th_call_title: "Call Title",
        title_tasks: "Tasks",
        btn_add_task: "Add Task",
        th_task_title: "Task Name",
        th_due: "Due Date",
        title_calendar: "Event Calendar",
        day_mon: "Mon", day_tue: "Tue", day_wed: "Wed", day_thu: "Thu", day_fri: "Fri", day_sat: "Sat", day_sun: "Sun"
    },
    tr: {
        menu_dashboard: "Ana Sayfa",
        menu_leads: "Potansiyel Müşteriler",
        menu_opps: "Fırsatlar",
        menu_contacts: "Kişiler",
        menu_developers: "Müteahhitler",
        menu_estate: "Gayrimenkuller",
        menu_activities: "Etkinlikler",
        menu_emails: "E-postalar",
        menu_meetings: "Toplantılar",
        menu_calls: "Aramalar",
        menu_tasks: "Görevler",
        menu_calendar: "Takvim",
        menu_admin: "Yönetim",
        menu_users: "Ekip ve Rollerin Yönetimi",
        search: "Ara...",
        stat_leads: "Yeni Müşteriler",
        stat_opps: "Aktif Fırsatlar",
        stat_estate: "Veritabanındaki Mülkler",
        recent_leads: "Son Müşteriler",
        th_name: "İsim",
        th_phone: "Telefon",
        th_quiz: "Test Sonuçları",
        th_date: "Tarih",
        title_leads: "Müşteri Adayları",
        th_status: "Durum",
        title_opps: "Fırsatlar",
        btn_create_opp: "Fırsat Oluştur",
        th_title: "Başlık",
        th_stage: "Aşama",
        th_amount: "Tutar (EUR)",
        th_contact: "Kişi",
        title_contacts: "Kişiler",
        btn_add_contact: "Kişi Ekle",
        th_full_name: "Ad Soyad",
        th_desc: "Açıklama",
        title_developers: "Müteahhitler (Ortaklar)",
        btn_add_dev: "Müteahhit Ekle",
        th_company: "Şirket Adı",
        th_website: "Web Sitesi",
        title_users: "Ekip ve İzinler",
        btn_add_user: "Kullanıcı Ekle",
        th_username: "Kullanıcı Adı",
        th_role: "Rol",
        th_permissions: "İzinler",
        subsections: "Kategoriler",
        cat_all: "Tüm Mülkler",
        cat_studio: "Stüdyo",
        cat_townhouse: "Townhouse",
        cat_villa: "Villa",
        all_estate: "Tüm Gayrimenkuller",
        btn_create_estate: "Mülk Oluştur",
        title_emails: "E-postalar",
        btn_send_email: "E-posta Gönder",
        th_subject: "Konu",
        th_from: "Gönderen",
        th_to: "Alıcı",
        th_text: "Mesaj Metni",
        title_meetings: "Toplantılar",
        btn_add_meeting: "Toplantı Planla",
        th_meet_title: "Toplantı Konusu",
        th_datetime: "Tarih ve Saat",
        th_duration: "Süre",
        th_client: "Müşteri",
        title_calls: "Aramalar",
        btn_add_call: "Arama Planla",
        th_call_title: "Arama Konusu",
        title_tasks: "Görevler",
        btn_add_task: "Görev Ekle",
        th_task_title: "Görev Adı",
        th_due: "Bitiş Tarihi",
        title_calendar: "Etkinlik Takvimi",
        day_mon: "Pzt", day_tue: "Sal", day_wed: "Çar", day_thu: "Per", day_fri: "Cum", day_sat: "Cmt", day_sun: "Paz"
    }
};

document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    setupRouting();
    setupForms();
    setupThemeDots();
    setupLanguageSelector();
});

function setupLanguageSelector() {
    const selector = document.getElementById("lang-selector");
    selector.value = currentLang;
    applyLanguage(currentLang);

    selector.addEventListener("change", (e) => {
        currentLang = e.target.value;
        localStorage.setItem("crm_lang", currentLang);
        applyLanguage(currentLang);
    });
}

function applyLanguage(lang) {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.ru;

    // Переводим элементы с атрибутом data-i18n
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (dict[key]) {
            el.textContent = dict[key];
        }
    });

    // Переводим placeholder
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (dict[key]) {
            el.placeholder = dict[key];
        }
    });
}

function setupThemeDots() {
    // Apply saved theme on load
    applyTheme(currentTheme);

    // Wire up each dot
    document.querySelectorAll(".theme-dot").forEach(dot => {
        dot.addEventListener("click", () => {
            const theme = dot.getAttribute("data-theme");
            currentTheme = theme;
            localStorage.setItem("crm_theme", theme);
            applyTheme(theme);
        });
    });
}

function applyTheme(theme) {
    // Remove all theme classes, apply new one
    document.body.className = theme;

    // Update active dot
    document.querySelectorAll(".theme-dot").forEach(dot => {
        dot.classList.toggle("active", dot.getAttribute("data-theme") === theme);
    });
}

function checkAuth() {
    const loginContainer = document.getElementById("login-container");
    const appContainer = document.getElementById("app-container");

    if (token) {
        loginContainer.classList.add("hidden");
        appContainer.classList.remove("hidden");

        document.getElementById("user-role-badge").textContent = currentUserRole;

        if (currentUserRole !== "CEO" && currentUserRole !== "admin") {
            document.querySelectorAll(".admin-only").forEach(el => el.classList.add("hidden"));
        } else {
            document.querySelectorAll(".admin-only").forEach(el => el.classList.remove("hidden"));
        }

        loadSectionData(currentSection);
    } else {
        loginContainer.classList.remove("hidden");
        appContainer.classList.add("hidden");
    }
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const usernameInput = document.getElementById("username").value;
    const passwordInput = document.getElementById("password").value;
    const errorText = document.getElementById("login-error");

    const formData = new FormData();
    formData.append("username", usernameInput);
    formData.append("password", passwordInput);

    try {
        const response = await fetch(`${API_URL}/token`, {
            method: "POST",
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            token = data.access_token;
            currentUserRole = data.role || "manager";
            localStorage.setItem("token", token);
            localStorage.setItem("user_role", currentUserRole);
            errorText.classList.add("hidden");
            checkAuth();
        } else {
            errorText.classList.remove("hidden");
        }
    } catch (err) {
        errorText.classList.remove("hidden");
    }
});

document.getElementById("btn-logout").addEventListener("click", () => {
    token = "";
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    checkAuth();
});

function setupRouting() {
    const menuItems = document.querySelectorAll(".menu-item");
    menuItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            menuItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");

            const target = item.getAttribute("data-target");
            switchSection(target);
        });
    });

    const catItems = document.querySelectorAll(".cat-item");
    catItems.forEach(item => {
        item.addEventListener("click", () => {
            catItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            const cat = item.getAttribute("data-cat");
            loadRealEstate(cat === "all" ? null : cat);
        });
    });
}

function switchSection(target) {
    currentSection = target;
    
    document.querySelectorAll(".tab-section").forEach(sec => {
        sec.classList.add("hidden");
    });

    const activeSec = document.getElementById(`sec-${target}`);
    if (activeSec) {
        activeSec.classList.remove("hidden");
    }

    loadSectionData(target);
}

function loadSectionData(section) {
    if (section === "dashboard") {
        loadDashboardStats();
    } else if (section === "leads") {
        loadLeadsList();
    } else if (section === "opportunities") {
        loadOpportunities();
    } else if (section === "contacts") {
        loadContacts();
    } else if (section === "developers") {
        loadDevelopers();
    } else if (section === "users") {
        loadUsers();
    } else if (section === "real-estate") {
        loadRealEstate();
        loadDevelopersDropdown();
    } else if (section === "emails") {
        loadEmails();
    } else if (section === "meetings") {
        loadMeetings();
    } else if (section === "calls") {
        loadCalls();
    } else if (section === "tasks") {
        loadTasks();
    } else if (section === "calendar") {
        loadCalendar();
    }
}

async function loadDevelopers() {
    try {
        const res = await fetch(`${API_URL}/api/developers`);
        const devs = await res.json();
        const tbody = document.querySelector("#table-developers tbody");
        tbody.innerHTML = "";

        devs.forEach(dev => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${dev.name}</strong></td>
                <td>${dev.phone || "-"}</td>
                <td>${dev.email || "-"}</td>
                <td><a href="${dev.website}" target="_blank" style="color: var(--gold);">${dev.website || "-"}</a></td>
                <td>${dev.description || "-"}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch(e) {}
}

async function loadDevelopersDropdown() {
    try {
        const res = await fetch(`${API_URL}/api/developers`);
        const devs = await res.json();
        const select = document.getElementById("est-developer");
        select.innerHTML = `<option value="">-- Выберите застройщика --</option>`;
        devs.forEach(d => {
            const opt = document.createElement("option");
            opt.value = d.id;
            opt.textContent = d.name;
            select.appendChild(opt);
        });
    } catch(e) {}
}

async function loadUsers() {
    try {
        const res = await fetch(`${API_URL}/api/users`);
        const users = await res.json();
        const tbody = document.querySelector("#table-users tbody");
        tbody.innerHTML = "";

        const rolesRu = {
            CEO: "CEO / Директор",
            manager: "Менеджер",
            marketing: "Маркетинг",
            legal: "Юрист"
        };

        users.forEach(usr => {
            const tr = document.createElement("tr");
            const date = new Date(usr.created_at).toLocaleDateString("ru-RU");

            tr.innerHTML = `
                <td><strong>${usr.username}</strong></td>
                <td><span class="role-badge">${rolesRu[usr.role] || usr.role}</span></td>
                <td>Full Access</td>
                <td>${date}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch(e) {}
}

async function loadEmails() {
    try {
        const res = await fetch(`${API_URL}/api/emails`);
        const emails = await res.json();
        const tbody = document.querySelector("#table-emails tbody");
        tbody.innerHTML = "";

        emails.forEach(email => {
            const tr = document.createElement("tr");
            const date = new Date(email.created_at).toLocaleString("ru-RU");
            tr.innerHTML = `
                <td><strong>${email.subject}</strong></td>
                <td>${email.from_address}</td>
                <td>${email.to_address}</td>
                <td>${email.body}</td>
                <td>${date}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch(e) {}
}

async function loadMeetings() {
    try {
        const res = await fetch(`${API_URL}/api/meetings`);
        const meetings = await res.json();
        const tbody = document.querySelector("#table-meetings tbody");
        tbody.innerHTML = "";

        meetings.forEach(meet => {
            const tr = document.createElement("tr");
            const date = new Date(meet.date_start).toLocaleString("ru-RU");
            const clientName = meet.contact ? `${meet.contact.first_name} ${meet.contact.last_name}` : "Не связан";

            tr.innerHTML = `
                <td><strong>${meet.name}</strong></td>
                <td>${date}</td>
                <td>${meet.duration} мин</td>
                <td>${clientName}</td>
                <td>${meet.description || "-"}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch(e) {}
}

async function loadCalls() {
    try {
        const res = await fetch(`${API_URL}/api/calls`);
        const calls = await res.json();
        const tbody = document.querySelector("#table-calls tbody");
        tbody.innerHTML = "";

        calls.forEach(call => {
            const tr = document.createElement("tr");
            const date = new Date(call.date_start).toLocaleString("ru-RU");
            const clientName = call.contact ? `${call.contact.first_name} ${call.contact.last_name}` : "Не связан";

            tr.innerHTML = `
                <td><strong>${call.name}</strong></td>
                <td>${date}</td>
                <td>${call.duration} мин</td>
                <td>${clientName}</td>
                <td>${call.description || "-"}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch(e) {}
}

async function loadTasks() {
    try {
        const res = await fetch(`${API_URL}/api/tasks`);
        const tasks = await res.json();
        const tbody = document.querySelector("#table-tasks tbody");
        tbody.innerHTML = "";

        tasks.forEach(task => {
            const tr = document.createElement("tr");
            const date = new Date(task.due_date).toLocaleDateString("ru-RU");
            tr.innerHTML = `
                <td><strong>${task.name}</strong></td>
                <td>${date}</td>
                <td>${task.description || "-"}</td>
                <td>
                    <select class="status-select" onchange="updateTaskStatus(${task.id}, this.value)">
                        <option value="Not Started" ${task.status === "Not Started" ? "selected" : ""}>Not Started</option>
                        <option value="In Progress" ${task.status === "In Progress" ? "selected" : ""}>In Progress</option>
                        <option value="Completed" ${task.status === "Completed" ? "selected" : ""}>Completed</option>
                    </select>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch(e) {}
}

async function updateTaskStatus(id, status) {
    await fetch(`${API_URL}/api/tasks/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
    });
}

async function loadCalendar() {
    try {
        const [meetingsRes, callsRes, tasksRes] = await Promise.all([
            fetch(`${API_URL}/api/meetings`),
            fetch(`${API_URL}/api/calls`),
            fetch(`${API_URL}/api/tasks`)
        ]);

        const meetings = await meetingsRes.json();
        const calls    = await callsRes.json();
        const tasks    = await tasksRes.json();

        calendarEvents = [];
        meetings.forEach(m => {
            if (m.date_start) calendarEvents.push({ date: m.date_start.split("T")[0], title: m.name || m.title, type: "meeting" });
        });
        calls.forEach(c => {
            if (c.date_start) calendarEvents.push({ date: c.date_start.split("T")[0], title: c.name || c.title, type: "call" });
        });
        tasks.forEach(t => {
            if (t.due_date) calendarEvents.push({ date: t.due_date, title: t.name || t.title, type: "task" });
        });

        renderCalendarGrid();
    } catch(e) {}
}

// Текущий отображаемый месяц/год (глобальные для навигации)
let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth(); // 0-indexed

function renderCalendarGrid() {
    const container = document.getElementById("calendar-days-container");
    container.innerHTML = "";

    const today     = new Date();
    const todayStr  = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

    // Обновляем заголовок месяца
    const monthNames = ["Январь","Февраль","Март","Апрель","Май","Июнь",
                        "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
    const label = document.getElementById("calendar-month-name");
    if (label) label.textContent = `${monthNames[calMonth]} ${calYear}`;

    const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
    const offset        = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth   = new Date(calYear, calMonth + 1, 0).getDate();

    // Пустые ячейки до начала месяца
    for (let i = 0; i < offset; i++) {
        const cell = document.createElement("div");
        cell.className = "calendar-day-cell empty";
        container.appendChild(cell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
        const cell    = document.createElement("div");
        cell.className = "calendar-day-cell";

        // Подсветка сегодняшнего дня
        if (dateStr === todayStr) {
            cell.classList.add("today");
        }

        cell.innerHTML = `<div class="calendar-day-num">${day}</div>`;

        // Клик по ячейке — открыть форму с предзаполненной датой
        cell.addEventListener("click", () => openEventModalWithDate(dateStr));

        // Подставляем события этого дня
        const dayEvents = calendarEvents.filter(ev => ev.date === dateStr);
        dayEvents.forEach(ev => {
            const evDiv = document.createElement("div");
            evDiv.className = `calendar-event ${ev.type}`;
            evDiv.textContent = ev.title;
            evDiv.title = ev.title;
            // Клик по событию не пробрасывает на ячейку
            evDiv.addEventListener("click", e => e.stopPropagation());
            cell.appendChild(evDiv);
        });

        container.appendChild(cell);
    }
}

function openEventModalWithDate(dateStr) {
    // Предзаполняем поля даты и открываем модалку
    const dtLocal  = dateStr + "T09:00"; // по умолчанию 9:00
    const datetimeInput = document.getElementById("event-datetime");
    const duedateInput  = document.getElementById("event-duedate");
    if (datetimeInput) datetimeInput.value = dtLocal;
    if (duedateInput)  duedateInput.value  = dateStr;
    openModal("event");
}

// Навигация по месяцам
function calPrevMonth() {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    loadCalendar();
}
function calNextMonth() {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    loadCalendar();
}

async function loadDashboardStats() {
    try {
        const [leadsRes, oppsRes, estateRes] = await Promise.all([
            fetch(`${API_URL}/api/leads`),
            fetch(`${API_URL}/api/opportunities`),
            fetch(`${API_URL}/api/real-estate`)
        ]);

        const leads = await leadsRes.json();
        const opps = await oppsRes.json();
        const estate = await estateRes.json();

        document.getElementById("count-leads").textContent = leads.length;
        document.getElementById("count-opps").textContent = opps.length;
        document.getElementById("count-estate").textContent = estate.length;

        const tbody = document.querySelector("#table-recent-leads tbody");
        tbody.innerHTML = "";
        leads.slice(0, 5).forEach(lead => {
            const tr = document.createElement("tr");
            const date = new Date(lead.created_at).toLocaleDateString("ru-RU");
            let quizHTML = "";
            try {
                const quiz = JSON.parse(lead.quiz_results);
                quizHTML = Object.entries(quiz).map(([q, a]) => `<strong>${q}:</strong> ${a}`).join("<br>");
            } catch(e) {
                quizHTML = lead.quiz_results;
            }

            tr.innerHTML = `
                <td>${lead.name}</td>
                <td>${lead.phone}</td>
                <td>${quizHTML}</td>
                <td>${date}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {}
}

async function loadLeadsList() {
    try {
        const response = await fetch(`${API_URL}/api/leads`);
        const leads = await response.json();
        const tbody = document.querySelector("#table-all-leads tbody");
        tbody.innerHTML = "";

        leads.forEach(lead => {
            const tr = document.createElement("tr");
            const date = new Date(lead.created_at).toLocaleDateString("ru-RU");

            // Парсим quiz_results: если там JSON — показываем ответы, если строка — как заметку
            let notesHTML = "";
            let sourceHTML = "";
            try {
                const quiz = JSON.parse(lead.quiz_results);
                // Если есть специальное поле source — вытаскиваем
                if (quiz.__source) {
                    sourceHTML = quiz.__source;
                    const { __source, ...rest } = quiz;
                    notesHTML = Object.entries(rest).map(([q, a]) => `<strong>${q}:</strong> ${a}`).join("<br>");
                } else {
                    sourceHTML = "<span style='color:var(--text-muted)'>—</span>";
                    notesHTML = Object.entries(quiz).map(([q, a]) => `<strong>${q}:</strong> ${a}`).join("<br>");
                }
            } catch(e) {
                notesHTML = lead.quiz_results || "—";
                sourceHTML = "<span style='color:var(--text-muted)'>—</span>";
            }

            tr.innerHTML = `
                <td><strong>${lead.name}</strong></td>
                <td>${lead.phone}</td>
                <td>${sourceHTML}</td>
                <td style="max-width:220px;">${notesHTML}</td>
                <td>
                    <select class="status-select" onchange="updateLeadStatus(${lead.id}, this.value)">
                        <option value="New" ${lead.status === "New" ? "selected" : ""}>Новый</option>
                        <option value="In Progress" ${lead.status === "In Progress" ? "selected" : ""}>В работе</option>
                        <option value="Closed" ${lead.status === "Closed" ? "selected" : ""}>Закрыт</option>
                    </select>
                </td>
                <td>${date}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch(err) {}
}

async function updateLeadStatus(id, newStatus) {
    await fetch(`${API_URL}/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
    });
}

async function loadOpportunities() {
    try {
        const response = await fetch(`${API_URL}/api/opportunities`);
        const opps = await response.json();
        const tbody = document.querySelector("#table-opps tbody");
        tbody.innerHTML = "";

        opps.forEach(opp => {
            const tr = document.createElement("tr");
            const date = new Date(opp.created_at).toLocaleDateString("ru-RU");
            const contactName = opp.contact ? `${opp.contact.first_name} ${opp.contact.last_name}` : "Unassigned";

            tr.innerHTML = `
                <td><strong>${opp.name}</strong></td>
                <td>${opp.stage}</td>
                <td>${opp.amount.toLocaleString()} EUR</td>
                <td>${contactName}</td>
                <td>${date}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {}
}

async function loadContacts() {
    try {
        const response = await fetch(`${API_URL}/api/contacts`);
        const contacts = await response.json();
        const tbody = document.querySelector("#table-contacts tbody");
        tbody.innerHTML = "";

        const oppContactSelect = document.getElementById("opp-contact");
        const meetContactSelect = document.getElementById("meet-contact");
        const callContactSelect = document.getElementById("call-contact");

        oppContactSelect.innerHTML = `<option value="">-- Select Contact --</option>`;
        meetContactSelect.innerHTML = `<option value="">-- Select Contact --</option>`;
        callContactSelect.innerHTML = `<option value="">-- Select Contact --</option>`;

        contacts.forEach(contact => {
            const tr = document.createElement("tr");
            const date = new Date(contact.created_at).toLocaleDateString("ru-RU");

            tr.innerHTML = `
                <td><strong>${contact.first_name} ${contact.last_name}</strong></td>
                <td>${contact.phone}</td>
                <td>${contact.email || "-"}</td>
                <td>${contact.description || "-"}</td>
                <td>${date}</td>
            `;
            tbody.appendChild(tr);

            const opt = document.createElement("option");
            opt.value = contact.id;
            opt.textContent = `${contact.first_name} ${contact.last_name}`;
            
            oppContactSelect.appendChild(opt.cloneNode(true));
            meetContactSelect.appendChild(opt.cloneNode(true));
            callContactSelect.appendChild(opt.cloneNode(true));
        });
    } catch(err) {}
}

async function loadRealEstate(category = null) {
    try {
        let url = `${API_URL}/api/real-estate`;
        if (category) {
            url += `?category=${category}`;
        }
        const response = await fetch(url);
        const estateList = await response.json();

        const grid = document.getElementById("estate-cards-container");
        grid.innerHTML = "";

        estateList.forEach(item => {
            const card = document.createElement("div");
            card.className = "estate-card";

            const images = item.gallery_data ? item.gallery_data.split(",") : [];
            let imgHTML = `<div class="no-image"><i class="fas fa-image"></i> No photo</div>`;
            if (images.length > 0) {
                imgHTML = `<img src="${images[0]}" alt="Property Image" onclick="openGalleryModal(${JSON.stringify(images)})">`;
            }

            card.innerHTML = `
                <div class="estate-img-wrapper">
                    ${imgHTML}
                    <span class="estate-category-badge">${item.category}</span>
                </div>
                <div class="estate-info">
                    <div class="estate-price">${item.price.toLocaleString()} ${item.currency}</div>
                    <div class="estate-title">${item.name}</div>
                    <p class="estate-desc">${item.description || "No description."}</p>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch(err) {}
}

function setupForms() {
    const fileInput = document.getElementById("est-images");
    fileInput.addEventListener("change", async () => {
        const preview = document.getElementById("upload-preview");
        const files = fileInput.files;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append("file", file);

            try {
                const res = await fetch(`${API_URL}/api/upload`, {
                    method: "POST",
                    body: formData
                });
                if (res.ok) {
                    const data = await res.json();
                    uploadedImages.push(data.url);

                    const div = document.createElement("div");
                    div.className = "preview-img";
                    div.innerHTML = `<img src="${data.url}">`;
                    preview.appendChild(div);
                }
            } catch(e) {}
        }
    });

    // Форма ручного добавления лида
    document.getElementById("form-lead").addEventListener("submit", async (e) => {
        e.preventDefault();
        const source = document.getElementById("lead-source").value;
        const notes  = document.getElementById("lead-notes").value;

        // Источник и заметки упаковываем в quiz_results как JSON
        const quizData = { __source: source };
        if (notes) quizData["Заметки"] = notes;

        const payload = {
            name:         document.getElementById("lead-name").value,
            phone:        document.getElementById("lead-phone").value,
            status:       document.getElementById("lead-status").value,
            quiz_results: JSON.stringify(quizData)
        };

        const res = await fetch(`${API_URL}/api/leads`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            closeModal("lead");
            loadLeadsList();
            showToast("Лид успешно добавлен ✓");
        } else {
            showToast("Ошибка при сохранении", "error");
        }
    });

    // Быстрое создание события из календаря
    const eventTypeSelect = document.getElementById("event-type");
    if (eventTypeSelect) {
        eventTypeSelect.addEventListener("change", () => {
            const type = eventTypeSelect.value;
            document.getElementById("event-datetime-group").style.display  = type !== "task" ? "" : "none";
            document.getElementById("event-duedate-group").style.display   = type === "task" ? "" : "none";
            document.getElementById("event-duration-group").style.display  = type !== "task" ? "" : "none";
        });
    }

    document.getElementById("form-event").addEventListener("submit", async (e) => {
        e.preventDefault();
        const type     = document.getElementById("event-type").value;
        const title    = document.getElementById("event-name").value;
        const contact  = document.getElementById("event-contact").value || null;
        const desc     = document.getElementById("event-desc").value;

        let endpoint, payload;

        if (type === "meeting") {
            const dt  = document.getElementById("event-datetime").value;
            const dur = document.getElementById("event-duration").value;
            endpoint = "/api/meetings";
            payload  = { title, meeting_datetime: dt, duration_min: parseInt(dur) || 60, contact_id: contact, notes: desc };
        } else if (type === "call") {
            const dt  = document.getElementById("event-datetime").value;
            const dur = document.getElementById("event-duration").value;
            endpoint = "/api/calls";
            payload  = { title, call_datetime: dt, duration_min: parseInt(dur) || 30, contact_id: contact, notes: desc };
        } else {
            const due = document.getElementById("event-duedate").value;
            endpoint = "/api/tasks";
            payload  = { title, due_date: due, contact_id: contact, description: desc };
        }

        const res = await fetch(`${API_URL}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            closeModal("event");
            loadCalendar();
            showToast("Событие добавлено в календарь ✓");
        } else {
            showToast("Ошибка при сохранении", "error");
        }
    });

    document.getElementById("form-estate").addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById("est-name").value,
            category: document.getElementById("est-category").value,
            price: document.getElementById("est-price").value,
            developer_id: document.getElementById("est-developer").value || null,
            tags: document.getElementById("est-tags").value,
            description: document.getElementById("est-desc").value,
            gallery_data: uploadedImages.join(",")
        };

        const res = await fetch(`${API_URL}/api/real-estate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            closeModal("estate");
            loadRealEstate();
        }
    });

    document.getElementById("form-contact").addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            first_name: document.getElementById("con-first-name").value,
            last_name: document.getElementById("con-last-name").value,
            phone: document.getElementById("con-phone").value,
            email: document.getElementById("con-email").value,
            description: document.getElementById("con-desc").value
        };

        const res = await fetch(`${API_URL}/api/contacts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            closeModal("contact");
            loadContacts();
        }
    });

    document.getElementById("form-opp").addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById("opp-name").value,
            stage: document.getElementById("opp-stage").value,
            amount: document.getElementById("opp-amount").value,
            contact_id: document.getElementById("opp-contact").value || null,
            description: document.getElementById("opp-desc").value
        };

        const res = await fetch(`${API_URL}/api/opportunities`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            closeModal("opp");
            loadOpportunities();
        }
    });

    document.getElementById("form-email").addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            to_address: document.getElementById("em-to").value,
            subject: document.getElementById("em-subject").value,
            body: document.getElementById("em-body").value,
            from_address: "admin@ncg-consulting.com"
        };
        const res = await fetch(`${API_URL}/api/emails`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            closeModal("email");
            loadEmails();
        }
    });

    document.getElementById("form-meeting").addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById("meet-name").value,
            date_start: document.getElementById("meet-start").value,
            duration: document.getElementById("meet-duration").value,
            contact_id: document.getElementById("meet-contact").value || null,
            description: document.getElementById("meet-desc").value
        };
        const res = await fetch(`${API_URL}/api/meetings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            closeModal("meeting");
            loadMeetings();
        }
    });

    document.getElementById("form-call").addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById("call-name").value,
            date_start: document.getElementById("call-start").value,
            duration: document.getElementById("call-duration").value,
            contact_id: document.getElementById("call-contact").value || null,
            description: document.getElementById("call-desc").value
        };
        const res = await fetch(`${API_URL}/api/calls`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            closeModal("call");
            loadCalls();
        }
    });

    document.getElementById("form-task").addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById("task-name").value,
            due_date: document.getElementById("task-due").value,
            description: document.getElementById("task-desc").value
        };
        const res = await fetch(`${API_URL}/api/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            closeModal("task");
            loadTasks();
        }
    });

    document.getElementById("form-developer").addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById("dev-name").value,
            phone: document.getElementById("dev-phone").value,
            email: document.getElementById("dev-email").value,
            website: document.getElementById("dev-web").value,
            description: document.getElementById("dev-desc").value
        };
        const res = await fetch(`${API_URL}/api/developers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            closeModal("developer");
            loadDevelopers();
        }
    });

    document.getElementById("form-user").addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            username: document.getElementById("usr-name").value,
            password: document.getElementById("usr-pass").value,
            role: document.getElementById("usr-role").value
        };
        const res = await fetch(`${API_URL}/api/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            closeModal("user");
            loadUsers();
        }
    });
}

window.openModal = function(name) {
    document.getElementById(`modal-${name}`).classList.remove("hidden");
    uploadedImages = [];
    const preview = document.getElementById("upload-preview");
    if (preview) preview.innerHTML = "";
};

window.closeModal = function(name) {
    document.getElementById(`modal-${name}`).classList.add("hidden");
    const form = document.getElementById(`form-${name}`);
    if (form) form.reset();
};

window.openGalleryModal = function(images) {
    galleryImagesList = images;
    galleryActiveIndex = 0;
    document.getElementById("modal-gallery").classList.remove("hidden");
    updateSliderImage();
};

window.closeGalleryModal = function() {
    document.getElementById("modal-gallery").classList.add("hidden");
};

window.nextSlide = function() {
    galleryActiveIndex = (galleryActiveIndex + 1) % galleryImagesList.length;
    updateSliderImage();
};

window.prevSlide = function() {
    galleryActiveIndex = (galleryActiveIndex - 1 + galleryImagesList.length) % galleryImagesList.length;
    updateSliderImage();
};

function updateSliderImage() {
    const img = document.getElementById("gallery-active-img");
    img.src = galleryImagesList[galleryActiveIndex];
}
