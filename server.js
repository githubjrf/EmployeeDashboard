const path = require("path");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "employees.db");
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new sqlite3.Database(dbPath);

app.use(express.json());
app.use(express.static(__dirname));

const BASE_FIELDS = ["name", "phone", "email", "office", "position"];
const DETAIL_FIELDS = [
  "job_site_location",
  "role",
  "social_security_number",
  "employee_start_date",
  "beneficiary",
  "salary"
];

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

async function ensureColumns() {
  const tableInfo = await all("PRAGMA table_info(employees)");
  const columnSet = new Set(tableInfo.map((column) => column.name));

  const statements = [];
  if (!columnSet.has("job_site_location")) {
    statements.push("ALTER TABLE employees ADD COLUMN job_site_location TEXT NOT NULL DEFAULT ''");
  }
  if (!columnSet.has("role")) {
    statements.push("ALTER TABLE employees ADD COLUMN role TEXT NOT NULL DEFAULT ''");
  }
  if (!columnSet.has("social_security_number")) {
    statements.push("ALTER TABLE employees ADD COLUMN social_security_number TEXT NOT NULL DEFAULT ''");
  }
  if (!columnSet.has("employee_start_date")) {
    statements.push("ALTER TABLE employees ADD COLUMN employee_start_date TEXT NOT NULL DEFAULT ''");
  }
  if (!columnSet.has("beneficiary")) {
    statements.push("ALTER TABLE employees ADD COLUMN beneficiary TEXT NOT NULL DEFAULT ''");
  }
  if (!columnSet.has("salary")) {
    statements.push("ALTER TABLE employees ADD COLUMN salary REAL NOT NULL DEFAULT 0");
  }

  for (const sql of statements) {
    await run(sql);
  }
}

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      office TEXT NOT NULL,
      position TEXT NOT NULL,
      job_site_location TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT '',
      social_security_number TEXT NOT NULL DEFAULT '',
      employee_start_date TEXT NOT NULL DEFAULT '',
      beneficiary TEXT NOT NULL DEFAULT '',
      salary REAL NOT NULL DEFAULT 0
    )
  `);

  await ensureColumns();

  const existing = await all("SELECT id FROM employees LIMIT 1");
  if (existing.length === 0) {
    const seedEmployees = [
      [
        "Ava Thompson",
        "(312) 555-0162",
        "ava.thompson@company.com",
        "Chicago HQ",
        "Operations Manager",
        "West Loop Development Site",
        "Project Lead",
        "***-**-6821",
        "2021-03-15",
        "James Thompson",
        98000
      ],
      [
        "Liam Carter",
        "(773) 555-0139",
        "liam.carter@company.com",
        "Austin Hub",
        "Software Engineer",
        "Austin Product Campus",
        "Senior Developer",
        "***-**-3904",
        "2020-09-08",
        "Emma Carter",
        125000
      ],
      [
        "Mia Rodriguez",
        "(469) 555-0127",
        "mia.rodriguez@company.com",
        "Denver Office",
        "HR Specialist",
        "Denver Operations Park",
        "HR Generalist",
        "***-**-2946",
        "2022-01-24",
        "Luis Rodriguez",
        76000
      ],
      [
        "Noah Brooks",
        "(214) 555-0185",
        "noah.brooks@company.com",
        "Remote",
        "Product Designer",
        "Remote / Central Region",
        "UX Designer",
        "***-**-1843",
        "2019-06-03",
        "Olivia Brooks",
        112000
      ]
    ];

    for (const row of seedEmployees) {
      await run(
        `
          INSERT INTO employees (
            name, phone, email, office, position,
            job_site_location, role, social_security_number,
            employee_start_date, beneficiary, salary
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        row
      );
    }
  }

  await ensureMinimumTestRecords(300);
}

