(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))s(a);new MutationObserver(a=>{for(const n of a)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function o(a){const n={};return a.integrity&&(n.integrity=a.integrity),a.referrerPolicy&&(n.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?n.credentials="include":a.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(a){if(a.ep)return;a.ep=!0;const n=o(a);fetch(a.href,n)}})();const i="/api";async function u(){const e=await fetch(`${i}/voice-actors`);if(!e.ok)throw new Error("Failed to fetch voice actors");return e.json()}async function p(e){const t=await fetch(`${i}/voice-actors/${e}`);if(!t.ok)throw new Error("Voice actor not found");return t.json()}async function f(){const e=await fetch(`${i}/season-info`);return e.ok?e.json():null}let m=[];function h(){const e=window.location.hash;if(e.startsWith("#/voice-actor/")){const t=parseInt(e.split("/")[2]);$(t)}else w()}window.addEventListener("hashchange",h);function v(e){const t=document.getElementById("season-info");if(e&&e.season){const o=e.season.charAt(0).toUpperCase()+e.season.slice(1);t.innerHTML=`
      <span class="season-badge">${o} ${e.year}</span>
      <span style="margin-left: 0.5rem">${e.voiceActorCount} Voice Actors</span>
    `}}function g(e){const t=document.getElementById("main-content");if(e.length===0){t.innerHTML=`
      <div class="empty-state">
        <h2>No Data Available</h2>
        <p>Please trigger a data refresh from the admin panel.</p>
      </div>
    `;return}t.innerHTML=`
    <div class="search-container">
      <input type="text" class="search-input" placeholder="🔍 Search voice actors..." id="search-input">
    </div>
    <div class="va-grid" id="va-grid">
      ${e.map(s=>c(s)).join("")}
    </div>
  `,document.getElementById("search-input").addEventListener("input",s=>{const a=s.target.value.toLowerCase(),n=m.filter(r=>r.name.toLowerCase().includes(a));document.getElementById("va-grid").innerHTML=n.map(r=>c(r)).join(""),l()}),l()}function c(e){return`
    <div class="va-card" data-va-id="${e.malId}">
      <img class="va-card-image" src="${e.imageUrl||"/placeholder.png"}" alt="${e.name}" loading="lazy" 
           onerror="this.src='https://via.placeholder.com/200x267?text=No+Image'">
      <div class="va-card-content">
        <div class="va-card-name">${e.name}</div>
        <span class="va-card-shows">${e.totalSeasonalShows} show${e.totalSeasonalShows!==1?"s":""}</span>
      </div>
    </div>
  `}function l(){document.querySelectorAll(".va-card").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.vaId;window.location.hash=`/voice-actor/${t}`})})}function y(e){const t=document.getElementById("main-content");t.innerHTML=`
    <button class="back-btn" onclick="window.location.hash='/'">← Back to List</button>
    
    <div class="detail-header">
      <img class="detail-image" src="${e.imageUrl||"https://via.placeholder.com/200x267"}" alt="${e.name}">
      <div class="detail-info">
        <h1>${e.name}</h1>
        <p>${e.totalSeasonalShows} show${e.totalSeasonalShows!==1?"s":""} this season</p>
        <p style="margin-top: 0.5rem">${e.allTimeRoles?.length||0} total career roles</p>
      </div>
    </div>
    
    <div class="tabs">
      <button class="tab active" data-tab="seasonal">This Season</button>
      <button class="tab" data-tab="all-time">All-Time Roles</button>
    </div>
    
    <div id="tab-content">
      ${d(e.seasonalRoles||[])}
    </div>
  `,document.querySelectorAll(".tab").forEach(o=>{o.addEventListener("click",()=>{document.querySelectorAll(".tab").forEach(n=>n.classList.remove("active")),o.classList.add("active");const a=o.dataset.tab==="seasonal"?e.seasonalRoles:e.allTimeRoles;document.getElementById("tab-content").innerHTML=d(a||[])})})}function d(e){return e.length===0?'<div class="empty-state"><p>No roles found.</p></div>':`
    <div class="roles-grid">
      ${e.map(t=>`
        <div class="role-card">
          <img class="role-anime-image" src="${t.anime?.imageUrl||""}" alt="${t.anime?.title||""}"
               onerror="this.src='https://via.placeholder.com/80x110?text=?'">
          <div class="role-info">
            <div class="role-anime-title">${t.anime?.title||"Unknown Anime"}</div>
            <div class="role-character">
              <img class="role-character-image" src="${t.character?.imageUrl||""}" alt="${t.character?.name||""}"
                   onerror="this.src='https://via.placeholder.com/32?text=?'">
              <span>as ${t.character?.name||"Unknown Character"}</span>
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `}async function w(){const e=document.getElementById("loading");e&&(e.style.display="flex");try{const[t,o]=await Promise.all([u(),f()]);m=t,v(o),g(t)}catch(t){console.error("Error loading data:",t),document.getElementById("main-content").innerHTML=`
      <div class="empty-state">
        <h2>Unable to Load Data</h2>
        <p>Make sure the backend is running and data has been refreshed.</p>
      </div>
    `}}async function $(e){document.getElementById("main-content").innerHTML=`
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading voice actor...</p>
    </div>
  `;try{const t=await p(e);y(t)}catch(t){console.error("Error loading voice actor:",t),document.getElementById("main-content").innerHTML=`
      <div class="empty-state">
        <h2>Voice Actor Not Found</h2>
        <p><a href="#/">Back to list</a></p>
      </div>
    `}}h();
