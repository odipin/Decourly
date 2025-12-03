/* Simple Schoology-style demo app
   - Data stored in localStorage per username
   - Main features: courses, assignments, grades, discussions
*/

const $ = sel => document.querySelector(sel);
const storageKey = uname => `eduspace:${uname}`;

let state = {
  user: null,
  data: null, // {courses:[], assignments:[], discussions:[], grades:[]}
  view: 'dashboard'
};

/* ---------- Utilities ---------- */
function uid(prefix='id'){
  return prefix + Math.random().toString(36).slice(2,9);
}
function saveData(){
  if(!state.user) return;
  localStorage.setItem(storageKey(state.user), JSON.stringify(state.data));
}
function loadDataForUser(user){
  const raw = localStorage.getItem(storageKey(user));
  if(raw) return JSON.parse(raw);
  // default sample data
  return {
    courses: [
      {id: uid('course'), title: "Algebra I", desc: "Basic algebra", color:"#FFD8A8"},
      {id: uid('course'), title: "World History", desc: "Ancient to modern", color:"#BFEFFF"}
    ],
    assignments: [
      {id: uid('asg'), courseId: null, title:"Welcome Survey", due:"", done:false},
    ],
    grades: [
      // {id, courseId, assignmentId, score, max}
    ],
    discussions: [
      {id: uid('thread'), courseId: null, title:"Introduce yourself", messages:[
        {id:uid('msg'), author:"Teacher", text:"Welcome everyone!", ts:Date.now()}
      ]}
    ]
  };
}

/* ---------- Rendering ---------- */
function renderApp(){
  $('#display-name').textContent = state.user;
  // wire nav active
  document.querySelectorAll('.nav-btn').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.view === state.view);
  });

  const container = $('#view-container');
  container.innerHTML = '';
  if(state.view === 'dashboard') renderDashboard(container);
  else if(state.view === 'courses') renderCourses(container);
  else if(state.view === 'assignments') renderAssignments(container);
  else if(state.view === 'grades') renderGrades(container);
  else if(state.view === 'discussions') renderDiscussions(container);
  else if(state.view === 'resources') renderResources(container);
}

/* Dashboard: quick overview */
function renderDashboard(container){
  const el = document.createElement('div');
  el.innerHTML = `
    <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
      <h2>Dashboard</h2>
      <div class="muted">Overview of your courses and tasks</div>
    </div>
    <div class="section-grid">
      <div class="course-card">
        <h3>Courses (${state.data.courses.length})</h3>
        <div class="muted">${state.data.courses.map(c=>c.title).join(', ')}</div>
        <div style="margin-top:10px">
          <button id="add-course-btn-small">+ Add course</button>
        </div>
      </div>
      <div class="course-card">
        <h3>Today / Upcoming</h3>
        <div id="upcoming-list" class="muted">Loading...</div>
      </div>
      <div class="course-card">
        <h3>Discussions</h3>
        <div class="muted">${state.data.discussions.length} threads</div>
      </div>
    </div>
  `;
  container.appendChild(el);

  $('#add-course-btn-small').onclick = ()=> showAddCoursePrompt();
  // upcoming (simple list of assignments not done)
  const up = state.data.assignments.filter(a=>!a.done);
  $('#upcoming-list').textContent = up.length ? up.map(a=>a.title).slice(0,5).join(' • ') : 'No upcoming items!';
}

