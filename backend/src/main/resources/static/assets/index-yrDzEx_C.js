(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))n(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function t(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerPolicy&&(s.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?s.credentials="include":o.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(o){if(o.ep)return;o.ep=!0;const s=t(o);fetch(o.href,s)}})();const u="/seiyuu/api";async function w(){const e=await fetch(`${u}/voice-actors`);if(!e.ok)throw new Error("Failed to fetch voice actors");return e.json()}async function L(e){const a=await fetch(`${u}/voice-actors/${e}`);if(!a.ok)throw new Error("Voice actor not found");return a.json()}async function k(){const e=await fetch(`${u}/season-info`);return e.ok?e.json():null}async function I(e,a){const t=await fetch(`${u}/compare/${e}/${a}`);if(!t.ok)throw new Error("Compare failed");return t.json()}let v=[];function b(){const e=window.location.hash;if(e.startsWith("#/voice-actor/")){const a=parseInt(e.split("/")[2]);x(a)}else if(e.startsWith("#/compare/")){const a=e.split("/"),t=parseInt(a[2]),n=parseInt(a[3]);t&&n?U(t,n):$()}else e==="#/compare"||e==="#/compare/"?$():M()}window.addEventListener("hashchange",b);function E(e){const a=document.getElementById("season-info");if(e&&e.season){const t=e.season.charAt(0).toUpperCase()+e.season.slice(1);a.innerHTML=`
      <span class="season-badge">${t} ${e.year}</span>
      <span style="margin-left: 0.5rem">${e.voiceActorCount} Voice Actors</span>
      <a href="#/compare" class="compare-nav-link">⚔️ Compare</a>
    `}}function C(e){const a=document.getElementById("main-content");if(e.length===0){a.innerHTML=`
      <div class="empty-state">
        <h2>No Data Available</h2>
        <p>Please trigger a data refresh from the admin panel.</p>
      </div>
    `;return}a.innerHTML=`
    <div class="search-container">
      <input type="text" class="search-input" placeholder="🔍 Search voice actors..." id="search-input">
    </div>
    <div class="va-grid" id="va-grid">
      ${e.map(n=>f(n)).join("")}
    </div>
  `,document.getElementById("search-input").addEventListener("input",n=>{const o=n.target.value.toLowerCase(),s=v.filter(r=>r.name.toLowerCase().includes(o));document.getElementById("va-grid").innerHTML=s.map(r=>f(r)).join("")})}function f(e){return`
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
  `}function T(e){const a=document.getElementById("main-content"),t=`https://myanimelist.net/people/${e.malId}`;a.innerHTML=`
    <button class="back-btn" onclick="window.location.hash='/'">← Back to List</button>
    
    <div class="detail-header">
      <img class="detail-image" src="${e.imageUrl||"https://via.placeholder.com/200x267"}" alt="${e.name}">
      <div class="detail-info">
        <h1><a href="${t}" target="_blank" rel="noopener" class="mal-link">${e.name} ↗</a></h1>
        <p>${e.totalSeasonalShows} show${e.totalSeasonalShows!==1?"s":""} this season</p>
        <p style="margin-top: 0.5rem">${e.allTimeRoles?.length||0} total career roles</p>
      </div>
    </div>
    
    <div class="tabs">
      <button class="tab active" data-tab="seasonal">This Season</button>
      <button class="tab" data-tab="all-time">All-Time Roles</button>
    </div>
    
    <div id="tab-content">
      ${y(e.seasonalRoles||[])}
    </div>
  `,document.querySelectorAll(".tab").forEach(n=>{n.addEventListener("click",()=>{document.querySelectorAll(".tab").forEach(r=>r.classList.remove("active")),n.classList.add("active");const s=n.dataset.tab==="seasonal"?e.seasonalRoles:e.allTimeRoles;document.getElementById("tab-content").innerHTML=y(s||[])})})}function y(e){return e.length===0?'<div class="empty-state"><p>No roles found.</p></div>':`
    <div class="roles-grid">
      ${e.map(a=>{const t=a.anime?.malId?`https://myanimelist.net/anime/${a.anime.malId}`:"#",n=a.character?.malId?`https://myanimelist.net/character/${a.character.malId}`:"#";return`
          <div class="role-card">
            <a href="${t}" target="_blank" rel="noopener" class="role-anime-link">
              <img class="role-anime-image" src="${a.anime?.imageUrl||""}" alt="${a.anime?.title||""}"
                   onerror="this.src='https://via.placeholder.com/80x110?text=?'">
            </a>
            <div class="role-info">
              <a href="${t}" target="_blank" rel="noopener" class="role-anime-title">${a.anime?.title||"Unknown Anime"}</a>
              <div class="role-character">
                <a href="${n}" target="_blank" rel="noopener" class="role-character-link">
                  <img class="role-character-image" src="${a.character?.imageUrl||""}" alt="${a.character?.name||""}"
                       onerror="this.src='https://via.placeholder.com/48?text=?'">
                </a>
                <span>as <a href="${n}" target="_blank" rel="noopener">${a.character?.name||"Unknown Character"}</a></span>
              </div>
            </div>
          </div>
        `}).join("")}
    </div>
  `}function A(){const e=document.getElementById("main-content"),a=[...v].sort((s,r)=>r.totalSeasonalShows-s.totalSeasonalShows);e.innerHTML=`
    <button class="back-btn" onclick="window.location.hash='/'">← Back to List</button>
    
    <div class="compare-page">
      <h1 class="compare-title">⚔️ Compare Voice Actors</h1>
      <p class="compare-subtitle">Select two voice actors to compare their careers and find shared anime</p>
      
      <div class="compare-selectors">
        <div class="compare-selector">
          <label>Voice Actor 1</label>
          <div class="va-search-container" id="va-search-1">
            <input type="text" class="va-search-input" placeholder="Search voice actors..." autocomplete="off">
            <div class="va-search-dropdown"></div>
            <input type="hidden" class="va-selected-id">
            <div class="va-selected-preview"></div>
          </div>
        </div>
        
        <div class="compare-vs">VS</div>
        
        <div class="compare-selector">
          <label>Voice Actor 2</label>
          <div class="va-search-container" id="va-search-2">
            <input type="text" class="va-search-input" placeholder="Search voice actors..." autocomplete="off">
            <div class="va-search-dropdown"></div>
            <input type="hidden" class="va-selected-id">
            <div class="va-selected-preview"></div>
          </div>
        </div>
      </div>
      
      <button class="compare-btn" id="compare-btn" disabled>Compare</button>
    </div>
  `;const t=document.getElementById("compare-btn");function n(s){const r=document.getElementById(s),i=r.querySelector(".va-search-input"),m=r.querySelector(".va-search-dropdown"),d=r.querySelector(".va-selected-id"),p=r.querySelector(".va-selected-preview");function g(l){m.innerHTML=l.slice(0,50).map(c=>`
        <div class="va-dropdown-item" data-id="${c.malId}" data-name="${c.name}" data-image="${c.imageUrl||""}">
          <img src="${c.imageUrl||"https://via.placeholder.com/40x50"}" alt="" class="va-dropdown-img" 
               onerror="this.src='https://via.placeholder.com/40x50'">
          <div class="va-dropdown-info">
            <span class="va-dropdown-name">${c.name}</span>
            <span class="va-dropdown-shows">${c.totalSeasonalShows} shows this season</span>
          </div>
        </div>
      `).join(""),m.style.display=l.length?"block":"none"}function S(l,c,h){d.value=l,i.value="",i.style.display="none",p.innerHTML=`
        <div class="va-preview-card">
          <img src="${h||"https://via.placeholder.com/50x60"}" alt="${c}" class="va-preview-img"
               onerror="this.src='https://via.placeholder.com/50x60'">
          <span class="va-preview-name">${c}</span>
          <button class="va-preview-clear" type="button">✕</button>
        </div>
      `,p.style.display="block",m.style.display="none",o(),p.querySelector(".va-preview-clear").addEventListener("click",()=>{d.value="",p.style.display="none",p.innerHTML="",i.style.display="block",i.focus(),o()})}i.addEventListener("focus",()=>{const l=i.value.toLowerCase().trim(),c=l?a.filter(h=>h.name.toLowerCase().includes(l)):a;g(c)}),i.addEventListener("input",()=>{const l=i.value.toLowerCase().trim(),c=l?a.filter(h=>h.name.toLowerCase().includes(l)):a;g(c)}),m.addEventListener("click",l=>{const c=l.target.closest(".va-dropdown-item");c&&S(c.dataset.id,c.dataset.name,c.dataset.image)}),document.addEventListener("click",l=>{r.contains(l.target)||(m.style.display="none")})}function o(){const s=document.querySelector("#va-search-1 .va-selected-id").value,r=document.querySelector("#va-search-2 .va-selected-id").value;t.disabled=!s||!r||s===r}n("va-search-1"),n("va-search-2"),t.addEventListener("click",()=>{const s=document.querySelector("#va-search-1 .va-selected-id").value,r=document.querySelector("#va-search-2 .va-selected-id").value;s&&r&&(window.location.hash=`/compare/${s}/${r}`)})}function B(e){const a=document.getElementById("main-content"),{va1:t,va2:n,sharedAnime:o}=e,s=`https://myanimelist.net/people/${t.malId}`,r=`https://myanimelist.net/people/${n.malId}`;a.innerHTML=`
    <button class="back-btn" onclick="window.location.hash='/compare'">← Change Selection</button>
    
    <div class="compare-results">
      <div class="compare-header">
        <div class="compare-va compare-va-1">
          <a href="${s}" target="_blank" rel="noopener">
            <img class="compare-va-image" src="${t.imageUrl||"https://via.placeholder.com/150x200"}" alt="${t.name}">
          </a>
          <h2 class="compare-va-name">
            <a href="${s}" target="_blank" rel="noopener" class="mal-link">${t.name} ↗</a>
          </h2>
          <div class="compare-va-stats">
            <div class="compare-stat">
              <span class="compare-stat-value">${t.totalCareerRoles}</span>
              <span class="compare-stat-label">Career Roles</span>
            </div>
            <div class="compare-stat">
              <span class="compare-stat-value">${t.totalSeasonalShows}</span>
              <span class="compare-stat-label">This Season</span>
            </div>
          </div>
        </div>
        
        <div class="compare-vs-banner">
          <span class="vs-text">VS</span>
          <div class="shared-count">${o.length} Shared Anime</div>
        </div>
        
        <div class="compare-va compare-va-2">
          <a href="${r}" target="_blank" rel="noopener">
            <img class="compare-va-image" src="${n.imageUrl||"https://via.placeholder.com/150x200"}" alt="${n.name}">
          </a>
          <h2 class="compare-va-name">
            <a href="${r}" target="_blank" rel="noopener" class="mal-link">${n.name} ↗</a>
          </h2>
          <div class="compare-va-stats">
            <div class="compare-stat">
              <span class="compare-stat-value">${n.totalCareerRoles}</span>
              <span class="compare-stat-label">Career Roles</span>
            </div>
            <div class="compare-stat">
              <span class="compare-stat-value">${n.totalSeasonalShows}</span>
              <span class="compare-stat-label">This Season</span>
            </div>
          </div>
        </div>
      </div>
      
      ${o.length>0?`
        <h3 class="shared-title">🤝 Shared Anime</h3>
        <div class="shared-anime-grid">
          ${o.map(i=>{const m=`https://myanimelist.net/anime/${i.malId}`;return`
            <div class="shared-anime-card">
              <a href="${m}" target="_blank" rel="noopener">
                <img class="shared-anime-image" src="${i.imageUrl||""}" alt="${i.title}"
                     onerror="this.src='https://via.placeholder.com/80x110?text=?'">
              </a>
              <div class="shared-anime-info">
                <a href="${m}" target="_blank" rel="noopener" class="shared-anime-title mal-link">${i.title} ↗</a>
                <div class="shared-characters">
                  <span class="char-1">${i.characters1.map(d=>d.malId?`<a href="https://myanimelist.net/character/${d.malId}" target="_blank" rel="noopener" class="char-link">${d.name}</a>`:d.name).join(", ")}</span>
                  <span class="char-arrow">↔</span>
                  <span class="char-2">${i.characters2.map(d=>d.malId?`<a href="https://myanimelist.net/character/${d.malId}" target="_blank" rel="noopener" class="char-link">${d.name}</a>`:d.name).join(", ")}</span>
                </div>
              </div>
            </div>
          `}).join("")}
        </div>
      `:`
        <div class="no-shared">
          <p>These voice actors haven't appeared in any anime together... yet!</p>
        </div>
      `}
    </div>
  `}async function M(){const e=document.getElementById("loading");e&&(e.style.display="flex");try{const[a,t]=await Promise.all([w(),k()]);v=a,E(t),C(a)}catch(a){console.error("Error loading data:",a),document.getElementById("main-content").innerHTML=`
      <div class="empty-state">
        <h2>Unable to Load Data</h2>
        <p>Make sure the backend is running and data has been refreshed.</p>
      </div>
    `}}async function x(e){document.getElementById("main-content").innerHTML=`
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading voice actor...</p>
    </div>
  `;try{const a=await L(e);T(a)}catch(a){console.error("Error loading voice actor:",a),document.getElementById("main-content").innerHTML=`
      <div class="empty-state">
        <h2>Voice Actor Not Found</h2>
        <p><a href="#/">Back to list</a></p>
      </div>
    `}}async function $(){if(v.length===0){document.getElementById("main-content").innerHTML=`
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading voice actors...</p>
      </div>
    `;try{v=await w()}catch(e){console.error("Error loading voice actors:",e)}}A()}async function U(e,a){document.getElementById("main-content").innerHTML=`
    <div class="loading">
      <div class="spinner"></div>
      <p>Comparing voice actors...</p>
    </div>
  `;try{const t=await I(e,a);B(t)}catch(t){console.error("Error comparing:",t),document.getElementById("main-content").innerHTML=`
      <div class="empty-state">
        <h2>Compare Failed</h2>
        <p><a href="#/compare">Try again</a></p>
      </div>
    `}}b();