async function ensureMinimumTestRecords(minimumCount) {
  const countRow = await all("SELECT COUNT(*) AS count FROM employees");
  const currentCount = Number(countRow[0]?.count || 0);
  if (currentCount >= minimumCount) {
    return;
  }

  const offices = ["Chicago HQ", "Austin Hub", "Denver Office", "Remote", "Seattle Studio"];
  const positions = ["Technician", "Coordinator", "Engineer", "Supervisor", "Analyst"];
  const roles = ["Site Lead", "Field Specialist", "Ops Support", "Project Coordinator", "Team Member"];
  const sites = [
    "North Campus",
    "West Loop Site",
    "Downtown Center",
    "Riverfront Facility",
    "Innovation Park"
  ];
  const beneficiaries = ["Jordan Lee", "Taylor Morgan", "Alex Parker", "Casey Rivera", "Sam Bennett"];

  for (let i = currentCount + 1; i <= minimumCount; i += 1) {
    const office = offices[(i - 1) % offices.length];
    const position = positions[(i - 1) % positions.length];
    const role = roles[(i - 1) % roles.length];
    const jobSite = sites[(i - 1) % sites.length];
    const beneficiary = beneficiaries[(i - 1) % beneficiaries.length];
    const phoneSuffix = String(1000 + i).slice(-4);
    const ssnSuffix = String(1000 + (i % 9000)).slice(-4);
    const year = 2018 + (i % 8);
    const month = String(((i % 12) || 12)).padStart(2, "0");
    const day = String(((i % 28) || 28)).padStart(2, "0");
    const startDate = `${year}-${month}-${day}`;
    const salary = 60000 + (i % 25) * 2500;

    await run(
      `
        INSERT INTO employees (
          name, phone, email, office, position,
          job_site_location, role, social_security_number,
          employee_start_date, beneficiary, salary
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        `Test Employee ${i}`,
        `(555) 010-${phoneSuffix}`,
        `employee${i}@example.com`,
        office,
        position,
        jobSite,
        role,
        `***-**-${ssnSuffix}`,
        startDate,
        beneficiary,
        salary
      ]
    );
  }
}

function validateBaseEmployee(payload) {
  const cleaned = {};

  for (const field of BASE_FIELDS) {
    const value = payload[field];
    if (typeof value !== "string" || value.trim().length === 0) {
      return { valid: false, message: `Field '${field}' is required.` };
    }
    cleaned[field] = value.trim();
  }

  return { valid: true, data: cleaned };
}

function validateDetailPayload(payload) {
  const cleaned = {};

  for (const field of DETAIL_FIELDS) {
    const value = payload[field];

    if (field === "salary") {
      const numberValue = Number(value);
      if (!Number.isFinite(numberValue) || numberValue < 0) {
        return { valid: false, message: "Field 'salary' must be a valid non-negative number." };
      }
      cleaned.salary = numberValue;
      continue;
    }

    if (typeof value !== "string" || value.trim().length === 0) {
      return { valid: false, message: `Field '${field}' is required.` };
    }
    cleaned[field] = value.trim();
  }

  return { valid: true, data: cleaned };
}

async function findEmployeeById(employeeId) {
  const rows = await all("SELECT * FROM employees WHERE id = ?", [employeeId]);
  return rows[0];
}

app.get("/api/employees", async (req, res) => {
  try {
    const rows = await all("SELECT * FROM employees ORDER BY name ASC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch employees." });
  }
});

app.get("/api/employees/:id", async (req, res) => {
  const employeeId = Number(req.params.id);
  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    res.status(400).json({ message: "Invalid employee id." });
    return;
  }

  try {
    const employee = await findEmployeeById(employeeId);
    if (!employee) {
      res.status(404).json({ message: "Employee not found." });
      return;
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch employee." });
  }
});

app.post("/api/employees", async (req, res) => {
  const baseResult = validateBaseEmployee(req.body || {});
  if (!baseResult.valid) {
    res.status(400).json({ message: baseResult.message });
    return;
  }

  const detailsSource = {
    job_site_location: req.body?.job_site_location || "Not Assigned",
    role: req.body?.role || baseResult.data.position,
    social_security_number: req.body?.social_security_number || "***-**-0000",
    employee_start_date: req.body?.employee_start_date || new Date().toISOString().slice(0, 10),
    beneficiary: req.body?.beneficiary || "Not Provided",
    salary: req.body?.salary ?? 0
  };

  const detailResult = validateDetailPayload(detailsSource);
  if (!detailResult.valid) {
    res.status(400).json({ message: detailResult.message });
    return;
  }

  try {
    const insert = await run(
      `
        INSERT INTO employees (
          name, phone, email, office, position,
          job_site_location, role, social_security_number,
          employee_start_date, beneficiary, salary
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        baseResult.data.name,
        baseResult.data.phone,
        baseResult.data.email,
        baseResult.data.office,
        baseResult.data.position,
        detailResult.data.job_site_location,
        detailResult.data.role,
        detailResult.data.social_security_number,
        detailResult.data.employee_start_date,
        detailResult.data.beneficiary,
        detailResult.data.salary
      ]
    );

    const created = await findEmployeeById(insert.id);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: "Failed to create employee." });
  }
});

app.put("/api/employees/:id", async (req, res) => {
  const employeeId = Number(req.params.id);
  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    res.status(400).json({ message: "Invalid employee id." });
    return;
  }

  const result = validateBaseEmployee(req.body || {});
  if (!result.valid) {
    res.status(400).json({ message: result.message });
    return;
  }

  try {
    const update = await run(
      "UPDATE employees SET name = ?, phone = ?, email = ?, office = ?, position = ? WHERE id = ?",
      [
        result.data.name,
        result.data.phone,
        result.data.email,
        result.data.office,
        result.data.position,
        employeeId
      ]
    );

    if (update.changes === 0) {
      res.status(404).json({ message: "Employee not found." });
      return;
    }

    const employee = await findEmployeeById(employeeId);
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: "Failed to update employee." });
  }
});

app.put("/api/employees/:id/details", async (req, res) => {
  const employeeId = Number(req.params.id);
  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    res.status(400).json({ message: "Invalid employee id." });
    return;
  }

  const result = validateDetailPayload(req.body || {});
  if (!result.valid) {
    res.status(400).json({ message: result.message });
    return;
  }

  try {
    const update = await run(
      `
        UPDATE employees
        SET
          job_site_location = ?,
          role = ?,
          social_security_number = ?,
          employee_start_date = ?,
          beneficiary = ?,
          salary = ?
        WHERE id = ?
      `,
      [
        result.data.job_site_location,
        result.data.role,
        result.data.social_security_number,
        result.data.employee_start_date,
        result.data.beneficiary,
        result.data.salary,
        employeeId
      ]
    );

    if (update.changes === 0) {
      res.status(404).json({ message: "Employee not found." });
      return;
    }

    const employee = await findEmployeeById(employeeId);
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: "Failed to update employee details." });
  }
});

app.delete("/api/employees/:id", async (req, res) => {
  const employeeId = Number(req.params.id);
  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    res.status(400).json({ message: "Invalid employee id." });
    return;
  }

  try {
    const remove = await run("DELETE FROM employees WHERE id = ?", [employeeId]);
    if (remove.changes === 0) {
      res.status(404).json({ message: "Employee not found." });
      return;
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Failed to delete employee." });
  }
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Employee dashboard running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database initialization failed:", error);
    process.exit(1);
  });
