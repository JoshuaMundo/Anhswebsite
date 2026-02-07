// Helper Functions
const $ = id => document.getElementById(id);
const subjects = [
    "Inquiries, Investigations and Immersion",
    "Contemporary Philippine Arts from the Regions",
    "English for Academic and Professional Purposes",
    "Computer Systems Servicing",
    "Physical Education and Health 4",
    "Work Immersion"
];

// Global Variables
let current = "", viewing = "", isTeacher = false;
let usersCache = {};

// ========== FIREBASE FUNCTIONS ==========

// Initialize default teacher account
function initializeTeacher() {
    const teacherRef = database.ref('users/teacher@anhs.edu'.replace(/\./g, ','));
    teacherRef.once('value', (snapshot) => {
        if (!snapshot.exists()) {
            teacherRef.set({
                password: "teacher123",
                role: "teacher",
                email: "teacher@anhs.edu"
            });
        }
    });
}

// Load all users from Firebase
function loadUsersFromFirebase(callback) {
    database.ref('users').on('value', (snapshot) => {
        usersCache = {};
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(key => {
                const email = key.replace(/,/g, '.');
                usersCache[email] = data[key];
            });
        }
        if (callback) callback();
    });
}

// Save user to Firebase
function saveUserToFirebase(email, userData) {
    const emailKey = email.replace(/\./g, ',');
    return database.ref('users/' + emailKey).set(userData);
}

// Update user data in Firebase
function updateUserInFirebase(email, updates) {
    const emailKey = email.replace(/\./g, ',');
    return database.ref('users/' + emailKey).update(updates);
}

// ========== EVENT LISTENERS ==========

// Initialize teacher and load users when page loads
window.addEventListener('DOMContentLoaded', () => {
    initializeTeacher();
    loadUsersFromFirebase();
});

// Switch between Login and Register
$("toRegister").onclick = () => {
    $("loginBox").classList.add("hidden");
    $("registerBox").classList.remove("hidden");
}

$("toLogin").onclick = () => {
    $("registerBox").classList.add("hidden");
    $("loginBox").classList.remove("hidden");
}

// Login Handler
$("loginBtn").onclick = () => {
    const email = $("loginEmail").value.trim();
    const pass = $("loginPass").value;

    if (usersCache[email] && usersCache[email].password === pass) {
        current = email;
        isTeacher = usersCache[email].role === "teacher";
        $("loginBox").classList.add("hidden");
        $("dashboard").classList.remove("hidden");
        $("dashTitle").textContent = isTeacher ? "Teacher Dashboard" : "Student Dashboard";

        if (isTeacher) {
            $("teacherPanel").classList.remove("hidden");
            loadStudentList();
        } else {
            viewing = current; // Students view their own data
            loadUserData();
        }

        initTables();
    } else {
        alert("Invalid login credentials");
    }
}

// Register Handler
$("registerBtn").onclick = () => {
    const email = $("regEmail").value.trim();
    const name = $("regName").value.trim();
    const section = $("regSection").value;
    const grade = $("regGrade").value.trim();
    const pass = $("regPass").value;

    if (!name || !section || !grade || !email || !pass) {
        return alert("Please fill all fields");
    }

    if (usersCache[email]) {
        return alert("User already exists");
    }

    const userData = {
        password: pass,
        role: "student",
        email: email,
        info: {
            name: name,
            section: section,
            grade: grade,
            grades: {},
            summative: {},
            written: {},
            performance: {},
            attendance: []
        }
    };

    saveUserToFirebase(email, userData).then(() => {
        alert("Student registered successfully!");
        
        // Clear form
        $("regName").value = "";
        $("regSection").value = "";
        $("regGrade").value = "";
        $("regEmail").value = "";
        $("regPass").value = "";

        $("registerBox").classList.add("hidden");
        $("loginBox").classList.remove("hidden");
    }).catch(error => {
        alert("Registration error: " + error.message);
    });
}

// Logout Handler
$("logoutBtn").onclick = () => {
    current = "";
    viewing = "";
    isTeacher = false;
    $("dashboard").classList.add("hidden");
    $("teacherPanel").classList.add("hidden");
    $("loginBox").classList.remove("hidden");
}

// Section Filter
$("sectionSelect").onchange = loadStudentList;

// Save Info Button
$("saveInfoBtn").onclick = () => {
    if (!isTeacher || !viewing) return;
    
    const updates = {
        'info/name': $("infoName").value,
        'info/section': $("infoSection").value,
        'info/grade': $("infoGrade").value
    };
    
    updateUserInFirebase(viewing, updates).then(() => {
        alert("Info saved!");
        loadStudentList();
    }).catch(error => {
        alert("Save error: " + error.message);
    });
}

