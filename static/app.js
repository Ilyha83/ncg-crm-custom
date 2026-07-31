const API_URL = "";

let token = localStorage.getItem("token") || "";
let currentSection = "dashboard";
let uploadedImages = [];

// Слайдер галереи
let galleryImagesList = [];
let galleryActiveIndex = 0;

// Хранилище событий календаря
let calendarEvents = [];

document.addEventListener("DOMContentLoaded", () => {
    checkAuth();
    setupRouting();
    setupForms();
    setupThemeToggle();
});

// --- ТЕМА ОФОРМЛЕНИЯ (СВЕТЛАЯ / ТЕМНАЯ) ---
function setupThemeToggle() {
    const btn = document.getElementById("btn-theme-toggle");
    const body = document.body;

    // Считываем сохраненную тему
    const savedTheme = localStorage.getItem("theme") || "theme-dark";
    body.className = savedTheme;
    updateThemeIcon(savedTheme);

    btn.addEventListener("click", () => {
        if (body.classList.contains("theme-dark")) {
            body.className = "theme-light";
            localStorage.setItem("theme", "theme-light");
            updateThemeIcon("theme-light");
        } else {
            body.className = "theme-dark";
            localStorage.setItem("theme", "theme-dark");
            updateThemeIcon("theme-dark");
        }
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector("#btn-theme-toggle i");
    if (theme === "theme-light") {
        icon.className = "fas fa-moon";
    } else {
        icon.className = "fas fa-sun";
    }
}

// --- АВТОРИЗАЦИЯ ---
function checkAuth() {
    const loginContainer = document.getElementById("login-container");
    const appContainer = document.getElementById("app-container");

    if (token) {
        loginContainer.classList.add("hidden");
        appContainer.classList.remove("hidden");
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
            localStorage.setItem("token", token);
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
    checkAuth();
});

// --- НАВИГАЦИЯ И РОУТИНГ ---
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

    const titles = {
        dashboard: "Панель управления",
        leads: "Входящие WhatsApp лиды",
        opportunities: "Сделки",
        contacts: "Контакты",
        "real-estate": "База объектов недвижимости",
        emails: "Электронная почта",
        meetings: "Запланированные встречи",
        calls: "Запланированные звонки",
        tasks: "Задачи менеджеров",
        calendar: "Интерактивный календарь"
    };
    document.getElementById("page-title").textContent = titles[target] || "Панель управления";

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
    } else if (section === "real-estate") {
        loadRealEstate();
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

// --- API ИНТЕГРАЦИЯ ДЛЯ НОВЫХ РАЗДЕЛОВ ---

// 1. Emails
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
    } catch(e) {
        console.error("Emails load error:", e);
    }
}

// 2. Meetings
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
    } catch(e) {
        console.error("Meetings error:", e);
    }
}

// 3. Calls
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
    } catch(e) {
        console.error("Calls error:", e);
    }
}

// 4. Tasks
async function loadTasks() {
    try {
        const res = await fetch(`${API_URL}/api/tasks`);
        const tasks = await res.json();
        const tbody = document.querySelector("#table-tasks tbody");
        tbody.innerHTML = "";

        const statusRu = {
            "Not Started": "Не начата",
            "In Progress": "В работе",
            "Completed": "Выполнена"
        };

        tasks.forEach(task => {
            const tr = document.createElement("tr");
            const date = new Date(task.due_date).toLocaleDateString("ru-RU");
            const statusClass = task.status === "Completed" ? "closed" : task.status === "In Progress" ? "progress" : "new";

            tr.innerHTML = `
                <td><strong>${task.name}</strong></td>
                <td>${date}</td>
                <td>${task.description || "-"}</td>
                <td>
                    <select class="status-select" onchange="updateTaskStatus(${task.id}, this.value)">
                        <option value="Not Started" ${task.status === "Not Started" ? "selected" : ""}>Не начата</option>
                        <option value="In Progress" ${task.status === "In Progress" ? "selected" : ""}>В работе</option>
                        <option value="Completed" ${task.status === "Completed" ? "selected" : ""}>Выполнена</option>
                    </select>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch(e) {
        console.error("Tasks error:", e);
    }
}

async function updateTaskStatus(id, status) {
    // Временное обновление статуса на бэкенде
    await fetch(`${API_URL}/api/tasks/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
    });
}

// 5. Календарь
async function loadCalendar() {
    try {
        const [meetingsRes, callsRes, tasksRes] = await Promise.all([
            fetch(`${API_URL}/api/meetings`),
            fetch(`${API_URL}/api/calls`),
            fetch(`${API_URL}/api/tasks`)
        ]);

        const meetings = await meetingsRes.json();
        const calls = await callsRes.json();
        const tasks = await tasksRes.json();

        // Сливаем все события в один массив
        calendarEvents = [];
        meetings.forEach(m => {
            calendarEvents.push({ date: m.date_start.split("T")[0], title: `Встреча: ${m.name}`, type: "meeting" });
        });
        calls.forEach(c => {
            calendarEvents.push({ date: c.date_start.split("T")[0], title: `Звонок: ${c.name}`, type: "call" });
        });
        tasks.forEach(t => {
            calendarEvents.push({ date: t.due_date, title: `Задача: ${t.name}`, type: "task" });
        });

        renderCalendarGrid();
    } catch(e) {
        console.error("Calendar error:", e);
    }
}

function renderCalendarGrid() {
    const container = document.getElementById("calendar-days-container");
    container.innerHTML = "";

    // По умолчанию строим сетку на текущий месяц (июль 2026 года)
    const year = 2026;
    const month = 6; // Июль (0-индексированный)
    
    // Определяем день недели первого дня месяца
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = вс, 1 = пн
    const offset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Сдвиг для Пн-Вс

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Заполняем пустые клетки перед началом месяца
    for (let i = 0; i < offset; i++) {
        const cell = document.createElement("div");
        cell.className = "calendar-day-cell empty";
        container.appendChild(cell);
    }

    // Заполняем дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement("div");
        cell.className = "calendar-day-cell";
        
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        cell.innerHTML = `<div class="calendar-day-num">${day}</div>`;

        // Фильтруем события на этот день
        const dayEvents = calendarEvents.filter(e => e.date === dateStr);
        dayEvents.forEach(e => {
            const evDiv = document.createElement("div");
            evDiv.className = `calendar-event ${e.type}`;
            evDiv.textContent = e.title;
            cell.appendChild(evDiv);
        });

        container.appendChild(cell);
    }
}