/* Courses */
function renderCourses(container){
  const el = document.createElement('div');
  el.innerHTML = `<h2>Courses</h2>
    <div style="margin:10px 0">
      <button id="add-course-btn">+ New course</button>
    </div>
    <div id="courses-grid" class="section-grid"></div>
  `;
  container.appendChild(el);

  const grid = $('#courses-grid');
  state.data.courses.forEach(c=>{
    const card = document.createElement('div');
    card.className = 'course-card';
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <h3>${escapeHtml(c.title)}</h3>
          <div class="muted">${escapeHtml(c.desc || '')}</div>
        </div>
        <div>
          <button data-id="${c.id}" class="open-course">Open</button>
          <button data-id="${c.id}" class="del-course ghost">Delete</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  document.querySelectorAll('.open-course').forEach(btn=>{
    btn.onclick = e=>{
      const id = e.target.dataset.id;
      // quick view: filter assignments & discussions by course
      renderCourseDetail(id);
    };
  });
  document.querySelectorAll('.del-course').forEach(btn=>{
    btn.onclick = e=>{
      const id = e.target.dataset.id;
      if(!confirm('Delete course? This will not remove assignments automatically.')) return;
      state.data.courses = state.data.courses.filter(x=>x.id!==id);
      saveData(); renderApp();
    };
  });

  $('#add-course-btn').onclick = ()=> showAddCoursePrompt();
}

/* Assignments */
function renderAssignments(container){
  const el = document.createElement('div');
  el.innerHTML = `<h2>Assignments</h2>
    <div style="margin:10px 0">
      <button id="add-asg-btn">+ New assignment</button>
    </div>
    <div class="table" id="assign-table"></div>
  `;
  container.appendChild(el);

  function buildTable(){
    const t = document.createElement('table');
    t.innerHTML = `<thead><tr><th>Title</th><th>Course</th><th>Due</th><th>Status</th><th></th></tr></thead>`;
    const tbody = document.createElement('tbody');
    state.data.assignments.forEach(asg=>{
      const tr = document.createElement('tr');
      const course = state.data.courses.find(c=>c.id===asg.courseId);
      tr.innerHTML = `
        <td>${escapeHtml(asg.title)}</td>
        <td>${course ? escapeHtml(course.title) : '<span class="muted">No course</span>'}</td>
        <td>${asg.due || '—'}</td>
        <td>${asg.done ? 'Done' : 'Open'}</td>
        <td>
          <button class="toggle-done" data-id="${asg.id}">${asg.done ? 'Undo' : 'Done'}</button>
          <button class="del-asg ghost" data-id="${asg.id}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    t.appendChild(tbody);
    return t;
  }

  $('#assign-table').appendChild(buildTable());

  document.querySelectorAll('.toggle-done').forEach(btn=>{
    btn.onclick = e=>{
      const id = e.target.dataset.id;
      const a = state.data.assignments.find(x=>x.id===id);
      a.done = !a.done; saveData(); renderApp();
    };
  });
  document.querySelectorAll('.del-asg').forEach(btn=>{
    btn.onclick = e=>{
      const id = e.target.dataset.id;
      state.data.assignments = state.data.assignments.filter(x=>x.id!==id);
      saveData(); renderApp();
    };
  });

  $('#add-asg-btn').onclick = ()=> showAddAssignmentPrompt();
}

/* Grades */
function renderGrades(container){
  const el = document.createElement('div');
  el.innerHTML = `<h2>Grades</h2>
    <div class="table" id="grades-table"></div>
    <div style="margin-top:12px">
      <button id="add-grade">+ Add grade</button>
    </div>
  `;
  container.appendChild(el);

  function build(){
    const div = document.createElement('div');
    if(state.data.grades.length === 0){
      div.innerHTML = `<div class="muted">No grades yet. Add some to see averages.</div>`;
      return div;
    }
    const tbl = document.createElement('table');
    tbl.innerHTML = `<thead><tr><th>Course</th><th>Assignment</th><th>Score</th><th></th></tr></thead>`;
    const tbody = document.createElement('tbody');
    state.data.grades.forEach(g=>{
      const course = state.data.courses.find(c=>c.id===g.courseId);
      const asg = state.data.assignments.find(a=>a.id===g.assignmentId);
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${course ? escapeHtml(course.title):'—'}</td>
        <td>${asg ? escapeHtml(asg.title):'—'}</td>
        <td>${g.score} / ${g.max} (${Math.round(g.score/g.max*100)}%)</td>
        <td><button class="del-grade ghost" data-id="${g.id}">Delete</button></td>`;
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    div.appendChild(tbl);

    // averages by course
    const summary = document.createElement('div');
    summary.style.marginTop = '10px';
    summary.innerHTML = `<strong>Course averages</strong>`;
    state.data.courses.forEach(c=>{
      const grades = state.data.grades.filter(g=>g.courseId===c.id);
      if(grades.length===0) return;
      const avg = Math.round(grades.reduce((s,g)=>s+(g.score/g.max),0)/grades.length*100);
      summary.innerHTML += `<div>${escapeHtml(c.title)} — ${avg}%</div>`;
    });
    div.appendChild(summary);
    return div;
  }

  $('#grades-table').appendChild(build());

  document.querySelectorAll('.del-grade').forEach(btn=>{
    btn.onclick = e=>{
      const id = e.target.dataset.id;
      state.data.grades = state.data.grades.filter(g=>g.id!==id);
      saveData(); renderApp();
    };
  });

  $('#add-grade').onclick = ()=> showAddGradePrompt();
}

/* Discussions */
function renderDiscussions(container){
  const el = document.createElement('div');
  el.innerHTML = `<h2>Discussions</h2>
    <div style="margin:10px 0"><button id="new-thread">+ New thread</button></div>
    <div id="threads-list"></div>
  `;
  container.appendChild(el);

  const list = $('#threads-list');
  state.data.discussions.forEach(t=>{
    const div = document.createElement('div');
    div.className = 'thread';
    const course = state.data.courses.find(c=>c.id===t.courseId);
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between">
        <div><strong>${escapeHtml(t.title)}</strong> ${course ? `<span class="muted"> — ${escapeHtml(course.title)}</span>`:''}</div>
        <div><button class="open-thread" data-id="${t.id}">Open</button></div>
      </div>
      <div class="muted small" style="margin-top:8px">${t.messages.length} messages</div>
    `;
    list.appendChild(div);
  });

  $('#new-thread').onclick = ()=> showNewThreadPrompt();
  document.querySelectorAll('.open-thread').forEach(btn=>{
    btn.onclick = e=> renderThreadDetail(e.target.dataset.id);
  });
}

/* Resources (static) */
function renderResources(container){
  const el = document.createElement('div');
  el.innerHTML = `<h2>Resources</h2>
    <div class="table"><div class="muted">This demo supports simple resources; integrate a file server or cloud storage to expand.</div></div>
  `;
  container.appendChild(el);
}

/* Course detail (modal-like view) */
function renderCourseDetail(courseId){
  const course = state.data.courses.find(c=>c.id===courseId);
  const container = $('#view-container');
  container.innerHTML = `<button id="back-to-courses" class="ghost">← Back</button>
    <h2>${escapeHtml(course.title)}</h2>
    <div style="display:flex;gap:12px;margin-top:8px">
      <div style="flex:1">
        <h3>Assignments</h3>
        <div id="course-assign-list"></div>
      </div>
      <div style="flex:1">
        <h3>Discussions</h3>
        <div id="course-disc-list"></div>
      </div>
    </div>
  `;
  $('#back-to-courses').onclick = ()=> { state.view='courses'; renderApp(); };

  const asgs = state.data.assignments.filter(a=>a.courseId===courseId);
  $('#course-assign-list').innerHTML = asgs.length ? asgs.map(a=>`<div class="muted">${escapeHtml(a.title)} — ${a.done ? 'Done':''}</div>`).join('') : '<div class="muted">No assignments</div>';

  const discs = state.data.discussions.filter(d=>d.courseId===courseId);
  $('#course-disc-list').innerHTML = discs.length ? discs.map(d=>`<div class="muted">${escapeHtml(d.title)}</div>`).join('') : '<div class="muted">No threads</div>';
}

/* Thread detail view */
function renderThreadDetail(threadId){
  const thread = state.data.discussions.find(t=>t.id===threadId);
  const container = $('#view-container');
  container.innerHTML = `<button id="back-to-disc" class="ghost">← Back</button>
    <h2>${escapeHtml(thread.title)}</h2>
    <div id="messages"></div>
    <div class="form-row" style="margin-top:12px">
      <input id="reply-text" placeholder="Write a reply..." />
      <button id="send-reply">Send</button>
    </div>
  `;
  $('#back-to-disc').onclick = ()=> { state.view='discussions'; renderApp(); };
  function redraw(){
    const messages = $('#messages');
    messages.innerHTML = thread.messages.map(m=>`<div style="margin-bottom:8px"><strong>${escapeHtml(m.author)}</strong> <span class="muted small">${new Date(m.ts).toLocaleString()}</span><div>${escapeHtml(m.text)}</div></div>`).join('');
  }
  redraw();
  $('#send-reply').onclick = ()=>{
    const txt = $('#reply-text').value.trim();
    if(!txt) return;
    thread.messages.push({id:uid('msg'), author: state.user, text: txt, ts: Date.now()});
    saveData(); $('#reply-text').value=''; redraw();
  };
}

/* ---------- Prompts (small modals via prompt()) ---------- */
function showAddCoursePrompt(){
  const title = prompt('Course title (e.g. Biology 1):');
  if(!title) return;
  const desc = prompt('Short description (optional):') || '';
  state.data.courses.push({id: uid('course'), title, desc});
  saveData(); renderApp();
}
function showAddAssignmentPrompt(){
  const title = prompt('Assignment title:');
  if(!title) return;
  const courseChoices = state.data.courses.map(c=>`${c.id}::${c.title}`).join('\n');
  const courseId = prompt('Enter course id (or leave blank for none):\n' + courseChoices) || null;
  const due = prompt('Due date (e.g. 2025-12-24) — optional') || '';
  state.data.assignments.push({id:uid('asg'), courseId: courseId && courseId.includes('::')?courseId.split('::')[0]:courseId, title, due, done:false});
  saveData(); renderApp();
}
function showAddGradePrompt(){
  if(state.data.courses.length===0){ alert('Add a course first'); return; }
  const courseChoices = state.data.courses.map(c=>`${c.id}::${c.title}`).join('\n');
  const courseSel = prompt('Course (paste id::title):\n' + courseChoices);
  if(!courseSel) return;
  const asgChoices = state.data.assignments.map(a=>`${a.id}::${a.title}`).join('\n');
  const asgSel = prompt('Assignment (optional) paste id::title or leave blank:\n' + asgChoices);
  const score = parseFloat(prompt('Score (number):')||'0');
  const max = parseFloat(prompt('Max score (number):')||'100');
  state.data.grades.push({id:uid('grade'), courseId: courseSel.split('::')[0], assignmentId: asgSel ? asgSel.split('::')[0] : null, score, max});
  saveData(); renderApp();
}
function showNewThreadPrompt(){
  const title = prompt('Thread title:');
  if(!title) return;
  const courseChoices = state.data.courses.map(c=>`${c.id}::${c.title}`).join('\n');
  const courseSel = prompt('Course (paste id::title) — optional:\n' + courseChoices) || null;
  const tid = uid('thread');
  state.data.discussions.push({id:tid, courseId: courseSel ? courseSel.split('::')[0] : null, title, messages: [{id:uid('msg'), author: state.user, text: 'Thread created', ts: Date.now()}]});
  saveData(); renderApp();
}

/* ---------- Auth ---------- */
function login(username){
  state.user = username;
  state.data = loadDataForUser(username);
  saveData(); // ensure key exists
  $('#login-screen').classList.add('hidden');
  $('#main-app').classList.remove('hidden');
  state.view = 'dashboard';
  renderApp();
}
function logout(){
  if(confirm('Log out?')) {
    state.user = null; state.data = null;
    $('#main-app').classList.add('hidden');
    $('#login-screen').classList.remove('hidden');
    $('#username').value = '';
    $('#password').value = '';
  }
}

/* ---------- Helpers ---------- */
function escapeHtml(s){ if(!s) return ''; return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

/* ---------- Wire up initial UI ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  $('#login-btn').onclick = ()=>{
    const u = $('#username').value.trim();
    if(!u){ alert('Enter a username (demo)'); return; }
    login(u);
  };
  $('#logout-btn').onclick = logout;

  document.querySelectorAll('.nav-btn').forEach(btn=>{
    btn.onclick = e=>{
      state.view = e.target.dataset.view;
      renderApp();
    };
  });

  $('#global-search').addEventListener('input', (e)=>{
    const q = e.target.value.trim().toLowerCase();
    if(!q) return;
    // simple search: courses, assignments, discussions
    const results = [];
    state.data.courses.forEach(c=>{ if(c.title.toLowerCase().includes(q)) results.push(`Course: ${c.title}`); });
    state.data.assignments.forEach(a=>{ if(a.title.toLowerCase().includes(q)) results.push(`Assignment: ${a.title}`); });
    state.data.discussions.forEach(d=>{ if(d.title.toLowerCase().includes(q)) results.push(`Thread: ${d.title}`); });
    alert(results.length ? 'Search results:\\n' + results.join('\\n') : 'No results');
    e.target.value = '';
  });

  // keyboard shortcut: L to add quick assignment (when logged in)
  document.addEventListener('keydown', (ev)=>{
    if(ev.key.toLowerCase()==='l' && state.user) showAddAssignmentPrompt();
  });
});
