/*************************
 * USERS & ROLES
 *************************/
const users = {
  ayana: { role: "student" },
  student1: { role: "student" },
  mivaan: { role: "student" },
  aayan: { role: "student" },
  baibhav: { role: "student" },
  bihan: { role: "student" },
  ashree: { role: "student" },
  grya: { role: "student" },

  aahan: { role: "teacher" },
  abhinav: { role: "teacher" }
};

let currentUser = JSON.parse(localStorage.getItem("currentUser"));
let role = currentUser?.role;

/*************************
 * GRADES STORAGE
 *************************/
let grades = JSON.parse(localStorage.getItem("grades_v2")) || {};
let gradesLocked = JSON.parse(localStorage.getItem("gradesLocked")) || false;

/*************************
 * PA SYSTEM STORAGE
 *************************/
let paMessage = localStorage.getItem("paMessage") || "";

function saveGrades() {
  localStorage.setItem("grades_v2", JSON.stringify(grades));
}

function saveLock() {
  localStorage.setItem("gradesLocked", JSON.stringify(gradesLocked));
}

function savePA(msg) {
  localStorage.setItem("paMessage", msg);
  paMessage = msg;
  renderPA();
}

/*************************
 * PA SYSTEM UI
 *************************/
function renderPA() {
  let banner = document.getElementById("paBanner");

  if (!banner) {
    banner = document.createElement("div");
    banner.id = "paBanner";
    banner.style.background = "#ffcc00";
    banner.style.padding = "10px";
    banner.style.fontWeight = "bold";
    banner.style.textAlign = "center";
    banner.style.position = "sticky";
    banner.style.top = "0";
    banner.style.zIndex = "9999";
    document.body.prepend(banner);
  }

  if (paMessage) {
    banner.textContent = "📢 P.A. ANNOUNCEMENT: " + paMessage;
    banner.style.display = "block";
  } else {
    banner.style.display = "none";
  }
}

/*************************
 * NAVIGATION
 *************************/
function addNavButtons() {
  const nav = document.getElementById("nav");

  const gradesBtn = document.createElement("button");
  gradesBtn.textContent = "Grades";
  gradesBtn.onclick = showGrades;
  nav.appendChild(gradesBtn);

  if (role === "teacher") {
    const paBtn = document.createElement("button");
    paBtn.textContent = "P.A System";
    paBtn.onclick = showPAControls;
    nav.appendChild(paBtn);
  }
}

/*************************
 * PA CONTROLS (TEACHER)
 *************************/
function showPAControls() {
  const main = document.getElementById("content");
  main.innerHTML = `<h1>P.A System</h1>`;

  const input = document.createElement("textarea");
  input.placeholder = "Type announcement here...";
  input.style.width = "100%";
  input.style.height = "80px";
  input.value = paMessage;

  const sendBtn = document.createElement("button");
  sendBtn.textContent = "Broadcast Announcement";
  sendBtn.onclick = () => savePA(input.value);

  const stopBtn = document.createElement("button");
  stopBtn.textContent = "Stop Announcement";
  stopBtn.style.background = "red";
  stopBtn.style.color = "white";
  stopBtn.onclick = () => savePA("");

  main.appendChild(input);
  main.appendChild(sendBtn);
  main.appendChild(document.createElement("br"));
  main.appendChild(stopBtn);
}

/*************************
 * GRADES PAGE
 *************************/
function showGrades() {
  const main = document.getElementById("content");
  main.innerHTML = `<h1>Grades</h1>`;

  if (role === "teacher") {
    const lockBtn = document.createElement("button");
    lockBtn.textContent = gradesLocked ? "Unlock Grades" : "Lock Grades";
    lockBtn.onclick = () => {
      gradesLocked = !gradesLocked;
      saveLock();
      showGrades();
    };
    main.appendChild(lockBtn);

    Object.keys(users).forEach(username => {
      if (users[username].role !== "student") return;
      if (!grades[username]) grades[username] = [];

      const section = document.createElement("div");
      section.innerHTML = `<h3>${username}</h3>`;

      grades[username].forEach((g, i) => {
        const row = document.createElement("div");

        row.innerHTML = `
          <input value="${g.subject}" placeholder="Subject" />
          <input value="${g.score}" placeholder="Grade" />
          <input value="${g.comment || ""}" placeholder="Comment" />
        `;

        row.querySelectorAll("input")[0].oninput = e => { g.subject = e.target.value; saveGrades(); };
        row.querySelectorAll("input")[1].oninput = e => { g.score = e.target.value; saveGrades(); };
        row.querySelectorAll("input")[2].oninput = e => { g.comment = e.target.value; saveGrades(); };

        const del = document.createElement("button");
        del.textContent = "Delete";
        del.style.background = "red";
        del.onclick = () => {
          grades[username].splice(i, 1);
          saveGrades();
          showGrades();
        };

        row.appendChild(del);
        section.appendChild(row);
      });

      const addBtn = document.createElement("button");
      addBtn.textContent = "Add Grade";
      addBtn.onclick = () => {
        grades[username].push({ subject: "", score: "", comment: "" });
        saveGrades();
        showGrades();
      };

      section.appendChild(addBtn);
      main.appendChild(section);
    });

  } else {
    if (gradesLocked) {
      main.innerHTML += `<p>Grades are currently locked.</p>`;
      return;
    }

    const myGrades = grades[currentUser.username] || [];
    let total = 0, count = 0;

    myGrades.forEach(g => {
      main.innerHTML += `<div><b>${g.subject}</b>: ${g.score}<br><i>${g.comment || ""}</i></div>`;
      const n = parseFloat(g.score);
      if (!isNaN(n)) { total += n; count++; }
    });

    if (count) main.innerHTML += `<h3>Average: ${Math.round(total/count)}%</h3>`;

    const pdfBtn = document.createElement("button");
    pdfBtn.textContent = "Print Report Card";
    pdfBtn.onclick = () => window.print();
    main.appendChild(pdfBtn);
  }
}

/*************************
 * INIT
 *************************/
document.addEventListener("DOMContentLoaded", () => {
  if (!currentUser) return;
  renderPA();
  addNavButtons();
});
