(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))s(a);new MutationObserver(a=>{for(const n of a)if(n.type==="childList")for(const o of n.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function r(a){const n={};return a.integrity&&(n.integrity=a.integrity),a.referrerPolicy&&(n.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?n.credentials="include":a.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(a){if(a.ep)return;a.ep=!0;const n=r(a);fetch(a.href,n)}})();const i="/seiyuu/api";async function h(){const e=await fetch(`${i}/voice-actors`);if(!e.ok)throw new Error("Failed to fetch voice actors");return e.json()}async function u(e){const t=await fetch(`${i}/voice-actors/${e}`);if(!t.ok)throw new Error("Voice actor not found");return t.json()}async function p(){const e=await fetch(`${i}/season-info`);return e.ok?e.json():null}let d=[];function m(){const e=window.location.hash;if(e.startsWith("#/voice-actor/")){const t=parseInt(e.split("/")[2]);$(t)}else y()}window.addEventListener("hashchange",m);function f(e){const t=document.getElementById("season-info");if(e&&e.season){const r=e.season.charAt(0).toUpperCase()+e.season.slice(1);t.innerHTML=`
      <span class="season-badge">${r} ${e.year}</span>
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
  `,document.getElementById("search-input").addEventListener("input",s=>{const a=s.target.value.toLowerCase(),n=d.filter(o=>o.name.toLowerCase().includes(a));document.getElementById("va-grid").innerHTML=n.map(o=>c(o)).join("")})}function c(e){return`
    <a href="#/voice-actor/${e.malId}" target="_blank" class="va-card-link">
      <div class="va-card" data-va-id="${e.malId}">
        <img class="va-card-image" src="${e.imageUrl||"/placeholder.png"}" alt="${e.name}" loading="lazy" 
             onerror="this.src='https://via.placeholder.com/200x267?text=No+Image'">
        <div class="va-card-content">
          <div class="va-card-name">${e.name}</div>
          <span class="va-card-shows">${e.totalSeasonalShows} show${e.totalSeasonalShows!==1?"s":""}</span>
        </div>
      </div>
    </a>
  `}function v(e){const t=document.getElementById("main-content"),r=`https://myanimelist.net/people/${e.malId}`;t.innerHTML=`
    <button class="back-btn" onclick="window.location.hash='/'">← Back to List</button>
    
    <div class="detail-header">
      <img class="detail-image" src="${e.imageUrl||"https://via.placeholder.com/200x267"}" alt="${e.name}">
      <div class="detail-info">
        <h1><a href="${r}" target="_blank" rel="noopener" class="mal-link">${e.name} ↗</a></h1>
        <p>${e.totalSeasonalShows} show${e.totalSeasonalShows!==1?"s":""} this season</p>
        <p style="margin-top: 0.5rem">${e.allTimeRoles?.length||0} total career roles</p>
      </div>
    </div>
    
    <div class="tabs">
      <button class="tab active" data-tab="seasonal">This Season</button>
      <button class="tab" data-tab="all-time">All-Time Roles</button>
    </div>
    
    <div id="tab-content">
      ${l(e.seasonalRoles||[])}
    </div>
  `,document.querySelectorAll(".tab").forEach(s=>{s.addEventListener("click",()=>{document.querySelectorAll(".tab").forEach(o=>o.classList.remove("active")),s.classList.add("active");const n=s.dataset.tab==="seasonal"?e.seasonalRoles:e.allTimeRoles;document.getElementById("tab-content").innerHTML=l(n||[])})})}function l(e){return e.length===0?'<div class="empty-state"><p>No roles found.</p></div>':`
    <div class="roles-grid">
      ${e.map(t=>{const r=t.anime?.malId?`https://myanimelist.net/anime/${t.anime.malId}`:"#",s=t.character?.malId?`https://myanimelist.net/character/${t.character.malId}`:"#";return`
          <div class="role-card">
            <a href="${r}" target="_blank" rel="noopener" class="role-anime-link">
              <img class="role-anime-image" src="${t.anime?.imageUrl||""}" alt="${t.anime?.title||""}"
                   onerror="this.src='https://via.placeholder.com/80x110?text=?'">
            </a>
            <div class="role-info">
              <a href="${r}" target="_blank" rel="noopener" class="role-anime-title">${t.anime?.title||"Unknown Anime"}</a>
              <div class="role-character">
                <a href="${s}" target="_blank" rel="noopener" class="role-character-link">
                  <img class="role-character-image" src="${t.character?.imageUrl||""}" alt="${t.character?.name||""}"
                       onerror="this.src='https://via.placeholder.com/48?text=?'">
                </a>
                <span>as <a href="${s}" target="_blank" rel="noopener">${t.character?.name||"Unknown Character"}</a></span>
              </div>
            </div>
          </div>
        `}).join("")}
    </div>
  `}async function y(){const e=document.getElementById("loading");e&&(e.style.display="flex");try{const[t,r]=await Promise.all([h(),p()]);d=t,f(r),g(t)}catch(t){console.error("Error loading data:",t),document.getElementById("main-content").innerHTML=`
      <div class="empty-state">
        <h2>Unable to Load Data</h2>
        <p>Make sure the backend is running and data has been refreshed.</p>
      </div>
    `}}async function $(e){document.getElementById("main-content").innerHTML=`
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading voice actor...</p>
    </div>
  `;try{const t=await u(e);v(t)}catch(t){console.error("Error loading voice actor:",t),document.getElementById("main-content").innerHTML=`
      <div class="empty-state">
        <h2>Voice Actor Not Found</h2>
        <p><a href="#/">Back to list</a></p>
      </div>
    `}}m();
