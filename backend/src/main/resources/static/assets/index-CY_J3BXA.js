(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))n(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const c of s.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&n(c)}).observe(document,{childList:!0,subtree:!0});function t(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerPolicy&&(s.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?s.credentials="include":o.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(o){if(o.ep)return;o.ep=!0;const s=t(o);fetch(o.href,s)}})();const i="/seiyuu/api";async function p(){const e=await fetch(`${i}/voice-actors`);if(!e.ok)throw new Error("Failed to fetch voice actors");return e.json()}async function v(e){const a=await fetch(`${i}/voice-actors/${e}`);if(!a.ok)throw new Error("Voice actor not found");return a.json()}async function u(){const e=await fetch(`${i}/season-info`);return e.ok?e.json():null}async function g(e,a){const t=await fetch(`${i}/compare/${e}/${a}`);if(!t.ok)throw new Error("Compare failed");return t.json()}let r=[];function h(){const e=window.location.hash;if(e.startsWith("#/voice-actor/")){const a=parseInt(e.split("/")[2]);E(a)}else if(e.startsWith("#/compare/")){const a=e.split("/"),t=parseInt(a[2]),n=parseInt(a[3]);t&&n?L(t,n):m()}else e==="#/compare"||e==="#/compare/"?m():I()}window.addEventListener("hashchange",h);function f(e){const a=document.getElementById("season-info");if(e&&e.season){const t=e.season.charAt(0).toUpperCase()+e.season.slice(1);a.innerHTML=`
      <span class="season-badge">${t} ${e.year}</span>
      <span style="margin-left: 0.5rem">${e.voiceActorCount} Voice Actors</span>
      <a href="#/compare" class="compare-nav-link">⚔️ Compare</a>
    `}}function $(e){const a=document.getElementById("main-content");if(e.length===0){a.innerHTML=`
      <div class="empty-state">
        <h2>No Data Available</h2>
        <p>Please trigger a data refresh from the admin panel.</p>
      </div>
    `;return}a.innerHTML=`
    <div class="search-container">
      <input type="text" class="search-input" placeholder="🔍 Search voice actors..." id="search-input">
    </div>
    <div class="va-grid" id="va-grid">
      ${e.map(n=>l(n)).join("")}
    </div>
  `,document.getElementById("search-input").addEventListener("input",n=>{const o=n.target.value.toLowerCase(),s=r.filter(c=>c.name.toLowerCase().includes(o));document.getElementById("va-grid").innerHTML=s.map(c=>l(c)).join("")})}function l(e){return`
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
  `}function y(e){const a=document.getElementById("main-content"),t=`https://myanimelist.net/people/${e.malId}`;a.innerHTML=`
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
      ${d(e.seasonalRoles||[])}
    </div>
  `,document.querySelectorAll(".tab").forEach(n=>{n.addEventListener("click",()=>{document.querySelectorAll(".tab").forEach(c=>c.classList.remove("active")),n.classList.add("active");const s=n.dataset.tab==="seasonal"?e.seasonalRoles:e.allTimeRoles;document.getElementById("tab-content").innerHTML=d(s||[])})})}function d(e){return e.length===0?'<div class="empty-state"><p>No roles found.</p></div>':`
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
  `}function b(){const e=document.getElementById("main-content");e.innerHTML=`
    <button class="back-btn" onclick="window.location.hash='/'">← Back to List</button>
    
    <div class="compare-page">
      <h1 class="compare-title">⚔️ Compare Voice Actors</h1>
      <p class="compare-subtitle">Select two voice actors to compare their careers and find shared anime</p>
      
      <div class="compare-selectors">
        <div class="compare-selector">
          <label>Voice Actor 1</label>
          <select id="va-select-1" class="va-select">
            <option value="">Select a voice actor...</option>
            ${r.map(s=>`<option value="${s.malId}">${s.name}</option>`).join("")}
          </select>
        </div>
        
        <div class="compare-vs">VS</div>
        
        <div class="compare-selector">
          <label>Voice Actor 2</label>
          <select id="va-select-2" class="va-select">
            <option value="">Select a voice actor...</option>
            ${r.map(s=>`<option value="${s.malId}">${s.name}</option>`).join("")}
          </select>
        </div>
      </div>
      
      <button class="compare-btn" id="compare-btn" disabled>Compare</button>
    </div>
  `;const a=document.getElementById("va-select-1"),t=document.getElementById("va-select-2"),n=document.getElementById("compare-btn");function o(){n.disabled=!a.value||!t.value||a.value===t.value}a.addEventListener("change",o),t.addEventListener("change",o),n.addEventListener("click",()=>{a.value&&t.value&&(window.location.hash=`/compare/${a.value}/${t.value}`)})}function w(e){const a=document.getElementById("main-content"),{va1:t,va2:n,sharedAnime:o}=e;a.innerHTML=`
    <button class="back-btn" onclick="window.location.hash='/compare'">← Change Selection</button>
    
    <div class="compare-results">
      <div class="compare-header">
        <div class="compare-va compare-va-1">
          <img class="compare-va-image" src="${t.imageUrl||"https://via.placeholder.com/150x200"}" alt="${t.name}">
          <h2 class="compare-va-name">${t.name}</h2>
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
          <img class="compare-va-image" src="${n.imageUrl||"https://via.placeholder.com/150x200"}" alt="${n.name}">
          <h2 class="compare-va-name">${n.name}</h2>
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
          ${o.map(s=>`
            <div class="shared-anime-card">
              <img class="shared-anime-image" src="${s.imageUrl||""}" alt="${s.title}"
                   onerror="this.src='https://via.placeholder.com/80x110?text=?'">
              <div class="shared-anime-info">
                <div class="shared-anime-title">${s.title}</div>
                <div class="shared-characters">
                  <span class="char-1">${s.characters1.join(", ")}</span>
                  <span class="char-arrow">↔</span>
                  <span class="char-2">${s.characters2.join(", ")}</span>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      `:`
        <div class="no-shared">
          <p>These voice actors haven't appeared in any anime together... yet!</p>
        </div>
      `}
    </div>
  `}async function I(){const e=document.getElementById("loading");e&&(e.style.display="flex");try{const[a,t]=await Promise.all([p(),u()]);r=a,f(t),$(a)}catch(a){console.error("Error loading data:",a),document.getElementById("main-content").innerHTML=`
      <div class="empty-state">
        <h2>Unable to Load Data</h2>
        <p>Make sure the backend is running and data has been refreshed.</p>
      </div>
    `}}async function E(e){document.getElementById("main-content").innerHTML=`
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading voice actor...</p>
    </div>
  `;try{const a=await v(e);y(a)}catch(a){console.error("Error loading voice actor:",a),document.getElementById("main-content").innerHTML=`
      <div class="empty-state">
        <h2>Voice Actor Not Found</h2>
        <p><a href="#/">Back to list</a></p>
      </div>
    `}}async function m(){if(r.length===0){document.getElementById("main-content").innerHTML=`
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading voice actors...</p>
      </div>
    `;try{r=await p()}catch(e){console.error("Error loading voice actors:",e)}}b()}async function L(e,a){document.getElementById("main-content").innerHTML=`
    <div class="loading">
      <div class="spinner"></div>
      <p>Comparing voice actors...</p>
    </div>
  `;try{const t=await g(e,a);w(t)}catch(t){console.error("Error comparing:",t),document.getElementById("main-content").innerHTML=`
      <div class="empty-state">
        <h2>Compare Failed</h2>
        <p><a href="#/compare">Try again</a></p>
      </div>
    `}}h();