// Save All Edits Button
$("saveEditsBtn").onclick = () => {
    if (!isTeacher || !viewing) return;

    const updates = {
        'info/grades': saveTableData("gradesTable", subjects),
        'info/summative': saveTableData("summativeTable", subjects),
        'info/written': saveSimpleTableData("writtenTable", ["Task 1", "Task 2", "Task 3", "Task 4"]),
        'info/performance': saveSimpleTableData("performanceTable", ["PT 1", "PT 2", "PT 3", "PT 4"]),
        'info/attendance': saveAttendanceData()
    };

    updateUserInFirebase(viewing, updates).then(() => {
        alert("All changes saved!");
    }).catch(error => {
        alert("Save error: " + error.message);
    });
}

// ========== STUDENT LIST FUNCTIONS ==========

function loadStudentList() {
    const selectedSection = $("sectionSelect").value;
    const list = $("studentList");
    list.innerHTML = "";
    let count = 0;

    Object.keys(usersCache).forEach(email => {
        if (usersCache[email].role === "student") {
            const studentSection = usersCache[email].info?.section || "";

            // Filter by section if selected
            if (selectedSection && studentSection !== selectedSection) return;

            count++;
            const btn = document.createElement("button");
            btn.className = "student-btn";
            btn.textContent = `${usersCache[email].info?.name || email} (${studentSection})`;
            btn.onclick = () => {
                viewing = email;
                loadUserData();
                // Highlight active button
                list.querySelectorAll("button").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
            };
            list.appendChild(btn);
        }
    });

    $("studentCount").textContent = count;
}

// ========== DATA LOADING FUNCTIONS ==========

function loadUserData() {
    if (!viewing || !usersCache[viewing]) return;

    const user = usersCache[viewing];
    const info = user.info || {};

    // Load basic info
    $("infoName").value = info.name || "";
    $("infoSection").value = info.section || "";
    $("infoGrade").value = info.grade || "";

    // Enable/disable fields based on role
    const isEditable = isTeacher;
    $("infoName").disabled = !isEditable;
    $("infoSection").disabled = !isEditable;
    $("infoGrade").disabled = !isEditable;
    $("saveInfoBtn").classList.toggle("hidden", !isEditable);
    $("saveEditsBtn").classList.toggle("hidden", !isEditable);

    // Load grades
    loadTableData("gradesTable", info.grades || {}, subjects, isEditable);
    loadTableData("summativeTable", info.summative || {}, subjects, isEditable);
    loadSimpleTableData("writtenTable", info.written || {}, ["Task 1", "Task 2", "Task 3", "Task 4"], isEditable);
    loadSimpleTableData("performanceTable", info.performance || {}, ["PT 1", "PT 2", "PT 3", "PT 4"], isEditable);
    loadAttendanceData(info.attendance || [], isEditable);

    updateGrades();
}

function loadTableData(tableId, data, keys, editable) {
    const inputs = $(tableId).querySelectorAll("input");
    keys.forEach((key, i) => {
        if (inputs[i]) inputs[i].value = data[key] || 0;
    });
}

function loadSimpleTableData(tableId, data, keys, editable) {
    const inputs = $(tableId).querySelectorAll("input");
    keys.forEach((key, i) => {
        if (inputs[i]) inputs[i].value = data[key] || 0;
    });
}

function loadAttendanceData(data, editable) {
    const selects = $("attendanceTable").querySelectorAll("select");
    selects.forEach((sel, i) => {
        sel.value = data[i] || "Present";
    });
}

// ========== DATA SAVING FUNCTIONS ==========

function saveTableData(tableId, keys) {
    const data = {};
    const inputs = $(tableId).querySelectorAll("input");
    keys.forEach((key, i) => {
        if (inputs[i]) data[key] = Number(inputs[i].value) || 0;
    });
    return data;
}

function saveSimpleTableData(tableId, keys) {
    const data = {};
    const inputs = $(tableId).querySelectorAll("input");
    keys.forEach((key, i) => {
        if (inputs[i]) data[key] = Number(inputs[i].value) || 0;
    });
    return data;
}

function saveAttendanceData() {
    const data = [];
    const selects = $("attendanceTable").querySelectorAll("select");
    selects.forEach(sel => data.push(sel.value));
    return data;
}

// ========== TABLE CREATION FUNCTIONS ==========

function initTables() {
    createGradesTable();
    createSummativeTable();
    createWrittenTable();
    createPerformanceTable();
    createAttendanceTable();

    if (viewing) {
        loadUserData();
    }
}

function createGradesTable() {
    const table = $("gradesTable");
    table.innerHTML = "<tr><th>Subject</th><th>Grade</th><th>Status</th></tr>";
    subjects.forEach(sub => {
        const tr = document.createElement("tr");
        const tdSub = document.createElement("td");
        tdSub.textContent = sub;
        const tdInput = document.createElement("td");
        const input = document.createElement("input");
        input.type = "number";
        input.min = 0;
        input.max = 100;
        input.value = 0;
        input.disabled = !isTeacher;
        input.oninput = updateGrades;
        tdInput.appendChild(input);
        const tdStatus = document.createElement("td");
        tdStatus.className = "status-cell";
        tr.appendChild(tdSub);
        tr.appendChild(tdInput);
        tr.appendChild(tdStatus);
        table.appendChild(tr);
    });
}

