(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))n(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const i of s.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&n(i)}).observe(document,{childList:!0,subtree:!0});function a(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(r){if(r.ep)return;r.ep=!0;const s=a(r);fetch(r.href,s)}})();function T(t,e,a){return t&&e!==void 0&&a!==void 0?`${t}.${e}.${a}`:e!==void 0&&a!==void 0?`${e}.${a}`:e!==void 0?`i${e}`:a!==void 0?`s${a}`:""}const G=["planned","active","completed","archived"],K=["backlog","planned","in-progress","done"],J=["low","medium","high","critical"],Q=["planned","active","completed"],W=["progress","completion","blocker","note"],d={ideas:[],stories:[],sprints:[],updates:[]};let Y="ideas",S=null;const R=document.querySelectorAll(".tab"),X=document.querySelectorAll(".panel"),w=document.getElementById("error-message"),g=document.getElementById("modal"),Z=g.querySelector(".modal__dialog"),p=document.getElementById("modal-form"),ee=document.getElementById("modal-title"),te=document.getElementById("modal-close"),P=document.getElementById("toast-container");R.forEach(t=>{t.addEventListener("click",()=>{const e=t.dataset.tab;e&&e!==Y&&ae(e)})});document.addEventListener("click",ie);te.addEventListener("click",_);g.addEventListener("click",t=>{t.target===g&&_()});document.addEventListener("keydown",t=>{t.key==="Escape"&&!g.classList.contains("hidden")&&_()});p.addEventListener("submit",async t=>{if(t.preventDefault(),!S)return;const e=p.querySelector('button[type="submit"]');e&&(e.disabled=!0,e.textContent="Saving…");try{await S(new FormData(p),p)!==!1&&_()}catch(a){c(a.message)}finally{e&&(e.disabled=!1,e.textContent=e.dataset.defaultText||"Save")}});function ae(t){Y=t,R.forEach(e=>{e.classList.toggle("active",e.dataset.tab===t)}),X.forEach(e=>{e.classList.toggle("active",e.id===`${t}-panel`)}),f(t)}async function f(t){ne(t);try{switch(t){case"ideas":await N(),x();break;case"stories":await E(),k();break;case"sprints":await I(),U();break;case"updates":await q(),C();break}}catch(e){c(e.message)}}function ne(t){const e=document.getElementById(`${t}-list`);e&&(e.innerHTML='<div class="loading">Loading…</div>')}async function N(){const t=await window.electronAPI.readIdeas();if(!t.success||!t.data)throw new Error(t.error||"Failed to load ideas");d.ideas=t.data}async function E(){const t=await window.electronAPI.readStories();if(!t.success||!t.data)throw new Error(t.error||"Failed to load stories");d.stories=t.data}async function I(){const t=await window.electronAPI.readSprints();if(!t.success||!t.data)throw new Error(t.error||"Failed to load sprints");d.sprints=t.data}async function q(){const t=await window.electronAPI.readUpdates();if(!t.success||!t.data)throw new Error(t.error||"Failed to load updates");d.updates=t.data}function x(){const t=document.getElementById("ideas-list");if(t){if(d.ideas.length===0){t.innerHTML='<div class="loading">No ideas yet. Create one to get started.</div>';return}t.innerHTML=d.ideas.map(e=>`
        <div class="item-card">
          <div class="item-header">
            <span class="item-title">${u(e.title||"Untitled")}</span>
            <span class="item-badge">i${e.idea_number}</span>
          </div>
          <div class="item-description">${u(e.description||"")}</div>
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
      `).join("")}}function k(){const t=document.getElementById("stories-list");if(t){if(d.stories.length===0){t.innerHTML='<div class="loading">No stories yet. Create one to get started.</div>';return}t.innerHTML=d.stories.map(e=>`
        <div class="item-card">
          <div class="item-header">
            <span class="item-title">${u(e.title||"Untitled")}</span>
            <span class="item-badge">${e.idea_number}.${e.story_number}</span>
          </div>
          <div class="item-description">${u(e.description||"")}</div>
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
      `).join("")}}function U(){const t=document.getElementById("sprints-list");if(t){if(d.sprints.length===0){t.innerHTML='<div class="loading">No sprints yet. Create one to get started.</div>';return}t.innerHTML=d.sprints.map(e=>`
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
      `).join("")}}function C(){const t=document.getElementById("updates-list");if(t){if(d.updates.length===0){t.innerHTML='<div class="loading">No updates yet. Create one to get started.</div>';return}t.innerHTML=d.updates.map(e=>`
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
      `).join("")}}function ie(t){const e=t.target,a=e.dataset.action;if(a)switch(t.preventDefault(),a){case"new-idea":B("create");break;case"edit-idea":B("edit",re(e));break;case"delete-idea":le(e.dataset.idea);break;case"refresh-ideas":f("ideas");break;case"new-story":M("create");break;case"edit-story":M("edit",se(e));break;case"delete-story":ce(e.dataset.idea,e.dataset.story);break;case"refresh-stories":f("stories");break;case"new-sprint":O("create");break;case"edit-sprint":O("edit",de(e));break;case"delete-sprint":ue(e.dataset.sprint);break;case"refresh-sprints":f("sprints");break;case"new-update":j("create");break;case"edit-update":j("edit",oe(e));break;case"delete-update":be(e.dataset.sprint,e.dataset.idea,e.dataset.story);break;case"refresh-updates":f("updates");break}}function re(t){const e=Number(t.dataset.idea);if(!Number.isNaN(e))return d.ideas.find(a=>a.idea_number===e)}function se(t){const e=Number(t.dataset.idea),a=Number(t.dataset.story);if(!(Number.isNaN(e)||Number.isNaN(a)))return d.stories.find(n=>n.idea_number===e&&n.story_number===a)}function de(t){const e=t.dataset.sprint;if(e)return d.sprints.find(a=>a.sprint_id===e)}function oe(t){const e=t.dataset.sprint,a=Number(t.dataset.idea),n=Number(t.dataset.story);if(!(!e||Number.isNaN(a)||Number.isNaN(n)))return d.updates.find(r=>r.sprint_id===e&&r.idea_number===a&&r.story_number===n)}async function B(t,e){var r;if(t==="edit"&&!e){c("Unable to find that idea.");return}const a=(e==null?void 0:e.idea_number)??await fe().catch(s=>c(s.message));if(a==null)return;const n={title:(e==null?void 0:e.title)??"",description:(e==null?void 0:e.description)??"",status:(e==null?void 0:e.status)??"planned",created:(e==null?void 0:e.created)??y(),tags:((r=e==null?void 0:e.tags)==null?void 0:r.join(", "))??"",body:(e==null?void 0:e.body)??""};L({title:t==="create"?"Create Idea":`Edit Idea i${e==null?void 0:e.idea_number}`,width:"lg",submitLabel:t==="create"?"Create Idea":"Save Changes",body:`
      <div class="form-grid">
        <div class="form-field">
          <label>Idea Number</label>
          <input type="number" name="idea_number" value="${a}" ${t==="edit"?"readonly":'min="0"'} required />
        </div>
        <div class="form-field">
          <label>Status</label>
          <select name="status" required>
            ${G.map(s=>`<option value="${s}" ${s===n.status?"selected":""}>${s}</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label>Created</label>
          <input type="date" name="created" value="${n.created}" required />
        </div>
        <div class="form-field">
          <label>Tags (comma separated)</label>
          <input type="text" name="tags" value="${h(n.tags)}" placeholder="meta, design" />
        </div>
      </div>
      <div class="form-field">
        <label>Title</label>
        <input type="text" name="title" value="${h(n.title)}" placeholder="Idea title" required />
      </div>
      <div class="form-field">
        <label>Description</label>
        <textarea name="description" required placeholder="Describe the intent">${u(n.description)}</textarea>
      </div>
      <div class="form-field">
        <label>Body (Markdown)</label>
        <textarea name="body" placeholder="Additional markdown content">${u(n.body)}</textarea>
      </div>
    `,onSubmit:async s=>{const i={layout:"idea",idea_number:Number(s.get("idea_number")),title:s.get("title").trim(),description:s.get("description").trim(),status:s.get("status"),created:s.get("created"),tags:me(s.get("tags"))},l=s.get("body")??"",o=await window.electronAPI.writeIdea(i,l);if(!o.success)throw new Error(o.error||"Unable to save idea");return await N(),x(),v(t==="create"?"Idea created":"Idea updated"),!0}})}async function M(t,e){if(t==="edit"&&!e){c("Unable to find that story.");return}await V(),await D();const a=d.ideas;if(!a.length){c("Create an idea before adding stories.");return}const n=(e==null?void 0:e.idea_number)??a[0].idea_number,r=(e==null?void 0:e.story_number)??await H(n).catch(i=>c(i.message));if(r===void 0)return;const s={title:(e==null?void 0:e.title)??"",description:(e==null?void 0:e.description)??"",status:(e==null?void 0:e.status)??"backlog",priority:(e==null?void 0:e.priority)??"medium",created:(e==null?void 0:e.created)??y(),assigned_sprint:(e==null?void 0:e.assigned_sprint)??"",body:(e==null?void 0:e.body)??""};L({title:t==="create"?"Create Story":`Edit Story ${e==null?void 0:e.idea_number}.${e==null?void 0:e.story_number}`,width:"lg",submitLabel:t==="create"?"Create Story":"Save Changes",body:`
      <div class="form-grid">
        <div class="form-field">
          <label>Idea</label>
          <select name="idea_number" required>
            ${a.map(i=>`<option value="${i.idea_number}" ${i.idea_number===n?"selected":""}>i${i.idea_number} — ${u(i.title)}</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label>Story Number</label>
          <input type="number" name="story_number" min="0" value="${r}" ${t==="edit"?"readonly":""} required />
        </div>
        <div class="form-field">
          <label>Status</label>
          <select name="status" required>
            ${K.map(i=>`<option value="${i}" ${i===s.status?"selected":""}>${i}</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label>Priority</label>
          <select name="priority" required>
            ${J.map(i=>`<option value="${i}" ${i===s.priority?"selected":""}>${i}</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label>Created</label>
          <input type="date" name="created" value="${s.created}" required />
        </div>
        <div class="form-field">
          <label>Assigned Sprint</label>
          <select name="assigned_sprint">
            <option value="">Backlog</option>
            ${d.sprints.map(i=>`<option value="${i.sprint_id}" ${i.sprint_id===s.assigned_sprint?"selected":""}>${i.sprint_id} (${i.start_date} → ${i.end_date})</option>`).join("")}
          </select>
          <div class="helper-text">Leave blank to keep in backlog.</div>
        </div>
      </div>
      <div class="form-field">
        <label>Title</label>
        <input type="text" name="title" value="${h(s.title)}" required />
      </div>
      <div class="form-field">
        <label>Description</label>
        <textarea name="description" required placeholder="As a … I want … so that …">${u(s.description)}</textarea>
      </div>
      <div class="form-field">
        <label>Body (Markdown)</label>
        <textarea name="body">${u(s.body)}</textarea>
      </div>
    `,onOpen:i=>{if(t==="create"){const l=i.querySelector('select[name="idea_number"]'),o=i.querySelector('input[name="story_number"]');l==null||l.addEventListener("change",async()=>{if(!o)return;o.value="…";const b=await H(Number(l.value));b!==void 0&&(o.value=b.toString())})}},onSubmit:async i=>{const l=i.get("assigned_sprint")||"",o={layout:"story",idea_number:Number(i.get("idea_number")),story_number:Number(i.get("story_number")),title:i.get("title").trim(),description:i.get("description").trim(),status:i.get("status"),priority:i.get("priority"),created:i.get("created"),assigned_sprint:l||void 0},b=i.get("body")??"",m=await window.electronAPI.writeStory(o,b);if(!m.success)throw new Error(m.error||"Unable to save story");return await E(),k(),v(t==="create"?"Story created":"Story updated"),!0}})}async function O(t,e){var n;if(t==="edit"&&!e){c("Unable to find that sprint.");return}const a={sprint_id:(e==null?void 0:e.sprint_id)??"",year:(e==null?void 0:e.year)??new Date().getFullYear(),sprint_number:(e==null?void 0:e.sprint_number)??1,status:(e==null?void 0:e.status)??"planned",start_date:(e==null?void 0:e.start_date)??y(),end_date:(e==null?void 0:e.end_date)??y(),goals:((n=e==null?void 0:e.goals)==null?void 0:n.join(`
`))??"",body:(e==null?void 0:e.body)??""};L({title:t==="create"?"Create Sprint":`Edit Sprint ${e==null?void 0:e.sprint_id}`,width:"lg",submitLabel:t==="create"?"Create Sprint":"Save Changes",body:`
      <div class="form-grid">
        <div class="form-field">
          <label>Sprint ID (YYSS)</label>
          <input type="text" name="sprint_id" value="${h(a.sprint_id)}" pattern="\\d{4}" required />
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
            ${Q.map(r=>`<option value="${r}" ${r===a.status?"selected":""}>${r}</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="form-grid">
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
        <textarea name="goals" placeholder="Initialize taxonomy
Ship MVP">${u(a.goals)}</textarea>
      </div>
      <div class="form-field">
        <label>Body (Markdown)</label>
        <textarea name="body">${u(a.body)}</textarea>
      </div>
    `,onOpen:r=>{if(t==="create"){const s=r.querySelector('input[name="sprint_id"]'),i=r.querySelector('input[name="year"]'),l=r.querySelector('input[name="sprint_number"]');s==null||s.addEventListener("input",()=>{const o=s.value.trim();if(/^\\d{4}$/.test(o)){const b=Number(o.slice(0,2)),m=Number(o.slice(2));i&&(i.value===""||i.value==="0")&&(i.value=(2e3+b).toString()),l&&l.value===""&&(l.value=m.toString())}})}},onSubmit:async r=>{const s=pe(r.get("goals")),i={layout:"sprint",sprint_id:r.get("sprint_id").trim(),year:Number(r.get("year")),sprint_number:Number(r.get("sprint_number")),start_date:r.get("start_date"),end_date:r.get("end_date"),status:r.get("status"),goals:s.length?s:void 0},l=r.get("body")??"",o=await window.electronAPI.writeSprint(i,l);if(!o.success)throw new Error(o.error||"Unable to save sprint");return await I(),U(),v(t==="create"?"Sprint created":"Sprint updated"),!0}})}async function j(t,e){if(t==="edit"&&!e){c("Unable to find that update.");return}if(await D(),await V(),await ve(),!d.sprints.length){c("Create a sprint before adding updates.");return}if(!d.stories.length){c("Create a story before adding updates.");return}const a={sprint_id:(e==null?void 0:e.sprint_id)??d.sprints[0].sprint_id,idea_number:(e==null?void 0:e.idea_number)??d.stories[0].idea_number,story_number:(e==null?void 0:e.story_number)??d.stories[0].story_number,type:(e==null?void 0:e.type)??"progress",date:(e==null?void 0:e.date)??y(),body:(e==null?void 0:e.body)??""};L({title:t==="create"?"Create Update":`Edit Update ${e==null?void 0:e.notation}`,width:"lg",submitLabel:t==="create"?"Create Update":"Save Changes",body:`
      <div class="form-grid">
        <div class="form-field">
          <label>Sprint</label>
          <select name="sprint_id" required>
            ${d.sprints.map(n=>`<option value="${n.sprint_id}" ${n.sprint_id===a.sprint_id?"selected":""}>${n.sprint_id} (${n.start_date} → ${n.end_date})</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label>Idea</label>
          <select name="idea_number" required>
            ${d.ideas.map(n=>`<option value="${n.idea_number}" ${n.idea_number===a.idea_number?"selected":""}>i${n.idea_number} — ${u(n.title)}</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label>Story</label>
          <select name="story_number" required data-story-select>
            ${F(a.idea_number,a.story_number)}
          </select>
        </div>
        <div class="form-field">
          <label>Type</label>
          <select name="type" required>
            ${W.map(n=>`<option value="${n}" ${n===a.type?"selected":""}>${n}</option>`).join("")}
          </select>
        </div>
        <div class="form-field">
          <label>Date</label>
          <input type="date" name="date" value="${a.date}" required />
        </div>
      </div>
      <div class="form-field">
        <label>Notation</label>
        <input type="text" name="notation" value="${T(a.sprint_id,a.idea_number,a.story_number)}" readonly data-notation />
      </div>
      <div class="form-field">
        <label>Body (Markdown)</label>
        <textarea name="body">${u(a.body)}</textarea>
      </div>
    `,onOpen:n=>{const r=n.querySelector('select[name="sprint_id"]'),s=n.querySelector('select[name="idea_number"]'),i=n.querySelector('select[name="story_number"]'),l=n.querySelector("input[data-notation]"),o=m=>{if(!s||!i)return;const $=Number(s.value),z=m?Number(i.value):void 0;if(i.innerHTML=F($,z),!m){const A=i.querySelector("option");A&&(i.value=A.value)}},b=()=>{!l||!r||!s||!i||(l.value=T(r.value,Number(s.value),Number(i.value)))};s==null||s.addEventListener("change",()=>{o(!1),b()}),r==null||r.addEventListener("change",b),i==null||i.addEventListener("change",b),o(!0),b()},onSubmit:async n=>{const r=n.get("sprint_id"),s=n.get("idea_number"),i=n.get("story_number");if(!s)throw new Error("Select an idea for this update.");if(!i)throw new Error("Select a story for this update.");const l=Number(s),o=Number(i),b={layout:"update",sprint_id:r,idea_number:l,story_number:o,type:n.get("type"),date:n.get("date"),notation:T(r,l,o)},m=n.get("body")??"",$=await window.electronAPI.writeUpdate(b,m);if(!$.success)throw new Error($.error||"Unable to save update");return await q(),C(),v(t==="create"?"Update created":"Update updated"),!0}})}async function le(t){if(!t)return;const e=Number(t);if(Number.isNaN(e)||!confirm(`Delete Idea i${t}? This cannot be undone.`))return;const a=await window.electronAPI.deleteIdea(e);if(!a.success){c(a.error||"Unable to delete idea");return}await N(),x(),v("Idea deleted")}async function ce(t,e){if(!t||!e)return;const a=Number(t),n=Number(e);if(Number.isNaN(a)||Number.isNaN(n)||!confirm(`Delete Story ${a}.${n}? This cannot be undone.`))return;const r=await window.electronAPI.deleteStory(a,n);if(!r.success){c(r.error||"Unable to delete story");return}await E(),k(),v("Story deleted")}async function ue(t){if(!t||!confirm(`Delete Sprint ${t}? This cannot be undone.`))return;const e=await window.electronAPI.deleteSprint(t);if(!e.success){c(e.error||"Unable to delete sprint");return}await I(),U(),v("Sprint deleted")}async function be(t,e,a){if(!t||!e||!a)return;const n=Number(e),r=Number(a);if(Number.isNaN(n)||Number.isNaN(r)||!confirm(`Delete Update ${t}.${n}.${r}? This cannot be undone.`))return;const s=await window.electronAPI.deleteUpdate(t,n,r);if(!s.success){c(s.error||"Unable to delete update");return}await q(),C(),v("Update deleted")}function F(t,e){const a=d.stories.filter(n=>n.idea_number===t);return a.length?a.map(n=>`<option value="${n.story_number}" ${n.story_number===e?"selected":""}>${n.story_number} — ${u(n.title)}</option>`).join(""):'<option value="" disabled selected>No stories found</option>'}function L(t){var e,a;Z.dataset.size=t.width??"md",ee.textContent=t.title,p.innerHTML=`
    ${t.body}
    <div class="modal__actions">
      <button type="button" class="btn btn-secondary" data-modal-cancel>Cancel</button>
      <button type="submit" class="btn btn-primary" data-default-text="${t.submitLabel??"Save"}">${t.submitLabel??"Save"}</button>
    </div>
  `,(e=p.querySelector("[data-modal-cancel]"))==null||e.addEventListener("click",_),S=t.onSubmit,g.classList.remove("hidden"),(a=t.onOpen)==null||a.call(t,p)}function _(){g.classList.add("hidden"),p.reset(),p.innerHTML="",S=null}function v(t,e="success"){if(!P)return;const a=document.createElement("div");a.className=`toast toast--${e}`,a.textContent=t,P.appendChild(a),setTimeout(()=>{a.remove()},4e3)}function c(t){w&&(w.textContent=t,w.style.display="block",setTimeout(()=>{w.style.display="none"},5e3)),v(t,"error")}function u(t){const e=document.createElement("div");return e.textContent=t??"",e.innerHTML}function h(t){return(t??"").replace(/"/g,"&quot;")}function me(t){return t?t.split(",").map(e=>e.trim()).filter(Boolean):[]}function pe(t){return t?t.split(/\r?\n/).map(e=>e.trim()).filter(Boolean):[]}function y(){return new Date().toISOString().slice(0,10)}async function V(){d.ideas.length||await N()}async function ve(){d.stories.length||await E()}async function D(){d.sprints.length||await I()}async function fe(){const t=await window.electronAPI.getNextIdeaNumber();if(!t.success||t.data===void 0)throw new Error(t.error||"Unable to determine next idea number");return t.data}async function H(t){const e=await window.electronAPI.getNextStoryNumber(t);if(!e.success||e.data===void 0)throw new Error(e.error||"Unable to determine next story number");return e.data}f("ideas");
