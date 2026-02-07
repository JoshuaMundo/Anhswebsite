const $ = id => document.getElementById(id);
const KEY = "ANHS_USERS";
const subjects = [
  "Inquiries, Investigations and Immersion",
  "Contemporary Philippine Arts from the Regions",
  "English for Academic and Professional Purposes",
  "Computer Systems Servicing",
  "Physical Education and Health 4",
  "Work Immersion"
];

const load = () => JSON.parse(localStorage.getItem(KEY) || "{}");
const save = u => localStorage.setItem(KEY, JSON.stringify(u));

let users = load();
if (!users["teacher@anhs.edu"]) {
  users["teacher@anhs.edu"] = { password: "teacher123", role: "teacher" };
  save(users);
}

let current = "", viewing = "", isTeacher = false;

/* SWITCH */
$("toRegister").onclick = () => {
  $("loginBox").classList.add("hidden");
  $("registerBox").classList.remove("hidden");
};
$("toLogin").onclick = () => {
  $("registerBox").classList.add("hidden");
  $("loginBox").classList.remove("hidden");
};

/* LOGIN */
$("loginBtn").onclick = () => {
  const email = $("loginEmail").value.trim();
  const pass = $("loginPass").value;
  if (users[email] && users[email].password === pass) {
    current = email;
    isTeacher = users[email].role === "teacher";
    $("loginBox").classList.add("hidden");
    $("dashboard").classList.remove("hidden");
    $("dashTitle").textContent = isTeacher ? "Teacher Dashboard" : "Student Dashboard";
    if (isTeacher) $("teacherPanel").classList.remove("hidden");
    initTables();
    if (!users[email].info) users[email].info = {};
  } else alert("Invalid login");
};

/* REGISTER */
$("registerBtn").onclick = () => {
  const email = $("regEmail").value.trim();
  if (users[email]) return alert("User exists");
  users[email] = {
    password: $("regPass").value,
    role: "student",
    info: {
      name: $("regName").value,
      section: $("regSection").value,
      grade: $("regGrade").value,
      grades: {},
      summative: {},
      written: {},
      performance: {},
      attendance: []
    }
  };
  save(users);
  alert("Registered");
  $("registerBox").classList.add("hidden");
  $("loginBox").classList.remove("hidden");
};

/* LOGOUT */
$("logoutBtn").onclick = () => {
  current = "";
  isTeacher = false;
  $("dashboard").classList.add("hidden");
  $("loginBox").classList.remove("hidden");
};

/* INIT TABLES */
function initTables() {
  createGradesTable();
  createSummativeTable();
  createWrittenTable();
  createPerformanceTable();
  createAttendanceTable();
  updateGrades();
}

/* CREATE TABLES */
function createGradesTable() {
  const table = $("gradesTable");
  table.innerHTML = "<tr><th>Subject</th><th>Pass/Fail</th></tr>";
  subjects.forEach(sub => {
    const tr = document.createElement("tr");
    const tdSub = document.createElement("td"); tdSub.textContent = sub;
    const tdInput = document.createElement("td");
    const input = document.createElement("input"); input.type = "number"; input.min = 0; input.max = 100; input.value = 0;
    input.oninput = updateGrades; tdInput.appendChild(input);
    tr.appendChild(tdSub); tr.appendChild(tdInput); table.appendChild(tr);
  });
}

function createSummativeTable() {
  const table = $("summativeTable"); table.innerHTML = "<tr><th>Subject</th><th>Score</th></tr>";
  subjects.forEach(sub => {
    const tr = document.createElement("tr");
    const tdSub = document.createElement("td"); tdSub.textContent = sub;
    const tdScore = document.createElement("td");
    const input = document.createElement("input"); input.type = "number"; input.min = 0; input.max = 100; input.value = 0;
    input.oninput = updateGrades; tdScore.appendChild(input);
    tr.appendChild(tdSub); tr.appendChild(tdScore); table.appendChild(tr);
  });
}

function createWrittenTable() {
  const table = $("writtenTable"); table.innerHTML = "<tr><th>Task</th><th>Score</th></tr>";
  ["Task 1","Task 2","Task 3","Task 4"].forEach(task => {
    const tr = document.createElement("tr");
    const tdTask = document.createElement("td"); tdTask.textContent = task;
    const tdScore = document.createElement("td");
    const input = document.createElement("input"); input.type = "number"; input.min = 0; input.max = 100; input.value = 0;
    input.oninput = updateGrades; tdScore.appendChild(input);
    tr.appendChild(tdTask); tr.appendChild(tdScore); table.appendChild(tr);
  });
}

function createPerformanceTable() {
  const table = $("performanceTable"); table.innerHTML = "<tr><th>Task</th><th>Score</th></tr>";
  ["PT 1","PT 2","PT 3","PT 4"].forEach(task => {
    const tr = document.createElement("tr");
    const tdTask = document.createElement("td"); tdTask.textContent = task;
    const tdScore = document.createElement("td");
    const input = document.createElement("input"); input.type = "number"; input.min = 0; input.max = 100; input.value = 0;
    input.oninput = updateGrades; tdScore.appendChild(input);
    tr.appendChild(tdTask); tr.appendChild(tdScore); table.appendChild(tr);
  });
}

function createAttendanceTable() {
  const table = $("attendanceTable"); table.innerHTML = "<tr><th>Date</th><th>Status</th></tr>";
  for(let i=1;i<=10;i++){
    const tr=document.createElement("tr");
    const tdDate=document.createElement("td"); tdDate.textContent=`Day ${i}`;
    const tdStatus=document.createElement("td");
    const select=document.createElement("select");
    ["Present","Absent","Excuse","Escape"].forEach(s=>{
      const opt=document.createElement("option"); opt.value=s; opt.textContent=s; select.appendChild(opt);
    });
    select.onchange=updateGrades; tdStatus.appendChild(select);
    tr.appendChild(tdDate); tr.appendChild(tdStatus); table.appendChild(tr);
  }
}

/* UPDATE GRADES */
function updateGrades(){
  let gradeSum=0, gradeCount=0;
  $("summativeTable").querySelectorAll("input").forEach(i=>{gradeSum+=Number(i.value); gradeCount++;});
  $("writtenTable").querySelectorAll("input").forEach(i=>{gradeSum+=Number(i.value); gradeCount++;});
  $("performanceTable").querySelectorAll("input").forEach(i=>{gradeSum+=Number(i.value); gradeCount++;});
  $("attendanceTable").querySelectorAll("select").forEach(s=>{
    if(s.value==="Absent") gradeSum-=5;
    if(s.value==="Excuse") gradeSum-=2;
    if(s.value==="Escape") gradeSum-=10;
  });
  let avg = gradeCount ? (gradeSum/gradeCount).toFixed(2) : 0;
  $("finalGeneral").textContent = avg;
}