// --- ОСТАЛЬНЫЕ ШТАТНЫЕ РАЗДЕЛЫ CRM (БЕЗ ИЗМЕНЕНИЙ) ---
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

    } catch (err) {
        console.error("Dashboard error:", err);
    }
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
    } catch(err) {
        console.error("Leads error:", err);
    }
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

        const stagesRu = {
            Prospecting: "Квалификация",
            Proposal: "Предложение",
            Negotiation: "Переговоры",
            "Closed Won": "Успешно закрыто",
            "Closed Lost": "Закрыто / Упущено"
        };

        opps.forEach(opp => {
            const tr = document.createElement("tr");
            const date = new Date(opp.created_at).toLocaleDateString("ru-RU");
            const contactName = opp.contact ? `${opp.contact.first_name} ${opp.contact.last_name}` : "Не связан";

            tr.innerHTML = `
                <td><strong>${opp.name}</strong></td>
                <td>${stagesRu[opp.stage] || opp.stage}</td>
                <td>${opp.amount.toLocaleString()} EUR</td>
                <td>${contactName}</td>
                <td>${date}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Opportunities load error:", err);
    }
}

async function loadContacts() {
    try {
        const response = await fetch(`${API_URL}/api/contacts`);
        const contacts = await response.json();
        const tbody = document.querySelector("#table-contacts tbody");
        tbody.innerHTML = "";

        // Заполняем селекторы модалок звонков и встреч
        const oppContactSelect = document.getElementById("opp-contact");
        const meetContactSelect = document.getElementById("meet-contact");
        const callContactSelect = document.getElementById("call-contact");

        oppContactSelect.innerHTML = `<option value="">-- Выберите контакт --</option>`;
        meetContactSelect.innerHTML = `<option value="">-- Выберите контакт --</option>`;
        callContactSelect.innerHTML = `<option value="">-- Выберите контакт --</option>`;

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

            // Опции в селекты
            const opt = document.createElement("option");
            opt.value = contact.id;
            opt.textContent = `${contact.first_name} ${contact.last_name}`;
            
            oppContactSelect.appendChild(opt.cloneNode(true));
            meetContactSelect.appendChild(opt.cloneNode(true));
            callContactSelect.appendChild(opt.cloneNode(true));
        });
    } catch(err) {
        console.error("Contacts error:", err);
    }
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

        const categoryRu = {
            studio: "Студия",
            "1_1": "1+1",
            "2_1": "2+1",
            "3_1": "3+1",
            "4_1": "4+1",
            townhouse: "Таунхаус",
            villa: "Вилла"
        };

        estateList.forEach(item => {
            const card = document.createElement("div");
            card.className = "estate-card";

            const images = item.gallery_data ? item.gallery_data.split(",") : [];
            let imgHTML = `<div class="no-image"><i class="fas fa-image"></i> Нет фото</div>`;
            if (images.length > 0) {
                imgHTML = `<img src="${images[0]}" alt="Property Image" onclick="openGalleryModal(${JSON.stringify(images)})">`;
            }

            card.innerHTML = `
                <div class="estate-img-wrapper">
                    ${imgHTML}
                    <span class="estate-category-badge">${categoryRu[item.category] || item.category}</span>
                </div>
                <div class="estate-info">
                    <div class="estate-price">${item.price.toLocaleString()} ${item.currency}</div>
                    <div class="estate-title">${item.name}</div>
                    <p class="estate-desc">${item.description || "Без описания."}</p>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch(err) {
        console.error("Real estate error:", err);
    }
}

// --- НАСТРОЙКА ФОРМ СОЗДАНИЯ ---

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
            } catch(e) {
                console.error("Upload error:", e);
            }
        }
    });

    document.getElementById("form-estate").addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById("est-name").value,
            category: document.getElementById("est-category").value,
            price: document.getElementById("est-price").value,
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

    // --- ОТПРАВКА ДЛЯ НОВЫХ ФОРМ ДЕЯТЕЛЬНОСТИ ---

    // Email
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

    // Meeting
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

    // Call
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

    // Task
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
