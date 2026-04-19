const API_BASE = "/api/employees";

const tableBody = document.getElementById("employee-table-body");
const statusEl = document.getElementById("status");
const searchInput = document.getElementById("search-input");
const employeeCount = document.getElementById("employee-count");
const rowTemplate = document.getElementById("employee-row-template");
const addEmployeeBtn = document.getElementById("add-employee-btn");
const modal = document.getElementById("employee-modal");
const employeeForm = document.getElementById("employee-form");
const cancelModalBtn = document.getElementById("cancel-modal");

const tabDashboard = document.getElementById("tab-dashboard");
const tabDetails = document.getElementById("tab-details");
const panelDashboard = document.getElementById("panel-dashboard");
const panelDetails = document.getElementById("panel-details");
const detailsForm = document.getElementById("details-form");
const backToDashboardBtn = document.getElementById("back-to-dashboard");
const detailEmployeeName = document.getElementById("detail-employee-name");
const detailEmployeeSubtitle = document.getElementById("detail-employee-subtitle");
const paginationControls = document.getElementById("pagination-controls");

let employees = [];
let filterText = "";
let selectedEmployeeId = null;
let currentPage = 1;
const pageSize = 20;
let detailsTabUnlocked = false;

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function sanitizeEmployee(payload) {
  return {
    name: (payload.name || "").trim(),
    phone: (payload.phone || "").trim(),
    email: (payload.email || "").trim(),
    office: (payload.office || "").trim(),
    position: (payload.position || "").trim()
  };
}

function sanitizeDetails(payload) {
  return {
    job_site_location: (payload.job_site_location || "").trim(),
    role: (payload.role || "").trim(),
    social_security_number: (payload.social_security_number || "").trim(),
    employee_start_date: (payload.employee_start_date || "").trim(),
    beneficiary: (payload.beneficiary || "").trim(),
    salary: Number(payload.salary)
  };
}

function isValidEmployee(payload) {
  return [payload.name, payload.phone, payload.email, payload.office, payload.position].every(Boolean);
}

function isValidDetails(payload) {
  const stringFieldsFilled = [
    payload.job_site_location,
    payload.role,
    payload.social_security_number,
    payload.employee_start_date,
    payload.beneficiary
  ].every(Boolean);

  return stringFieldsFilled && Number.isFinite(payload.salary) && payload.salary >= 0;
}

function setActiveTab(tabName) {
  if (tabName === "details" && !detailsTabUnlocked) {
    setStatus("Click More Details on an employee to unlock the details tab.", true);
    return;
  }

  const showDashboard = tabName === "dashboard";

  tabDashboard.classList.toggle("active", showDashboard);
  tabDashboard.setAttribute("aria-selected", String(showDashboard));
  tabDetails.classList.toggle("active", !showDashboard);
  tabDetails.setAttribute("aria-selected", String(!showDashboard));

  panelDashboard.classList.toggle("hidden", !showDashboard);
  panelDetails.classList.toggle("hidden", showDashboard);
}

function setDetailsTabVisibility(visible) {
  detailsTabUnlocked = visible;
  tabDetails.classList.toggle("hidden", !visible);
  tabDetails.setAttribute("aria-hidden", String(!visible));
}

function updateCount() {
  const visible = employees.filter(matchesFilter).length;
  employeeCount.textContent = `${visible} Employee${visible === 1 ? "" : "s"}`;
}

function goToPage(pageNumber) {
  const filteredCount = employees.filter(matchesFilter).length;
  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));
  currentPage = Math.min(Math.max(1, pageNumber), totalPages);
  renderTable();
}

