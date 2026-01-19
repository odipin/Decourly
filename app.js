/***********************************************************
 * LIVESTUDENT - CORE ENGINE
 ***********************************************************/

// 1. DATA & SUBJECTS
const STUDENTS = ["AYANA","AAYAN","MIVAAN","ASHREE","BAIBHAV","BIHAN","ZYRA"];
const session = JSON.parse(localStorage.getItem("session"));
const ding = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

const subjects = [
  "Math K-3", 
  "Math 4-7", 
  "Resource", 
  "Band Mechanics", 
  "FEBE History"
];

// 2. HARDCODED ROSTERS
let enrollment = JSON.parse(localStorage.getItem("enrollment"));
if (!enrollment) {
  enrollment = {
    "Math K-3": ["mivaan", "zyra", "ashree", "bihan"],
    "Math 4-7": ["ayana", "aayan", "baibhav"],
    "Resource": ["ayana", "aayan", "mivaan", "ashree", "baibhav", "bihan", "zyra"],
    "Band Mechanics": ["mivaan", "baibhav", "bihan"],
    "FEBE History": []
  };
  localStorage.setItem("enrollment", JSON.stringify(enrollment));
}

let attendanceData = JSON.parse(localStorage.getItem("attendanceData")) || {};
let activePasses = JSON.parse(localStorage.getItem("activePasses")) || {};
let grades = JSON.parse(localStorage.getItem("grades_v2")) || {};

const isTeacher = () => session?.role === "teacher";
const isStudent = () => session?.role === "student";
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

/*************************
 * ATTENDANCE
 *************************/
function showAttendanceTeacher() {
  const main = document.getElementById("content");
  main.innerHTML = `<h2>Attendance - Livestudent</h2>
    <select id="atSub" onchange="renderAtList()">${subjects.map(s => `<option value="${s}">${s}</option>`).join('')}</select>
    <div id="atList" style="margin-top:20px;"></div>`;
  renderAtList();
}

function renderAtList() {
  const sub = document.getElementById("atSub").value;
  const today = new Date().toISOString().split('T')[0];
  const listDiv = document.getElementById("atList"); 
  listDiv.innerHTML = "";
  const roster = enrollment[sub] || [];

  roster.forEach(stKey => {
    if(!attendanceData[today]) attendanceData[today] = {};
    if(!attendanceData[today][sub]) attendanceData[today][sub] = {};
    const status = attendanceData[today][sub][stKey] || "Unmarked";
    const card = document.createElement("div"); 
    card.className = "card";
    card.style = "display:flex; justify-content:space-between; align-items:center;";
    card.innerHTML = `<div><strong>${stKey.toUpperCase()}</strong>: ${status}</div>
      <div>
        <button onclick="setAt('${today}','${sub}','${stKey}','Present')" class="success">P</button>
        <button onclick="setAt('${today}','${sub}','${stKey}','Absent')" class="danger">A</button>
      </div>`;
    listDiv.appendChild(card);
  });
}

function setAt(d, s, st, v) { 
  attendanceData[d][s][st] = v; 
  save("attendanceData", attendanceData); 
  renderAtList(); 
}

/*************************
 * GRADES
 *************************/
function showGrades() {
  const main = document.getElementById("content"); 
  main.innerHTML = "<h2>Livestudent Gradebook</h2>";
  subjects.forEach(sub => {
    const roster = enrollment[sub] || [];
    if (roster.length === 0 && isTeacher()) return;
    const card = document.createElement("div"); 
    card.className = "card";
    card.innerHTML = `<h3>${sub}</h3>`;
    if (isTeacher()) {
      roster.forEach(st => {
        if (!grades[st]) grades[st] = [];
        let g = grades[st].find(x => x.subject === sub) || { score: 0 };
        card.innerHTML += `<div style="margin-top:10px;">${st.toUpperCase()}: 
          <input type="number" value="${g.score}" onchange="upGrade('${st}','${sub}',this.value)" style="width:65px">%</div>`;
      });
    } else {
      let g = (grades[session.key] || []).find(x => x.subject === sub);
      card.innerHTML += `<p>Score: ${g ? g.score : 0}%</p>`;
    }
    main.appendChild(card);
  });
}

function upGrade(st, sub, val) {
  if (!grades[st]) grades[st] = [];
  let e = grades[st].find(x => x.subject === sub);
  if (e) e.score = val; else grades[st].push({ subject: sub, score: val });
  save("grades_v2", grades);
}

/*************************
 * HALL PASS
 *************************/
