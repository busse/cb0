(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const d of n)if(d.type==="childList")for(const r of d.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function a(n){const d={};return n.integrity&&(d.integrity=n.integrity),n.referrerPolicy&&(d.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?d.credentials="include":n.crossOrigin==="anonymous"?d.credentials="omit":d.credentials="same-origin",d}function i(n){if(n.ep)return;n.ep=!0;const d=a(n);fetch(n.href,d)}})();const l={ideas:[],stories:[],sprints:[],updates:[],figures:[]},x=new Map;async function M(){const t=await window.electronAPI.readIdeas();if(!t.success||!t.data)throw new Error(t.error||"Failed to load ideas");l.ideas=t.data}async function P(){const t=await window.electronAPI.readStories();if(!t.success||!t.data)throw new Error(t.error||"Failed to load stories");l.stories=t.data}async function B(){const t=await window.electronAPI.readSprints();if(!t.success||!t.data)throw new Error(t.error||"Failed to load sprints");l.sprints=t.data}async function O(){const t=await window.electronAPI.readUpdates();if(!t.success||!t.data)throw new Error(t.error||"Failed to load updates");l.updates=t.data}async function j(){const t=await window.electronAPI.readFigures();if(!t.success||!t.data)throw new Error(t.error||"Failed to load figures");l.figures=t.data}async function z(){l.ideas.length||await M()}async function ne(){l.stories.length||await P()}async function re(){l.sprints.length||await B()}async function oe(){l.figures.length||await j()}async function ce(t,e){const a=await window.electronAPI.writeIdea(t,e);if(!a.success)throw new Error(a.error||"Unable to save idea")}async function ue(t,e){const a=await window.electronAPI.writeStory(t,e);if(!a.success)throw new Error(a.error||"Unable to save story")}async function me(t,e){const a=await window.electronAPI.writeSprint(t,e);if(!a.success)throw new Error(a.error||"Unable to save sprint")}async function be(t,e){const a=await window.electronAPI.writeUpdate(t,e);if(!a.success)throw new Error(a.error||"Unable to save update")}async function pe(t,e){const a=await window.electronAPI.writeFigure(t,e);if(!a.success)throw new Error(a.error||"Unable to save figure")}async function ve(t){const e=await window.electronAPI.deleteIdea(t);if(!e.success)throw new Error(e.error||"Unable to delete idea")}async function fe(t,e){const a=await window.electronAPI.deleteStory(t,e);if(!a.success)throw new Error(a.error||"Unable to delete story")}async function ge(t){const e=await window.electronAPI.deleteSprint(t);if(!e.success)throw new Error(e.error||"Unable to delete sprint")}async function ye(t,e,a){const i=await window.electronAPI.deleteUpdate(t,e,a);if(!i.success)throw new Error(i.error||"Unable to delete update")}async function we(t){const e=await window.electronAPI.deleteFigure(t);if(!e.success)throw new Error(e.error||"Unable to delete figure")}async function _e(){const t=await window.electronAPI.getNextIdeaNumber();if(!t.success||t.data===void 0)throw new Error(t.error||"Unable to determine next idea number");return t.data}async function J(t){const e=await window.electronAPI.getNextStoryNumber(t);if(!e.success||e.data===void 0)throw new Error(e.error||"Unable to determine next story number");return e.data}async function $e(){const t=await window.electronAPI.getNextFigureNumber();if(!t.success||t.data===void 0)throw new Error(t.error||"Unable to determine next figure number");return t.data}async function he(){const t=await window.electronAPI.selectFigureImage();if(!t.success||!t.data)throw new Error(t.error||"Unable to select image");return t.data}async function Se(t,e){const a=await window.electronAPI.copyFigureImage(t,e);if(!a.success||!a.data)throw new Error(a.error||"Unable to copy image");return a.data}async function R(t){if(!t)return;if(x.has(t))return x.get(t);if(/^(https?:|file:|data:)/i.test(t))return x.set(t,t),t;const e=await window.electronAPI.getFigureImage(t);if(e.success&&e.data)return x.set(t,e.data),e.data}function Q(){x.clear()}function m(t){const e=document.createElement("div");return e.textContent=t??"",e.innerHTML}function b(t){return(t??"").replace(/"/g,"&quot;")}function se(t){return t?t.split(",").map(e=>e.trim()).filter(Boolean):[]}function Ne(t){return t?t.split(/\r?\n/).map(e=>e.trim()).filter(Boolean):[]}function N(){return new Date().toISOString().slice(0,10)}function H(t,e,a){return t&&e!==void 0&&a!==void 0?`${t}.${e}.${a}`:e!==void 0&&a!==void 0?`${e}.${a}`:e!==void 0?`i${e}`:a!==void 0?`s${a}`:""}function de(t){return`fig_${t}`}function V(){const t=document.getElementById("ideas-list");if(t){if(l.ideas.length===0){t.innerHTML='<div class="loading">No ideas yet. Create one to get started.</div>';return}t.innerHTML=l.ideas.map(e=>`
        <div class="item-card">
          <div class="item-header">
            <span class="item-title">${m(e.title||"Untitled")}</span>
            <span class="item-badge">i${e.idea_number}</span>
          </div>
          <div class="item-description">${m(e.description||"")}</div>
          <div class="item-meta">
            <span>Status: ${e.status}</span>
            <span>Created: ${e.created}</span>
            ${e.tags&&e.tags.length?`<span>Tags: ${e.tags.join(", ")}</span>`:""}
          </div>
          <div class="item-actions">
            <button class="btn btn-secondary" type="button" data-action="edit-idea" data-idea="${e.idea_number}">Edit</button>
            <button class="btn btn-danger" type="button" data-action="delete-idea" data-idea="${e.idea_number}">Delete</button>
          </div>
        </div>
      `).join("")}}function Y(){const t=document.getElementById("stories-list");if(t){if(l.stories.length===0){t.innerHTML='<div class="loading">No stories yet. Create one to get started.</div>';return}t.innerHTML=l.stories.map(e=>`
        <div class="item-card">
          <div class="item-header">
            <span class="item-title">${m(e.title||"Untitled")}</span>
            <span class="item-badge">${e.idea_number}.${e.story_number}</span>
          </div>
          <div class="item-description">${m(e.description||"")}</div>
          <div class="item-meta">
            <span>Status: ${e.status}</span>
            <span>Priority: ${e.priority}</span>
            ${e.assigned_sprint?`<span>Sprint: ${e.assigned_sprint}</span>`:""}
          </div>
          <div class="item-actions">
            <button class="btn btn-secondary" type="button" data-action="edit-story" data-idea="${e.idea_number}" data-story="${e.story_number}">Edit</button>
            <button class="btn btn-danger" type="button" data-action="delete-story" data-idea="${e.idea_number}" data-story="${e.story_number}">Delete</button>
          </div>
        </div>
      `).join("")}}function G(){const t=document.getElementById("sprints-list");if(t){if(l.sprints.length===0){t.innerHTML='<div class="loading">No sprints yet. Create one to get started.</div>';return}t.innerHTML=l.sprints.map(e=>`
        <div class="item-card">
          <div class="item-header">
            <span class="item-title">Sprint ${e.sprint_id}</span>
            <span class="item-badge">${e.sprint_id}</span>
          </div>
          <div class="item-description">
            ${e.start_date} – ${e.end_date}
          </div>
          <div class="item-meta">
            <span>Status: ${e.status}</span>
            <span>Year: ${e.year}</span>
            <span>Sprint #${e.sprint_number}</span>
          </div>
          <div class="item-actions">
            <button class="btn btn-secondary" type="button" data-action="edit-sprint" data-sprint="${e.sprint_id}">Edit</button>
            <button class="btn btn-danger" type="button" data-action="delete-sprint" data-sprint="${e.sprint_id}">Delete</button>
          </div>
        </div>
      `).join("")}}function K(){const t=document.getElementById("updates-list");if(t){if(l.updates.length===0){t.innerHTML='<div class="loading">No updates yet. Create one to get started.</div>';return}t.innerHTML=l.updates.map(e=>`
        <div class="item-card">
          <div class="item-header">
            <span class="item-title">Update ${e.notation}</span>
            <span class="item-badge">${e.notation}</span>
          </div>
          <div class="item-meta">
            <span>Type: ${e.type}</span>
            <span>Date: ${e.date}</span>
          </div>
          <div class="item-actions">
            <button class="btn btn-secondary" type="button" data-action="edit-update" data-sprint="${e.sprint_id}" data-idea="${e.idea_number}" data-story="${e.story_number}">Edit</button>
            <button class="btn btn-danger" type="button" data-action="delete-update" data-sprint="${e.sprint_id}" data-idea="${e.idea_number}" data-story="${e.story_number}">Delete</button>
          </div>
        </div>
      `).join("")}}async function W(){const t=document.getElementById("figures-list");if(!t)return;if(l.figures.length===0){t.innerHTML='<div class="loading">No figures yet. Add one to document your work.</div>';return}const e=await Promise.all(l.figures.map(async a=>({figure:a,imageSrc:a.image_path?await R(a.image_path):void 0})));t.innerHTML=e.map(({figure:a,imageSrc:i})=>{var s,o;const n=((s=a.related_ideas)==null?void 0:s.length)??0,d=((o=a.related_stories)==null?void 0:o.length)??0,r=[n?`${n} ${n===1?"idea":"ideas"}`:"",d?`${d} ${d===1?"story":"stories"}`:""].filter(Boolean).join(" • ");return`
        <div class="item-card">
          <div class="item-header">
            <span class="item-title">${m(a.title||"Untitled figure")}</span>
            <span class="item-badge">${de(a.figure_number)}</span>
          </div>
          <div class="figure-card__preview">
            ${i?`<img src="${b(i)}" alt="${b(a.alt_text||a.title||"Figure preview")}" />`:'<div class="helper-text">No image selected</div>'}
          </div>
          <div class="item-description">${m(a.description||"")}</div>
          <div class="item-meta">
            <span>Status: ${a.status}</span>
            <span>Created: ${a.created}</span>
            ${r?`<span>${r}</span>`:""}
          </div>
          <div class="item-actions">
            <button class="btn btn-secondary" type="button" data-action="edit-figure" data-figure="${a.figure_number}">Edit</button>
            <button class="btn btn-danger" type="button" data-action="delete-figure" data-figure="${a.figure_number}">Delete</button>
          </div>
        </div>
      `}).join("")}const Ee=["planned","active","completed","archived"],Ie=["backlog","planned","in-progress","done"],xe=["low","medium","high","critical"],Te=["planned","active","completed"],Fe=["progress","completion","blocker","note"],Le=["active","archived"],X=document.getElementById("toast-container"),L=document.getElementById("error-message");function g(t,e="success"){if(!X)return;const a=document.createElement("div");a.className=`toast toast--${e}`,a.textContent=t,X.appendChild(a),setTimeout(()=>{a.remove()},4e3)}function u(t){L&&(L.textContent=t,L.style.display="block",setTimeout(()=>{L.style.display="none"},5e3)),g(t,"error")}let v=null,C=null,f=null,k=null,q=null,A=null;function qe(){if(v=document.getElementById("modal"),C=(v==null?void 0:v.querySelector(".modal__dialog"))??null,f=document.getElementById("modal-form"),k=document.getElementById("modal-title"),q=document.getElementById("modal-close"),!v||!C||!f||!k)throw new Error("Modal DOM structure not found");q==null||q.addEventListener("click",T),v.addEventListener("click",t=>{t.target===v&&T()}),document.addEventListener("keydown",t=>{t.key==="Escape"&&!(v!=null&&v.classList.contains("hidden"))&&T()}),f.addEventListener("submit",async t=>{if(t.preventDefault(),!A||!f)return;const e=f.querySelector('button[type="submit"]');e&&(e.disabled=!0,e.textContent="Saving…");try{await A(new FormData(f),f)!==!1&&T()}catch(a){u(a.message)}finally{e&&(e.disabled=!1,e.textContent=e.dataset.defaultText||"Save")}})}function F(t){var e,a;if(!v||!C||!f||!k)throw new Error("Modal handlers not initialized");C.dataset.size=t.width??"md",k.textContent=t.title,f.innerHTML=`
    ${t.body}
    <div class="modal__actions">
      <button type="button" class="btn btn-secondary" data-modal-cancel>Cancel</button>
      <button type="submit" class="btn btn-primary" data-default-text="${t.submitLabel??"Save"}">${t.submitLabel??"Save"}</button>
    </div>
  `,(e=f.querySelector("[data-modal-cancel]"))==null||e.addEventListener("click",T),A=t.onSubmit,v.classList.remove("hidden"),(a=t.onOpen)==null||a.call(t,f)}function T(){!v||!f||(v.classList.add("hidden"),f.reset(),f.innerHTML="",A=null)}async function Z(t,e){var n;if(t==="edit"&&!e){u("Unable to find that idea.");return}let a=e==null?void 0:e.idea_number;if(a===void 0)try{a=await _e()}catch(d){u(d.message);return}const i={title:(e==null?void 0:e.title)??"",description:(e==null?void 0:e.description)??"",status:(e==null?void 0:e.status)??"planned",created:(e==null?void 0:e.created)??N(),tags:((n=e==null?void 0:e.tags)==null?void 0:n.join(", "))??"",body:(e==null?void 0:e.body)??""};F({title:t==="create"?"Create Idea":`Edit Idea i${e==null?void 0:e.idea_number}`,width:"lg",submitLabel:t==="create"?"Create Idea":"Save Changes",body:`
      <div class="form-grid">
        <div class="form-field">
          <label>Idea Number</label>
          <input type="number" name="idea_number" value="${a}" ${t==="edit"?"readonly":'min="0"'} required />
        </div>
        <div class="form-field">
          <label>Status</label>
          <select name="status" required>
            ${Ee.map(d=>`<option value="${d}" ${d===i.status?"selected":""}>${d}</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label>Created</label>
          <input type="date" name="created" value="${i.created}" required />
        </div>
        <div class="form-field">
          <label>Tags (comma separated)</label>
          <input type="text" name="tags" value="${b(i.tags)}" placeholder="meta, design" />
        </div>
      </div>
      <div class="form-field">
        <label>Title</label>
        <input type="text" name="title" value="${b(i.title)}" placeholder="Idea title" required />
      </div>
      <div class="form-field">
        <label>Description</label>
        <textarea name="description" required placeholder="Describe the intent">${m(i.description)}</textarea>
      </div>
      <div class="form-field">
        <label>Body (Markdown)</label>
        <textarea name="body" placeholder="Additional markdown content">${m(i.body)}</textarea>
      </div>
    `,onSubmit:async d=>{const r={layout:"idea",idea_number:Number(d.get("idea_number")),title:d.get("title").trim(),description:d.get("description").trim(),status:d.get("status"),created:d.get("created"),tags:se(d.get("tags"))},s=d.get("body")??"";return await ce(r,s),await M(),V(),g(t==="create"?"Idea created":"Idea updated"),!0}})}async function D(t,e){if(t==="edit"&&!e){u("Unable to find that story.");return}await z(),await re();const a=l.ideas;if(!a.length){u("Create an idea before adding stories.");return}const i=(e==null?void 0:e.idea_number)??a[0].idea_number;let n=e==null?void 0:e.story_number;if(n===void 0)try{n=await J(i)}catch(r){u(r.message);return}const d={title:(e==null?void 0:e.title)??"",description:(e==null?void 0:e.description)??"",status:(e==null?void 0:e.status)??"backlog",priority:(e==null?void 0:e.priority)??"medium",created:(e==null?void 0:e.created)??N(),assigned_sprint:(e==null?void 0:e.assigned_sprint)??"",body:(e==null?void 0:e.body)??""};F({title:t==="create"?"Create Story":`Edit Story ${e==null?void 0:e.idea_number}.${e==null?void 0:e.story_number}`,width:"lg",submitLabel:t==="create"?"Create Story":"Save Changes",body:`
      <div class="form-grid">
        <div class="form-field">
          <label>Idea</label>
          <select name="idea_number" required>
            ${a.map(r=>`<option value="${r.idea_number}" ${r.idea_number===i?"selected":""}>i${r.idea_number} — ${m(r.title)}</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label>Story Number</label>
          <input type="number" name="story_number" min="0" value="${n}" ${t==="edit"?"readonly":""} required />
        </div>
        <div class="form-field">
          <label>Status</label>
          <select name="status" required>
            ${Ie.map(r=>`<option value="${r}" ${r===d.status?"selected":""}>${r}</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label>Priority</label>
          <select name="priority" required>
            ${xe.map(r=>`<option value="${r}" ${r===d.priority?"selected":""}>${r}</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label>Created</label>
          <input type="date" name="created" value="${d.created}" required />
        </div>
        <div class="form-field">
          <label>Assigned Sprint</label>
          <select name="assigned_sprint">
            <option value="">Backlog</option>
            ${l.sprints.map(r=>`<option value="${r.sprint_id}" ${r.sprint_id===d.assigned_sprint?"selected":""}>${r.sprint_id} (${r.start_date} → ${r.end_date})</option>`).join("")}
          </select>
          <div class="helper-text">Leave blank to keep in backlog.</div>
        </div>
      </div>
      <div class="form-field">
        <label>Title</label>
        <input type="text" name="title" value="${b(d.title)}" required />
      </div>
      <div class="form-field">
        <label>Description</label>
        <textarea name="description" required placeholder="As a … I want … so that …">${m(d.description)}</textarea>
      </div>
      <div class="form-field">
        <label>Body (Markdown)</label>
        <textarea name="body">${m(d.body)}</textarea>
      </div>
    `,onOpen:r=>{if(t==="create"){const s=r.querySelector('select[name="idea_number"]'),o=r.querySelector('input[name="story_number"]');s==null||s.addEventListener("change",async()=>{if(o){o.value="…";try{const c=await J(Number(s.value));o.value=c.toString()}catch(c){u(c.message),o.value=""}}})}},onSubmit:async r=>{const s=r.get("assigned_sprint")||"",o={layout:"story",idea_number:Number(r.get("idea_number")),story_number:Number(r.get("story_number")),title:r.get("title").trim(),description:r.get("description").trim(),status:r.get("status"),priority:r.get("priority"),created:r.get("created"),assigned_sprint:s||void 0},c=r.get("body")??"";return await ue(o,c),await P(),Y(),g(t==="create"?"Story created":"Story updated"),!0}})}async function ee(t,e){var i;if(t==="edit"&&!e){u("Unable to find that sprint.");return}const a={sprint_id:(e==null?void 0:e.sprint_id)??"",year:(e==null?void 0:e.year)??new Date().getFullYear(),sprint_number:(e==null?void 0:e.sprint_number)??1,status:(e==null?void 0:e.status)??"planned",start_date:(e==null?void 0:e.start_date)??N(),end_date:(e==null?void 0:e.end_date)??N(),goals:((i=e==null?void 0:e.goals)==null?void 0:i.join(`
`))??"",body:(e==null?void 0:e.body)??""};F({title:t==="create"?"Create Sprint":`Edit Sprint ${e==null?void 0:e.sprint_id}`,width:"lg",submitLabel:t==="create"?"Create Sprint":"Save Changes",body:`
      <div class="form-grid">
        <div class="form-field">
          <label>Sprint ID (YYSS)</label>
          <input type="text" name="sprint_id" value="${b(a.sprint_id)}" pattern="\\d{4}" required />
        </div>
        <div class="form-field">
          <label>Year</label>
          <input type="number" name="year" value="${a.year}" min="2000" max="2100" required />
        </div>
        <div class="form-field">
          <label>Sprint Number (1-26)</label>
          <input type="number" name="sprint_number" value="${a.sprint_number}" min="1" max="26" required />
        </div>
        <div class="form-field">
          <label>Status</label>
          <select name="status" required>
            ${Te.map(n=>`<option value="${n}" ${n===a.status?"selected":""}>${n}</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label>Start Date</label>
          <input type="date" name="start_date" value="${a.start_date}" required />
        </div>
        <div class="form-field">
          <label>End Date</label>
          <input type="date" name="end_date" value="${a.end_date}" required />
        </div>
      </div>
      <div class="form-field">
        <label>Goals (one per line)</label>
        <textarea name="goals" rows="4">${m(a.goals)}</textarea>
      </div>
      <div class="form-field">
        <label>Body (Markdown)</label>
        <textarea name="body" rows="6">${m(a.body)}</textarea>
      </div>
    `,onSubmit:async n=>{const d={layout:"sprint",sprint_id:n.get("sprint_id").trim(),year:Number(n.get("year")),sprint_number:Number(n.get("sprint_number")),status:n.get("status"),start_date:n.get("start_date"),end_date:n.get("end_date"),goals:Ne(n.get("goals"))},r=n.get("body")??"";return await me(d,r),await B(),G(),g(t==="create"?"Sprint created":"Sprint updated"),!0}})}function te(t,e){const a=l.stories.filter(i=>i.idea_number===t);return a.length?a.map(i=>`
        <option value="${i.story_number}" ${i.story_number===e?"selected":""}>${i.idea_number}.${i.story_number} — ${m(i.title)}</option>
      `).join(""):'<option value="">No stories available</option>'}async function ae(t,e){if(t==="edit"&&!e){u("Unable to find that update.");return}if(await re(),await z(),await ne(),!l.sprints.length){u("Create a sprint before adding updates.");return}if(!l.stories.length){u("Create a story before adding updates.");return}const a={sprint_id:(e==null?void 0:e.sprint_id)??l.sprints[0].sprint_id,idea_number:(e==null?void 0:e.idea_number)??l.stories[0].idea_number,story_number:(e==null?void 0:e.story_number)??l.stories[0].story_number,type:(e==null?void 0:e.type)??"progress",date:(e==null?void 0:e.date)??N(),body:(e==null?void 0:e.body)??""};F({title:t==="create"?"Create Update":`Edit Update ${e==null?void 0:e.notation}`,width:"lg",submitLabel:t==="create"?"Create Update":"Save Changes",body:`
      <div class="form-grid">
        <div class="form-field">
          <label>Sprint</label>
          <select name="sprint_id" required>
            ${l.sprints.map(i=>`<option value="${i.sprint_id}" ${i.sprint_id===a.sprint_id?"selected":""}>${i.sprint_id} (${i.start_date} → ${i.end_date})</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label>Idea</label>
          <select name="idea_number" required>
            ${l.ideas.map(i=>`<option value="${i.idea_number}" ${i.idea_number===a.idea_number?"selected":""}>i${i.idea_number} — ${m(i.title)}</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label>Story</label>
          <select name="story_number" required data-story-select>
            ${te(a.idea_number,a.story_number)}
          </select>
        </div>
        <div class="form-field">
          <label>Type</label>
          <select name="type" required>
            ${Fe.map(i=>`<option value="${i}" ${i===a.type?"selected":""}>${i}</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label>Date</label>
          <input type="date" name="date" value="${a.date}" required />
        </div>
      </div>
      <div class="form-field">
        <label>Notation</label>
        <input type="text" name="notation" value="${H(a.sprint_id,a.idea_number,a.story_number)}" readonly data-notation />
      </div>
      <div class="form-field">
        <label>Body (Markdown)</label>
        <textarea name="body">${m(a.body)}</textarea>
      </div>
    `,onOpen:i=>{const n=i.querySelector('select[name="sprint_id"]'),d=i.querySelector('select[name="idea_number"]'),r=i.querySelector('select[name="story_number"]'),s=i.querySelector("input[data-notation]"),o=w=>{if(!d||!r)return;const p=Number(d.value),_=w?Number(r.value):void 0;if(r.innerHTML=te(p,_),!w){const y=r.querySelector("option");y&&(r.value=y.value)}},c=()=>{!s||!n||!d||!r||(s.value=H(n.value,Number(d.value),Number(r.value)))};d==null||d.addEventListener("change",()=>{o(!1),c()}),n==null||n.addEventListener("change",c),r==null||r.addEventListener("change",c),o(!0),c()},onSubmit:async i=>{const n=i.get("sprint_id"),d=i.get("idea_number"),r=i.get("story_number");if(!d)throw new Error("Select an idea for this update.");if(!r)throw new Error("Select a story for this update.");const s=Number(d),o=Number(r),c={layout:"update",sprint_id:n,idea_number:s,story_number:o,type:i.get("type"),date:i.get("date"),notation:H(n,s,o)},w=i.get("body")??"";return await be(c,w),await O(),K(),g(t==="create"?"Update created":"Update updated"),!0}})}async function ie(t,e){var r;if(t==="edit"&&!e){u("Unable to find that figure.");return}await Promise.all([z(),ne(),oe()]);const a=(e==null?void 0:e.figure_number)??await $e().catch(s=>{u(s.message)});if(a===void 0)return;const i={title:(e==null?void 0:e.title)??"",description:(e==null?void 0:e.description)??"",image_path:(e==null?void 0:e.image_path)??"",alt_text:(e==null?void 0:e.alt_text)??"",status:(e==null?void 0:e.status)??"active",created:(e==null?void 0:e.created)??N(),uploaded_date:(e==null?void 0:e.uploaded_date)??"",file_type:(e==null?void 0:e.file_type)??"",dimensions:(e==null?void 0:e.dimensions)??"",file_size:(e==null?void 0:e.file_size)??"",tags:((r=e==null?void 0:e.tags)==null?void 0:r.join(", "))??"",body:(e==null?void 0:e.body)??""},n=new Set((e==null?void 0:e.related_ideas)??[]),d=new Set((e==null?void 0:e.related_stories)??[]);F({title:t==="create"?"Create Figure":`Edit ${de(e.figure_number)}`,width:"lg",submitLabel:t==="create"?"Create Figure":"Save Changes",body:`
      <div class="form-grid">
        <div class="form-field">
          <label>Figure Number</label>
          <input type="number" name="figure_number" value="${a}" ${t==="edit"?"readonly":'min="0"'} required />
        </div>
        <div class="form-field">
          <label>Status</label>
          <select name="status" required>
            ${Le.map(s=>`<option value="${s}" ${s===i.status?"selected":""}>${s}</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label>Created</label>
          <input type="date" name="created" value="${i.created}" required />
        </div>
        <div class="form-field">
          <label>Uploaded Date</label>
          <input type="date" name="uploaded_date" value="${i.uploaded_date}" />
        </div>
      </div>
      <div class="form-field">
        <label>Title</label>
        <input type="text" name="title" value="${b(i.title)}" required />
      </div>
      <div class="form-field">
        <label>Description</label>
        <textarea name="description" placeholder="Describe the figure">${m(i.description)}</textarea>
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label>Image Path</label>
          <div class="figure-input-group">
            <input type="text" name="image_path" value="${b(i.image_path)}" required data-image-path />
            <button type="button" class="btn btn-secondary" data-image-browse>Select</button>
          </div>
          <div class="helper-text">Images are copied to /assets/figures/</div>
        </div>
        <div class="form-field">
          <label>Alt Text</label>
          <input type="text" name="alt_text" value="${b(i.alt_text)}" />
        </div>
      </div>
      <div class="figure-preview" data-figure-preview>
        ${i.image_path?`<img src="${b(i.image_path)}" alt="${b(i.alt_text||i.title||"Figure preview")}" />`:'<div class="helper-text">No image selected</div>'}
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label>File Type</label>
          <input type="text" name="file_type" value="${b(i.file_type)}" placeholder="png" />
        </div>
        <div class="form-field">
          <label>File Size</label>
          <input type="text" name="file_size" value="${b(i.file_size)}" placeholder="245KB" />
        </div>
        <div class="form-field">
          <label>Dimensions</label>
          <input type="text" name="dimensions" value="${b(i.dimensions)}" placeholder="1920x1080" />
        </div>
      </div>
      <div class="form-field">
        <label>Tags (comma separated)</label>
        <input type="text" name="tags" value="${b(i.tags)}" />
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label>Related Ideas</label>
          <select name="related_ideas" multiple size="5">
            ${l.ideas.map(s=>`<option value="${s.idea_number}" ${n.has(s.idea_number)?"selected":""}>i${s.idea_number} — ${m(s.title)}</option>`).join("")}
          </select>
          <div class="helper-text">Hold Cmd/Ctrl to select multiple ideas.</div>
        </div>
        <div class="form-field">
          <label>Related Stories</label>
          <select name="related_stories" multiple size="6">
            ${l.stories.map(s=>{const o=`${s.idea_number}.${s.story_number}`;return`<option value="${o}" ${d.has(o)?"selected":""}>${o} — ${m(s.title)}</option>`}).join("")}
          </select>
          <div class="helper-text">Format: idea.story (e.g., 5.2). Hold Cmd/Ctrl to select.</div>
        </div>
      </div>
      <div class="form-field">
        <label>Body (Markdown)</label>
        <textarea name="body">${m(i.body)}</textarea>
      </div>
    `,onOpen:s=>{const o=s.querySelector("[data-image-browse]"),c=s.querySelector('input[name="image_path"]'),w=s.querySelector('input[name="figure_number"]'),p=s.querySelector('input[name="alt_text"]');o==null||o.addEventListener("click",async()=>{if(!c||!w)return;const _=Number(w.value);if(Number.isNaN(_)){u("Enter a figure number before selecting an image.");return}try{const y=await he();if(y.canceled||!y.path)return;const $=await Se(y.path,_);Q(),c.value=$.relativePath;const S=s.querySelector('input[name="file_type"]');S&&!S.value&&(S.value=$.fileType);const E=s.querySelector('input[name="file_size"]');E&&(E.value=$.fileSize);const I=await R($.relativePath);U(s,$.relativePath,(p==null?void 0:p.value)||i.alt_text,I)}catch(y){u(y.message)}}),c==null||c.addEventListener("change",()=>{U(s,c.value,(p==null?void 0:p.value)||i.alt_text)}),p==null||p.addEventListener("input",()=>{c&&U(s,c.value,p.value||i.alt_text)}),U(s,i.image_path,i.alt_text)},onSubmit:async s=>{var S,E;const o=Number(s.get("figure_number"));if(Number.isNaN(o))throw new Error("Figure number is invalid.");const c=(S=s.get("image_path"))==null?void 0:S.trim();if(!c)throw new Error("Select an image for this figure.");const p=s.getAll("related_ideas").map(I=>Number(I)).filter(I=>!Number.isNaN(I)),_=s.getAll("related_stories").filter(Boolean),y={layout:"figure",figure_number:o,title:s.get("title").trim(),description:((E=s.get("description"))==null?void 0:E.trim())||void 0,image_path:c,alt_text:(s.get("alt_text")||"").trim()||void 0,status:s.get("status"),created:s.get("created"),uploaded_date:(s.get("uploaded_date")||"").trim()||void 0,file_type:(s.get("file_type")||"").trim()||void 0,file_size:(s.get("file_size")||"").trim()||void 0,dimensions:(s.get("dimensions")||"").trim()||void 0,tags:se(s.get("tags")),related_ideas:p.length?p:void 0,related_stories:_.length?_:void 0},$=s.get("body")??"";return await pe(y,$),Q(),await j(),await W(),g(t==="create"?"Figure created":"Figure updated"),!0}})}async function U(t,e,a,i){const n=t.querySelector("[data-figure-preview]");if(!n)return;if(!e&&!i){n.innerHTML='<div class="helper-text">No image selected</div>';return}const d=i??(e?await R(e):void 0);if(!d){n.innerHTML='<div class="helper-text">Image not found</div>';return}n.innerHTML=`<img src="${b(d)}" alt="${b(a||"Figure preview")}" />`}async function Ue(t){if(!t)return;const e=Number(t);if(!Number.isNaN(e)&&confirm(`Delete Idea i${t}? This cannot be undone.`))try{await ve(e),await M(),V(),g("Idea deleted")}catch(a){u(a.message)}}async function Ce(t,e){if(!t||!e)return;const a=Number(t),i=Number(e);if(!(Number.isNaN(a)||Number.isNaN(i))&&confirm(`Delete Story ${a}.${i}? This cannot be undone.`))try{await fe(a,i),await P(),Y(),g("Story deleted")}catch(n){u(n.message)}}async function ke(t){if(t&&confirm(`Delete Sprint ${t}? This cannot be undone.`))try{await ge(t),await B(),G(),g("Sprint deleted")}catch(e){u(e.message)}}async function Ae(t,e,a){if(!t||!e||!a)return;const i=Number(e),n=Number(a);if(!(Number.isNaN(i)||Number.isNaN(n))&&confirm(`Delete Update ${t}.${i}.${n}? This cannot be undone.`))try{await ye(t,i,n),await O(),K(),g("Update deleted")}catch(d){u(d.message)}}async function Me(t){if(!t)return;const e=Number(t);if(!Number.isNaN(e)&&confirm(`Delete Figure ${t}? This cannot be undone.`))try{await we(e),await j(),await W(),g("Figure deleted")}catch(a){u(a.message)}}function Pe(t){const e=Number(t.dataset.idea);if(!Number.isNaN(e))return l.ideas.find(a=>a.idea_number===e)}function Be(t){const e=Number(t.dataset.idea),a=Number(t.dataset.story);if(!(Number.isNaN(e)||Number.isNaN(a)))return l.stories.find(i=>i.idea_number===e&&i.story_number===a)}function je(t){const e=t.dataset.sprint;if(e)return l.sprints.find(a=>a.sprint_id===e)}function He(t){const e=t.dataset.sprint,a=Number(t.dataset.idea),i=Number(t.dataset.story);if(!(!e||Number.isNaN(a)||Number.isNaN(i)))return l.updates.find(n=>n.sprint_id===e&&n.idea_number===a&&n.story_number===i)}function Oe(t){const e=Number(t.dataset.figure);if(!Number.isNaN(e))return l.figures.find(a=>a.figure_number===e)}const le=document.querySelectorAll(".tab"),ze=document.querySelectorAll(".panel");function Re(){le.forEach(t=>{t.addEventListener("click",()=>{const e=t.dataset.tab;e&&Ve(e)})})}function Ve(t){le.forEach(e=>{e.classList.toggle("active",e.dataset.tab===t)}),ze.forEach(e=>{e.classList.toggle("active",e.id===`${t}-panel`)}),h(t)}async function h(t){Ye(t);try{switch(t){case"ideas":await M(),V();break;case"stories":await P(),Y();break;case"sprints":await B(),G();break;case"updates":await O(),K();break;case"figures":await j(),await W();break}}catch(e){u(e.message)}}function Ye(t){const e=document.getElementById(`${t}-list`);e&&(e.innerHTML='<div class="loading">Loading…</div>')}function Ge(t){const e=t.target,a=e.dataset.action;if(a)switch(t.preventDefault(),a){case"new-idea":Z("create");break;case"edit-idea":Z("edit",Pe(e));break;case"delete-idea":Ue(e.dataset.idea);break;case"refresh-ideas":h("ideas");break;case"new-story":D("create");break;case"edit-story":D("edit",Be(e));break;case"delete-story":Ce(e.dataset.idea,e.dataset.story);break;case"refresh-stories":h("stories");break;case"new-sprint":ee("create");break;case"edit-sprint":ee("edit",je(e));break;case"delete-sprint":ke(e.dataset.sprint);break;case"refresh-sprints":h("sprints");break;case"new-update":ae("create");break;case"edit-update":ae("edit",He(e));break;case"delete-update":Ae(e.dataset.sprint,e.dataset.idea,e.dataset.story);break;case"refresh-updates":h("updates");break;case"new-figure":ie("create");break;case"edit-figure":ie("edit",Oe(e));break;case"delete-figure":Me(e.dataset.figure);break;case"refresh-figures":h("figures");break}}async function Ke(){qe(),Re(),document.addEventListener("click",Ge),await h("ideas")}Ke();