function renderPagination(totalItems) {
  paginationControls.innerHTML = "";
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "btn ghost small";
  prevBtn.textContent = "Previous";
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener("click", () => goToPage(currentPage - 1));
  paginationControls.appendChild(prevBtn);

  const maxPageButtons = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
  const endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
  const adjustedStart = Math.max(1, endPage - maxPageButtons + 1);

  for (let page = adjustedStart; page <= endPage; page += 1) {
    const pageBtn = document.createElement("button");
    pageBtn.type = "button";
    pageBtn.className = `btn small page-btn ${page === currentPage ? "active" : "ghost"}`;
    pageBtn.textContent = String(page);
    pageBtn.disabled = page === currentPage;
    pageBtn.addEventListener("click", () => goToPage(page));
    paginationControls.appendChild(pageBtn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "btn ghost small";
  nextBtn.textContent = "Next";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener("click", () => goToPage(currentPage + 1));
  paginationControls.appendChild(nextBtn);

  const summary = document.createElement("span");
  summary.className = "pagination-summary";
  summary.textContent = `Page ${currentPage} of ${totalPages}`;
  paginationControls.appendChild(summary);
}

function createCellInput(value) {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "cell-input";
  input.value = value;
  return input;
}

function toggleRowEdit(row, editing) {
  row.dataset.editing = String(editing);
  row.querySelector(".details").classList.toggle("hidden", editing);
  row.querySelector(".edit").classList.toggle("hidden", editing);
  row.querySelector(".delete").classList.toggle("hidden", editing);
  row.querySelector(".save").classList.toggle("hidden", !editing);
  row.querySelector(".cancel").classList.toggle("hidden", !editing);
}

function matchesFilter(employee) {
  if (!filterText) return true;
  const combined = `${employee.name} ${employee.phone} ${employee.email} ${employee.office} ${employee.position}`.toLowerCase();
  return combined.includes(filterText);
}

async function fetchEmployees() {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error("Could not load employee records.");
  }
  employees = await response.json();
}

function findEmployee(employeeId) {
  return employees.find((employee) => employee.id === employeeId) || null;
}

function fillDetailsPanel(employee) {
  if (!employee) {
    detailEmployeeName.textContent = "Select an employee";
    detailEmployeeSubtitle.textContent = "Click More Details on the dashboard tab to view an employee profile.";
    detailsForm.reset();
    return;
  }

  detailEmployeeName.textContent = employee.name;
  detailEmployeeSubtitle.textContent = `${employee.position} • ${employee.office}`;

  detailsForm.elements.job_site_location.value = employee.job_site_location || "";
  detailsForm.elements.role.value = employee.role || "";
  detailsForm.elements.social_security_number.value = employee.social_security_number || "";
  detailsForm.elements.employee_start_date.value = employee.employee_start_date || "";
  detailsForm.elements.beneficiary.value = employee.beneficiary || "";
  detailsForm.elements.salary.value = Number(employee.salary || 0).toString();
}

function openDetailsTab(employeeId) {
  if (!detailsTabUnlocked) {
    setStatus("Click More Details on an employee first to open details.", true);
    return;
  }

  selectedEmployeeId = employeeId;
  const employee = findEmployee(employeeId);
  fillDetailsPanel(employee);
  setActiveTab("details");
}

function unlockDetailsForEmployee(employee) {
  selectedEmployeeId = employee.id;
  fillDetailsPanel(employee);
  setDetailsTabVisibility(true);
}

function relockDetailsTab() {
  selectedEmployeeId = null;
  fillDetailsPanel(null);
  setDetailsTabVisibility(false);
  setActiveTab("dashboard");
}

function renderTable() {
  tableBody.innerHTML = "";

  const filtered = employees.filter(matchesFilter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const start = (currentPage - 1) * pageSize;
  const pagedEmployees = filtered.slice(start, start + pageSize);

  for (const employee of pagedEmployees) {
    const fragment = rowTemplate.content.cloneNode(true);
    const row = fragment.querySelector("tr");

    for (const field of ["name", "phone", "email", "office", "position"]) {
      row.querySelector(`[data-field="${field}"]`).textContent = employee[field];
    }

    row.querySelector(".details").addEventListener("click", () => {
      unlockDetailsForEmployee(employee);
      openDetailsTab(employee.id);
    });

    row.querySelector(".edit").addEventListener("click", () => {
      const original = { ...employee };
      row.dataset.original = JSON.stringify(original);

      ["name", "phone", "email", "office", "position"].forEach((field) => {
        const cell = row.querySelector(`[data-field="${field}"]`);
        const input = createCellInput(employee[field]);
        cell.textContent = "";
        cell.appendChild(input);
      });

      toggleRowEdit(row, true);
    });

    row.querySelector(".cancel").addEventListener("click", () => {
      const original = JSON.parse(row.dataset.original || "{}");
      ["name", "phone", "email", "office", "position"].forEach((field) => {
        row.querySelector(`[data-field="${field}"]`).textContent = original[field] || "";
      });
      toggleRowEdit(row, false);
    });

    row.querySelector(".save").addEventListener("click", async () => {
      const payload = sanitizeEmployee({
        name: row.querySelector('[data-field="name"] input')?.value,
        phone: row.querySelector('[data-field="phone"] input')?.value,
        email: row.querySelector('[data-field="email"] input')?.value,
        office: row.querySelector('[data-field="office"] input')?.value,
        position: row.querySelector('[data-field="position"] input')?.value
      });

      if (!isValidEmployee(payload)) {
        setStatus("All fields are required before saving.", true);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/${employee.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error("Failed to save employee.");
        }

        const updated = await response.json();
        employees = employees.map((item) => (item.id === updated.id ? updated : item));

        if (selectedEmployeeId === updated.id) {
          fillDetailsPanel(updated);
        }

        renderTable();
        setStatus(`Saved changes for ${updated.name}.`);
      } catch (error) {
        setStatus(error.message || "Unable to save employee.", true);
      }
    });

    row.querySelector(".delete").addEventListener("click", async () => {
      const confirmed = window.confirm(`Delete ${employee.name}?`);
      if (!confirmed) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/${employee.id}`, { method: "DELETE" });
        if (!response.ok) {
          throw new Error("Failed to delete employee.");
        }

        employees = employees.filter((item) => item.id !== employee.id);

        if (selectedEmployeeId === employee.id) {
          selectedEmployeeId = null;
          fillDetailsPanel(null);
          setActiveTab("dashboard");
        }

        renderTable();
        setStatus(`Deleted ${employee.name}.`);
      } catch (error) {
        setStatus(error.message || "Unable to delete employee.", true);
      }
    });

    tableBody.appendChild(fragment);
  }

  if (filtered.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.textContent = "No employees match your search.";
    row.appendChild(cell);
    tableBody.appendChild(row);
  }

  renderPagination(filtered.length);
  updateCount();
}

async function createEmployee(formData) {
  const payload = sanitizeEmployee(Object.fromEntries(formData.entries()));

  if (!isValidEmployee(payload)) {
    setStatus("All fields are required before creating an employee.", true);
    return;
  }

  try {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Failed to create employee.");
    }

    const created = await response.json();
    employees.push(created);
    employees.sort((a, b) => a.name.localeCompare(b.name));
    currentPage = 1;
    renderTable();
    setStatus(`Added ${created.name}.`);
    modal.close();
    employeeForm.reset();
  } catch (error) {
    setStatus(error.message || "Unable to create employee.", true);
  }
}

async function saveDetails(event) {
  event.preventDefault();

  if (!selectedEmployeeId) {
    setStatus("Select an employee from the dashboard before saving details.", true);
    return;
  }

  const payload = sanitizeDetails(Object.fromEntries(new FormData(detailsForm).entries()));
  if (!isValidDetails(payload)) {
    setStatus("Please complete all detail fields with a valid salary.", true);
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/${selectedEmployeeId}/details`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Failed to save employee details.");
    }

    const updated = await response.json();
    employees = employees.map((item) => (item.id === updated.id ? updated : item));
    setStatus(`Saved detailed profile for ${updated.name}.`);
    relockDetailsTab();
  } catch (error) {
    setStatus(error.message || "Unable to save details.", true);
  }
}

searchInput.addEventListener("input", (event) => {
  filterText = event.target.value.trim().toLowerCase();
  currentPage = 1;
  renderTable();
});

addEmployeeBtn.addEventListener("click", () => {
  modal.showModal();
});

cancelModalBtn.addEventListener("click", () => {
  modal.close();
});

employeeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(employeeForm);
  createEmployee(formData);
});

tabDashboard.addEventListener("click", () => {
  if (detailsTabUnlocked) {
    relockDetailsTab();
    return;
  }
  setActiveTab("dashboard");
});

tabDetails.addEventListener("click", () => {
  if (!detailsTabUnlocked) {
    setStatus("Click More Details on an employee to unlock the details tab.", true);
    return;
  }

  if (!selectedEmployeeId && employees.length > 0) {
    selectedEmployeeId = employees[0].id;
    fillDetailsPanel(employees[0]);
  }
  setActiveTab("details");
});

backToDashboardBtn.addEventListener("click", () => {
  relockDetailsTab();
});

detailsForm.addEventListener("submit", saveDetails);

(async function init() {
  try {
    await fetchEmployees();
    renderTable();
    fillDetailsPanel(null);
    setDetailsTabVisibility(false);
    setActiveTab("dashboard");
    setStatus("Employee data loaded.");
  } catch (error) {
    setStatus(error.message || "Failed to initialize dashboard.", true);
  }
})();