function showHallPassStudent() {
  const main = document.getElementById("content");
  const p = activePasses[session.key];
  if (p) {
    if (p.status === "pending") main.innerHTML = `<div class="card"><h2>⏳ PENDING</h2></div>`;
    else if (p.status === "declined") main.innerHTML = `<div class="card"><h2>❌ DECLINED</h2><button onclick="endP('${session.key}')">OK</button></div>`;
    else main.innerHTML = `<div class="card active-pass-card"><h2>✅ APPROVED: ${p.reason}</h2>
      ${p.link ? `<button class="success" onclick="window.open('${p.link}')" style="width:100%">🔗 JOIN ZOOM</button>` : ""}</div>`;
  } else {
    main.innerHTML = `<div class="card"><h3>Request Livestudent Pass</h3><select id="pr"><option>Restroom</option><option>Zoom Session</option></select>
      <button onclick="reqP()" class="success" style="width:100%">Send Request</button></div>`;
  }
}

function reqP() {
  activePasses[session.key] = { reason: document.getElementById("pr").value, status: "pending", notified: false };
  save("activePasses", activePasses); showHallPassStudent();
}

function showHallPassTeacher() {
  const main = document.getElementById("content"); 
  main.innerHTML = "<h2>Hall Pass Control</h2>";
  activePasses = JSON.parse(localStorage.getItem("activePasses")) || {};
  Object.entries(activePasses).forEach(([st, p]) => {
    if (p.status === "declined") return;
    const d = document.createElement("div"); d.className = "card";
    if (p.status === "pending") {
      if (!p.notified) { ding.play().catch(()=>{}); p.notified = true; save("activePasses", activePasses); }
      d.innerHTML = `<b>${st.toUpperCase()}</b>: ${p.reason}<br>
        <input id="zL-${st}" placeholder="Paste Zoom Link" style="margin:10px 0; width:100%;">
        <button onclick="approveWithLink('${st}')" class="success">Approve</button>
        <button onclick="declinePass('${st}')" class="danger">Decline</button>`;
    } else {
      d.innerHTML = `${st.toUpperCase()} is out. <button onclick="endP('${st}')" class="danger">End</button>`;
    }
    main.appendChild(d);
  });
}

function approveWithLink(st) {
  const link = document.getElementById(`zL-${st}`).value;
  activePasses[st].status = "approved"; activePasses[st].link = link;
  save("activePasses", activePasses); showHallPassTeacher();
}

function declinePass(st) { activePasses[st].status = "declined"; save("activePasses", activePasses); showHallPassTeacher(); }
function endP(st) { delete activePasses[st]; save("activePasses", activePasses); isTeacher() ? showHallPassTeacher() : showHallPassStudent(); }

/*************************
 * SYSTEM & NAV
 *************************/
function showSystemControls() {
  const main = document.getElementById("content");
  main.innerHTML = `
    <div class="card">
      <h3>Livestudent Management</h3>
      <p>Select a subject to manually adjust students.</p>
      <select id="sSub" onchange="renR()">${subjects.map(s => `<option value="${s}">${s}</option>`).join('')}</select>
      <div id="rL" style="margin-top:10px;"></div>
    </div>`;
  renR();
}

function renR() {
  const sub = document.getElementById("sSub").value; 
  const div = document.getElementById("rL"); div.innerHTML = "";
  STUDENTS.forEach(s => {
    const k = s.toLowerCase();
    div.innerHTML += `<label style="display:block; margin:5px;"><input type="checkbox" ${enrollment[sub]?.includes(k)?'checked':''} onchange="togE('${sub}','${k}')"> ${s}</label>`;
  });
}

function togE(sub, st) {
  if(!enrollment[sub]) enrollment[sub] = [];
  if(enrollment[sub].includes(st)) enrollment[sub] = enrollment[sub].filter(x => x !== st);
  else enrollment[sub].push(st);
  save("enrollment", enrollment);
}

function addNavButtons() {
  const nav = document.getElementById("nav"); if (!nav) return; nav.innerHTML = "";
  const menu = [
    { label: "Attendance", func: isTeacher() ? showAttendanceTeacher : () => {} },
    { label: "Grades", func: showGrades },
    { label: "Hall Pass", func: isTeacher() ? showHallPassTeacher : showHallPassStudent }
  ];
  if (isTeacher()) menu.push({ label: "System", func: showSystemControls });
  menu.push({ label: "Logout", func: () => { localStorage.removeItem("session"); location.href="index.html"; } });
  
  menu.forEach(m => {
    const btn = document.createElement("button"); btn.textContent = m.label;
    btn.onclick = () => { showSection("contentView"); m.func(); };
    nav.appendChild(btn);
  });
}

function showSection(id) {
  document.querySelectorAll(".container > div").forEach(d => d.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

// Background sync for Hall Passes
setInterval(() => {
  const data = JSON.parse(localStorage.getItem("activePasses")) || {};
  if (isTeacher() && Object.values(data).some(p => p.status === "pending" && !p.notified)) { activePasses = data; showHallPassTeacher(); }
  if (isStudent() && data[session.key]?.status !== activePasses[session.key]?.status) { activePasses = data; showHallPassStudent(); }
}, 3000);

document.addEventListener("DOMContentLoaded", () => { if (session) { addNavButtons(); } });
