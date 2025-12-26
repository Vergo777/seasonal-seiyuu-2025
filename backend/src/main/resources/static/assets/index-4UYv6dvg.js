(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))n(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function t(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(r){if(r.ep)return;r.ep=!0;const s=t(r);fetch(r.href,s)}})();const u="/seiyuu/api";async function w(){const e=await fetch(`${u}/voice-actors`);if(!e.ok)throw new Error("Failed to fetch voice actors");return e.json()}async function k(e){const a=await fetch(`${u}/voice-actors/${e}`);if(!a.ok)throw new Error("Voice actor not found");return a.json()}async function I(){const e=await fetch(`${u}/season-info`);return e.ok?e.json():null}async function L(e,a){const t=await fetch(`${u}/compare/${e}/${a}`);if(!t.ok)throw new Error("Compare failed");return t.json()}let v=[];function $(){const e=window.location.hash;if(e.startsWith("#/voice-actor/")){const a=parseInt(e.split("/")[2]);V(a)}else if(e.startsWith("#/compare/")){const a=e.split("/"),t=parseInt(a[2]),n=parseInt(a[3]);t&&n?x(t,n):b()}else e==="#/compare"||e==="#/compare/"?b():e==="#/about"?U():M()}window.addEventListener("hashchange",$);function A(e){const a=document.getElementById("season-info");if(e&&e.season){const t=e.season.charAt(0).toUpperCase()+e.season.slice(1);a.innerHTML=`
      <span class="season-badge">${t} ${e.year}</span>
      <span style="margin-left: 0.5rem">${e.voiceActorCount} Voice Actors</span>
      <a href="#/compare" class="compare-nav-link">⚔️ Compare</a>
    `}}function E(e){const a=document.getElementById("main-content");if(e.length===0){a.innerHTML=`
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
  `,document.getElementById("search-input").addEventListener("input",n=>{const r=n.target.value.toLowerCase(),s=v.filter(o=>o.name.toLowerCase().includes(r));document.getElementById("va-grid").innerHTML=s.map(o=>f(o)).join("")})}function f(e){return`
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
  `}function B(e){const a=document.getElementById("main-content"),t=`https://myanimelist.net/people/${e.malId}`;a.innerHTML=`
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
  `,document.querySelectorAll(".tab").forEach(n=>{n.addEventListener("click",()=>{document.querySelectorAll(".tab").forEach(o=>o.classList.remove("active")),n.classList.add("active");const s=n.dataset.tab==="seasonal"?e.seasonalRoles:e.allTimeRoles;document.getElementById("tab-content").innerHTML=y(s||[])})})}function y(e){return e.length===0?'<div class="empty-state"><p>No roles found.</p></div>':`
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
  `}function C(){const e=document.getElementById("main-content"),a=[...v].sort((s,o)=>o.totalSeasonalShows-s.totalSeasonalShows);e.innerHTML=`
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
  `;const t=document.getElementById("compare-btn");function n(s){const o=document.getElementById(s),c=o.querySelector(".va-search-input"),m=o.querySelector(".va-search-dropdown"),d=o.querySelector(".va-selected-id"),p=o.querySelector(".va-selected-preview");function g(l){m.innerHTML=l.slice(0,50).map(i=>`
        <div class="va-dropdown-item" data-id="${i.malId}" data-name="${i.name}" data-image="${i.imageUrl||""}">
          <img src="${i.imageUrl||"https://via.placeholder.com/40x50"}" alt="" class="va-dropdown-img" 
               onerror="this.src='https://via.placeholder.com/40x50'">
          <div class="va-dropdown-info">
            <span class="va-dropdown-name">${i.name}</span>
            <span class="va-dropdown-shows">${i.totalSeasonalShows} shows this season</span>
          </div>
        </div>
      `).join(""),m.style.display=l.length?"block":"none"}function S(l,i,h){d.value=l,c.value="",c.style.display="none",p.innerHTML=`
        <div class="va-preview-card">
          <img src="${h||"https://via.placeholder.com/50x60"}" alt="${i}" class="va-preview-img"
               onerror="this.src='https://via.placeholder.com/50x60'">
          <span class="va-preview-name">${i}</span>
          <button class="va-preview-clear" type="button">✕</button>
        </div>
      `,p.style.display="block",m.style.display="none",r(),p.querySelector(".va-preview-clear").addEventListener("click",()=>{d.value="",p.style.display="none",p.innerHTML="",c.style.display="block",c.focus(),r()})}c.addEventListener("focus",()=>{const l=c.value.toLowerCase().trim(),i=l?a.filter(h=>h.name.toLowerCase().includes(l)):a;g(i)}),c.addEventListener("input",()=>{const l=c.value.toLowerCase().trim(),i=l?a.filter(h=>h.name.toLowerCase().includes(l)):a;g(i)}),m.addEventListener("click",l=>{const i=l.target.closest(".va-dropdown-item");i&&S(i.dataset.id,i.dataset.name,i.dataset.image)}),document.addEventListener("click",l=>{o.contains(l.target)||(m.style.display="none")})}function r(){const s=document.querySelector("#va-search-1 .va-selected-id").value,o=document.querySelector("#va-search-2 .va-selected-id").value;t.disabled=!s||!o||s===o}n("va-search-1"),n("va-search-2"),t.addEventListener("click",()=>{const s=document.querySelector("#va-search-1 .va-selected-id").value,o=document.querySelector("#va-search-2 .va-selected-id").value;s&&o&&(window.location.hash=`/compare/${s}/${o}`)})}function T(e){const a=document.getElementById("main-content"),{va1:t,va2:n,sharedAnime:r}=e,s=`https://myanimelist.net/people/${t.malId}`,o=`https://myanimelist.net/people/${n.malId}`;a.innerHTML=`
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
          <div class="shared-count">${r.length} Shared Anime</div>
        </div>
        
        <div class="compare-va compare-va-2">
          <a href="${o}" target="_blank" rel="noopener">
            <img class="compare-va-image" src="${n.imageUrl||"https://via.placeholder.com/150x200"}" alt="${n.name}">
          </a>
          <h2 class="compare-va-name">
            <a href="${o}" target="_blank" rel="noopener" class="mal-link">${n.name} ↗</a>
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
      
      ${r.length>0?`
        <h3 class="shared-title">🤝 Shared Anime</h3>
        <div class="shared-anime-grid">
          ${r.map(c=>{const m=`https://myanimelist.net/anime/${c.malId}`;return`
            <div class="shared-anime-card">
              <a href="${m}" target="_blank" rel="noopener">
                <img class="shared-anime-image" src="${c.imageUrl||""}" alt="${c.title}"
                     onerror="this.src='https://via.placeholder.com/80x110?text=?'">
              </a>
              <div class="shared-anime-info">
                <a href="${m}" target="_blank" rel="noopener" class="shared-anime-title mal-link">${c.title} ↗</a>
                <div class="shared-characters">
                  <span class="char-1">${c.characters1.map(d=>d.malId?`<a href="https://myanimelist.net/character/${d.malId}" target="_blank" rel="noopener" class="char-link">${d.name}</a>`:d.name).join(", ")}</span>
                  <span class="char-arrow">↔</span>
                  <span class="char-2">${c.characters2.map(d=>d.malId?`<a href="https://myanimelist.net/character/${d.malId}" target="_blank" rel="noopener" class="char-link">${d.name}</a>`:d.name).join(", ")}</span>
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
  `}async function M(){const e=document.getElementById("loading");e&&(e.style.display="flex");try{const[a,t]=await Promise.all([w(),I()]);v=a,A(t),E(a)}catch(a){console.error("Error loading data:",a),document.getElementById("main-content").innerHTML=`
      <div class="empty-state">
        <h2>Unable to Load Data</h2>
        <p>Make sure the backend is running and data has been refreshed.</p>
      </div>
    `}}async function V(e){document.getElementById("main-content").innerHTML=`
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading voice actor...</p>
    </div>
  `;try{const a=await k(e);B(a)}catch(a){console.error("Error loading voice actor:",a),document.getElementById("main-content").innerHTML=`
      <div class="empty-state">
        <h2>Voice Actor Not Found</h2>
        <p><a href="#/">Back to list</a></p>
      </div>
    `}}async function b(){if(v.length===0){document.getElementById("main-content").innerHTML=`
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading voice actors...</p>
      </div>
    `;try{v=await w()}catch(e){console.error("Error loading voice actors:",e)}}C()}async function x(e,a){document.getElementById("main-content").innerHTML=`
    <div class="loading">
      <div class="spinner"></div>
      <p>Comparing voice actors...</p>
    </div>
  `;try{const t=await L(e,a);T(t)}catch(t){console.error("Error comparing:",t),document.getElementById("main-content").innerHTML=`
      <div class="empty-state">
        <h2>Compare Failed</h2>
        <p><a href="#/compare">Try again</a></p>
      </div>
    `}}function U(){const e=document.getElementById("main-content");e.innerHTML=`
    <button class="back-btn" onclick="window.location.hash='/'">← Back to List</button>
    
    <div class="about-page">
      <h1 class="about-title">About Seasonal Seiyuu</h1>
      
      <section class="about-section">
        <h2>🎙️ What is this?</h2>
        <p>
          Seasonal Seiyuu is a web application that helps anime fans discover and explore 
          voice actors (seiyuu) appearing in the current anime season. Browse all voice actors, 
          see their roles, explore their full career history, and compare two VAs to find 
          anime they've worked on together.
        </p>
      </section>
      
      <section class="about-section">
        <h2>🤖 Built with AI</h2>
        <p>
          This entire project was created using <strong>Antigravity</strong>, Google DeepMind's 
          advanced AI coding assistant. From the initial concept to the final implementation—including 
          the Spring Boot backend, Vite frontend, API integration, caching system, and all the 
          UI/UX design—every line of code was written through AI-human collaboration.
        </p>
      </section>
      
      <section class="about-section">
        <h2>🛠️ Tech Stack</h2>
        <ul class="tech-list">
          <li><strong>Backend:</strong> Java 25, Spring Boot 3.5</li>
          <li><strong>Frontend:</strong> Vanilla JavaScript, Vite</li>
          <li><strong>Styling:</strong> Custom CSS with Midnight Sakura theme</li>
          <li><strong>Data Source:</strong> Jikan API (unofficial MyAnimeList API)</li>
        </ul>
      </section>
      
      <section class="about-section">
        <h2>✨ Features</h2>
        <ul class="tech-list">
          <li>Browse all voice actors in the current anime season</li>
          <li>Search and filter by name</li>
          <li>View detailed VA profiles with seasonal and all-time roles</li>
          <li>Compare two VAs to discover shared anime</li>
          <li>Direct links to MyAnimeList for VAs, anime, and characters</li>
        </ul>
      </section>
      
      <section class="about-section about-footer">
        <p>
          <a href="https://github.com/Vergo777/seasonal-seiyuu-2025" target="_blank" rel="noopener" class="about-github-link">
            View on GitHub →
          </a>
        </p>
      </section>
    </div>
  `}$();