function createSummativeTable() {
    const table = $("summativeTable");
    table.innerHTML = "<tr><th>Subject</th><th>Score</th></tr>";
    subjects.forEach(sub => {
        const tr = document.createElement("tr");
        const tdSub = document.createElement("td");
        tdSub.textContent = sub;
        const tdScore = document.createElement("td");
        const input = document.createElement("input");
        input.type = "number";
        input.min = 0;
        input.max = 100;
        input.value = 0;
        input.disabled = !isTeacher;
        input.oninput = updateGrades;
        tdScore.appendChild(input);
        tr.appendChild(tdSub);
        tr.appendChild(tdScore);
        table.appendChild(tr);
    });
}

function createWrittenTable() {
    const table = $("writtenTable");
    table.innerHTML = "<tr><th>Task</th><th>Score</th></tr>";
    ["Task 1", "Task 2", "Task 3", "Task 4"].forEach(task => {
        const tr = document.createElement("tr");
        const tdTask = document.createElement("td");
        tdTask.textContent = task;
        const tdScore = document.createElement("td");
        const input = document.createElement("input");
        input.type = "number";
        input.min = 0;
        input.max = 100;
        input.value = 0;
        input.disabled = !isTeacher;
        input.oninput = updateGrades;
        tdScore.appendChild(input);
        tr.appendChild(tdTask);
        tr.appendChild(tdScore);
        table.appendChild(tr);
    });
}

function createPerformanceTable() {
    const table = $("performanceTable");
    table.innerHTML = "<tr><th>Task</th><th>Score</th></tr>";
    ["PT 1", "PT 2", "PT 3", "PT 4"].forEach(task => {
        const tr = document.createElement("tr");
        const tdTask = document.createElement("td");
        tdTask.textContent = task;
        const tdScore = document.createElement("td");
        const input = document.createElement("input");
        input.type = "number";
        input.min = 0;
        input.max = 100;
        input.value = 0;
        input.disabled = !isTeacher;
        input.oninput = updateGrades;
        tdScore.appendChild(input);
        tr.appendChild(tdTask);
        tr.appendChild(tdScore);
        table.appendChild(tr);
    });
}

function createAttendanceTable() {
    const table = $("attendanceTable");
    table.innerHTML = "<tr><th>Date</th><th>Status</th></tr>";
    for (let i = 1; i <= 10; i++) {
        const tr = document.createElement("tr");
        const tdDate = document.createElement("td");
        tdDate.textContent = `Day ${i}`;
        const tdStatus = document.createElement("td");
        const select = document.createElement("select");
        select.disabled = !isTeacher;
        ["Present", "Absent", "Excuse", "Escape"].forEach(s => {
            const opt = document.createElement("option");
            opt.value = s;
            opt.textContent = s;
            select.appendChild(opt);
        });
        select.onchange = updateGrades;
        tdStatus.appendChild(select);
        tr.appendChild(tdDate);
        tr.appendChild(tdStatus);
        table.appendChild(tr);
    }
}

// ========== GRADE CALCULATION ==========

function updateGrades() {
    let gradeSum = 0, gradeCount = 0;

    // Summative
    $("summativeTable").querySelectorAll("input").forEach(i => {
        const val = Number(i.value) || 0;
        gradeSum += val;
        gradeCount++;
    });

    // Written
    $("writtenTable").querySelectorAll("input").forEach(i => {
        const val = Number(i.value) || 0;
        gradeSum += val;
        gradeCount++;
    });

    // Performance
    $("performanceTable").querySelectorAll("input").forEach(i => {
        const val = Number(i.value) || 0;
        gradeSum += val;
        gradeCount++;
    });

    // Attendance deduction
    $("attendanceTable").querySelectorAll("select").forEach(s => {
        if (s.value === "Absent") gradeSum -= 5;
        if (s.value === "Excuse") gradeSum -= 2;
        if (s.value === "Escape") gradeSum -= 10;
    });

    let avg = gradeCount ? (gradeSum / gradeCount).toFixed(2) : 0;
    $("finalGeneral").textContent = avg;

    // Update pass/fail status in grades table
    const gradeInputs = $("gradesTable").querySelectorAll("input");
    const statusCells = $("gradesTable").querySelectorAll(".status-cell");
    gradeInputs.forEach((input, i) => {
        const grade = Number(input.value) || 0;
        if (statusCells[i]) {
            if (grade >= 75) {
                statusCells[i].textContent = "PASS";
                statusCells[i].className = "status-cell pass";
            } else {
                statusCells[i].textContent = "FAIL";
                statusCells[i].className = "status-cell fail";
            }
        }
    });
}
