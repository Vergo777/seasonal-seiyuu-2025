import './style.css';

// ===== API Client =====
const API_BASE = '/seiyuu/api';

async function fetchVoiceActors() {
  const res = await fetch(`${API_BASE}/voice-actors`);
  if (!res.ok) throw new Error('Failed to fetch voice actors');
  return res.json();
}

async function fetchVoiceActor(id) {
  const res = await fetch(`${API_BASE}/voice-actors/${id}`);
  if (!res.ok) throw new Error('Voice actor not found');
  return res.json();
}

async function fetchSeasonInfo() {
  const res = await fetch(`${API_BASE}/season-info`);
  if (!res.ok) return null;
  return res.json();
}

async function fetchCompare(id1, id2) {
  const res = await fetch(`${API_BASE}/compare/${id1}/${id2}`);
  if (!res.ok) throw new Error('Compare failed');
  return res.json();
}

// ===== State =====
let allVoiceActors = [];
let currentView = 'list'; // 'list', 'detail', or 'compare'
let currentVaId = null;

// ===== Router =====
function handleRoute() {
  const hash = window.location.hash;
  if (hash.startsWith('#/voice-actor/')) {
    const id = parseInt(hash.split('/')[2]);
    showDetailPage(id);
  } else if (hash.startsWith('#/compare/')) {
    const parts = hash.split('/');
    const id1 = parseInt(parts[2]);
    const id2 = parseInt(parts[3]);
    if (id1 && id2) {
      showComparePage(id1, id2);
    } else {
      showCompareSelectPage();
    }
  } else if (hash === '#/compare' || hash === '#/compare/') {
    showCompareSelectPage();
  } else if (hash === '#/about') {
    showAboutPage();
  } else {
    showListPage();
  }
}

window.addEventListener('hashchange', handleRoute);

// ===== Render Functions =====
function renderSeasonInfo(info) {
  const el = document.getElementById('season-info');
  if (info && info.season) {
    const seasonName = info.season.charAt(0).toUpperCase() + info.season.slice(1);
    el.innerHTML = `
      <span class="season-badge">${seasonName} ${info.year}</span>
      <span style="margin-left: 0.5rem">${info.voiceActorCount} Voice Actors</span>
      <a href="#/compare" class="compare-nav-link">⚔️ Compare</a>
    `;
  }
}

function renderVaGrid(voiceActors) {
  const main = document.getElementById('main-content');

  if (voiceActors.length === 0) {
    main.innerHTML = `
      <div class="empty-state">
        <h2>No Data Available</h2>
        <p>Please trigger a data refresh from the admin panel.</p>
      </div>
    `;
    return;
  }

  main.innerHTML = `
    <div class="search-container">
      <input type="text" class="search-input" placeholder="🔍 Search voice actors..." id="search-input">
    </div>
    <div class="va-grid" id="va-grid">
      ${voiceActors.map(va => renderVaCard(va)).join('')}
    </div>
  `;

  // Search functionality
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allVoiceActors.filter(va =>
      va.name.toLowerCase().includes(query)
    );
    document.getElementById('va-grid').innerHTML = filtered.map(va => renderVaCard(va)).join('');
  });
}

function renderVaCard(va) {
  return `
    <a href="#/voice-actor/${va.malId}" target="_blank" class="va-card-link">
      <div class="va-card" data-va-id="${va.malId}">
        <img class="va-card-image" src="${va.imageUrl || '/placeholder.png'}" alt="${va.name}" loading="lazy" 
             onerror="this.src='https://via.placeholder.com/200x267?text=No+Image'">
        <div class="va-card-content">
          <div class="va-card-name">${va.name}</div>
          <span class="va-card-shows">${va.totalSeasonalShows} show${va.totalSeasonalShows !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </a>
  `;
}

function renderDetailPage(va) {
  const main = document.getElementById('main-content');
  const malUrl = `https://myanimelist.net/people/${va.malId}`;

  main.innerHTML = `
    <button class="back-btn" onclick="window.location.hash='/'">← Back to List</button>
    
    <div class="detail-header">
      <img class="detail-image" src="${va.imageUrl || 'https://via.placeholder.com/200x267'}" alt="${va.name}">
      <div class="detail-info">
        <h1><a href="${malUrl}" target="_blank" rel="noopener" class="mal-link">${va.name} ↗</a></h1>
        <p>${va.totalSeasonalShows} show${va.totalSeasonalShows !== 1 ? 's' : ''} this season</p>
        <p style="margin-top: 0.5rem">${va.allTimeRoles?.length || 0} total career roles</p>
      </div>
    </div>
    
    <div class="tabs">
      <button class="tab active" data-tab="seasonal">This Season</button>
      <button class="tab" data-tab="all-time">All-Time Roles</button>
    </div>
    
    <div id="tab-content">
      ${renderRolesGrid(va.seasonalRoles || [])}
    </div>
  `;

  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const tabName = tab.dataset.tab;
      const roles = tabName === 'seasonal' ? va.seasonalRoles : va.allTimeRoles;
      document.getElementById('tab-content').innerHTML = renderRolesGrid(roles || []);
    });
  });
}

function renderRolesGrid(roles) {
  if (roles.length === 0) {
    return '<div class="empty-state"><p>No roles found.</p></div>';
  }

  return `
    <div class="roles-grid">
      ${roles.map(role => {
    const animeUrl = role.anime?.malId ? `https://myanimelist.net/anime/${role.anime.malId}` : '#';
    const characterUrl = role.character?.malId ? `https://myanimelist.net/character/${role.character.malId}` : '#';

    return `
          <div class="role-card">
            <a href="${animeUrl}" target="_blank" rel="noopener" class="role-anime-link">
              <img class="role-anime-image" src="${role.anime?.imageUrl || ''}" alt="${role.anime?.title || ''}"
                   onerror="this.src='https://via.placeholder.com/80x110?text=?'">
            </a>
            <div class="role-info">
              <a href="${animeUrl}" target="_blank" rel="noopener" class="role-anime-title">${role.anime?.title || 'Unknown Anime'}</a>
              <div class="role-character">
                <a href="${characterUrl}" target="_blank" rel="noopener" class="role-character-link">
                  <img class="role-character-image" src="${role.character?.imageUrl || ''}" alt="${role.character?.name || ''}"
                       onerror="this.src='https://via.placeholder.com/48?text=?'">
                </a>
                <span>as <a href="${characterUrl}" target="_blank" rel="noopener">${role.character?.name || 'Unknown Character'}</a></span>
              </div>
            </div>
          </div>
        `;
  }).join('')}
    </div>
  `;
}

function renderCompareSelectPage() {
  const main = document.getElementById('main-content');

  // Sort VAs by seasonal shows (popularity) descending
  const sortedVAs = [...allVoiceActors].sort((a, b) => b.totalSeasonalShows - a.totalSeasonalShows);

  main.innerHTML = `
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
  `;

  const compareBtn = document.getElementById('compare-btn');

  function setupVASearch(containerId) {
    const container = document.getElementById(containerId);
    const input = container.querySelector('.va-search-input');
    const dropdown = container.querySelector('.va-search-dropdown');
    const hiddenInput = container.querySelector('.va-selected-id');
    const preview = container.querySelector('.va-selected-preview');

    function renderDropdown(vas) {
      dropdown.innerHTML = vas.slice(0, 50).map(va => `
        <div class="va-dropdown-item" data-id="${va.malId}" data-name="${va.name}" data-image="${va.imageUrl || ''}">
          <img src="${va.imageUrl || 'https://via.placeholder.com/40x50'}" alt="" class="va-dropdown-img" 
               onerror="this.src='https://via.placeholder.com/40x50'">
          <div class="va-dropdown-info">
            <span class="va-dropdown-name">${va.name}</span>
            <span class="va-dropdown-shows">${va.totalSeasonalShows} shows this season</span>
          </div>
        </div>
      `).join('');
      dropdown.style.display = vas.length ? 'block' : 'none';
    }

    function selectVA(id, name, imageUrl) {
      hiddenInput.value = id;
      input.value = '';
      input.style.display = 'none';
      preview.innerHTML = `
        <div class="va-preview-card">
          <img src="${imageUrl || 'https://via.placeholder.com/50x60'}" alt="${name}" class="va-preview-img"
               onerror="this.src='https://via.placeholder.com/50x60'">
          <span class="va-preview-name">${name}</span>
          <button class="va-preview-clear" type="button">✕</button>
        </div>
      `;
      preview.style.display = 'block';
      dropdown.style.display = 'none';
      updateCompareButton();

      preview.querySelector('.va-preview-clear').addEventListener('click', () => {
        hiddenInput.value = '';
        preview.style.display = 'none';
        preview.innerHTML = '';
        input.style.display = 'block';
        input.focus();
        updateCompareButton();
      });
    }

    input.addEventListener('focus', () => {
      const query = input.value.toLowerCase().trim();
      const filtered = query
        ? sortedVAs.filter(va => va.name.toLowerCase().includes(query))
        : sortedVAs;
      renderDropdown(filtered);
    });

    input.addEventListener('input', () => {
      const query = input.value.toLowerCase().trim();
      const filtered = query
        ? sortedVAs.filter(va => va.name.toLowerCase().includes(query))
        : sortedVAs;
      renderDropdown(filtered);
    });

    dropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.va-dropdown-item');
      if (item) {
        selectVA(item.dataset.id, item.dataset.name, item.dataset.image);
      }
    });

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  }

  function updateCompareButton() {
    const id1 = document.querySelector('#va-search-1 .va-selected-id').value;
    const id2 = document.querySelector('#va-search-2 .va-selected-id').value;
    compareBtn.disabled = !id1 || !id2 || id1 === id2;
  }

  setupVASearch('va-search-1');
  setupVASearch('va-search-2');

  compareBtn.addEventListener('click', () => {
    const id1 = document.querySelector('#va-search-1 .va-selected-id').value;
    const id2 = document.querySelector('#va-search-2 .va-selected-id').value;
    if (id1 && id2) {
      window.location.hash = `/compare/${id1}/${id2}`;
    }
  });
}

function renderCompareResults(data) {
  const main = document.getElementById('main-content');
  const { va1, va2, sharedAnime } = data;

  const va1MalUrl = `https://myanimelist.net/people/${va1.malId}`;
  const va2MalUrl = `https://myanimelist.net/people/${va2.malId}`;

  main.innerHTML = `
    <button class="back-btn" onclick="window.location.hash='/compare'">← Change Selection</button>
    
    <div class="compare-results">
      <div class="compare-header">
        <div class="compare-va compare-va-1">
          <a href="${va1MalUrl}" target="_blank" rel="noopener">
            <img class="compare-va-image" src="${va1.imageUrl || 'https://via.placeholder.com/150x200'}" alt="${va1.name}">
          </a>
          <h2 class="compare-va-name">
            <a href="${va1MalUrl}" target="_blank" rel="noopener" class="mal-link">${va1.name} ↗</a>
          </h2>
          <div class="compare-va-stats">
            <div class="compare-stat">
              <span class="compare-stat-value">${va1.totalCareerRoles}</span>
              <span class="compare-stat-label">Career Roles</span>
            </div>
            <div class="compare-stat">
              <span class="compare-stat-value">${va1.totalSeasonalShows}</span>
              <span class="compare-stat-label">This Season</span>
            </div>
          </div>
        </div>
        
        <div class="compare-vs-banner">
          <span class="vs-text">VS</span>
          <div class="shared-count">${sharedAnime.length} Shared Anime</div>
        </div>
        
        <div class="compare-va compare-va-2">
          <a href="${va2MalUrl}" target="_blank" rel="noopener">
            <img class="compare-va-image" src="${va2.imageUrl || 'https://via.placeholder.com/150x200'}" alt="${va2.name}">
          </a>
          <h2 class="compare-va-name">
            <a href="${va2MalUrl}" target="_blank" rel="noopener" class="mal-link">${va2.name} ↗</a>
          </h2>
          <div class="compare-va-stats">
            <div class="compare-stat">
              <span class="compare-stat-value">${va2.totalCareerRoles}</span>
              <span class="compare-stat-label">Career Roles</span>
            </div>
            <div class="compare-stat">
              <span class="compare-stat-value">${va2.totalSeasonalShows}</span>
              <span class="compare-stat-label">This Season</span>
            </div>
          </div>
        </div>
      </div>
      
      ${sharedAnime.length > 0 ? `
        <h3 class="shared-title">🤝 Shared Anime</h3>
        <div class="shared-anime-grid">
          ${sharedAnime.map(anime => {
    const animeUrl = `https://myanimelist.net/anime/${anime.malId}`;
    return `
            <div class="shared-anime-card">
              <a href="${animeUrl}" target="_blank" rel="noopener">
                <img class="shared-anime-image" src="${anime.imageUrl || ''}" alt="${anime.title}"
                     onerror="this.src='https://via.placeholder.com/80x110?text=?'">
              </a>
              <div class="shared-anime-info">
                <a href="${animeUrl}" target="_blank" rel="noopener" class="shared-anime-title mal-link">${anime.title} ↗</a>
                <div class="shared-characters">
                  <span class="char-1">${anime.characters1.map(c =>
      c.malId ? `<a href="https://myanimelist.net/character/${c.malId}" target="_blank" rel="noopener" class="char-link">${c.name}</a>` : c.name
    ).join(', ')}</span>
                  <span class="char-arrow">↔</span>
                  <span class="char-2">${anime.characters2.map(c =>
      c.malId ? `<a href="https://myanimelist.net/character/${c.malId}" target="_blank" rel="noopener" class="char-link">${c.name}</a>` : c.name
    ).join(', ')}</span>
                </div>
              </div>
            </div>
          `}).join('')}
        </div>
      ` : `
        <div class="no-shared">
          <p>These voice actors haven't appeared in any anime together... yet!</p>
        </div>
      `}
    </div>
  `;
}

// ===== Page Controllers =====
async function showListPage() {
  currentView = 'list';
  const loading = document.getElementById('loading');
  if (loading) loading.style.display = 'flex';

  try {
    const [voiceActors, seasonInfo] = await Promise.all([
      fetchVoiceActors(),
      fetchSeasonInfo()
    ]);

    allVoiceActors = voiceActors;
    renderSeasonInfo(seasonInfo);
    renderVaGrid(voiceActors);
  } catch (err) {
    console.error('Error loading data:', err);
    document.getElementById('main-content').innerHTML = `
      <div class="empty-state">
        <h2>Unable to Load Data</h2>
        <p>Make sure the backend is running and data has been refreshed.</p>
      </div>
    `;
  }
}

async function showDetailPage(id) {
  currentView = 'detail';
  currentVaId = id;

  document.getElementById('main-content').innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading voice actor...</p>
    </div>
  `;

  try {
    const va = await fetchVoiceActor(id);
    renderDetailPage(va);
  } catch (err) {
    console.error('Error loading voice actor:', err);
    document.getElementById('main-content').innerHTML = `
      <div class="empty-state">
        <h2>Voice Actor Not Found</h2>
        <p><a href="#/">Back to list</a></p>
      </div>
    `;
  }
}

async function showCompareSelectPage() {
  currentView = 'compare';

  // Ensure we have VA list loaded
  if (allVoiceActors.length === 0) {
    document.getElementById('main-content').innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading voice actors...</p>
      </div>
    `;
    try {
      allVoiceActors = await fetchVoiceActors();
    } catch (err) {
      console.error('Error loading voice actors:', err);
    }
  }

  renderCompareSelectPage();
}

async function showComparePage(id1, id2) {
  currentView = 'compare';

  document.getElementById('main-content').innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Comparing voice actors...</p>
    </div>
  `;

  try {
    const data = await fetchCompare(id1, id2);
    renderCompareResults(data);
  } catch (err) {
    console.error('Error comparing:', err);
    document.getElementById('main-content').innerHTML = `
      <div class="empty-state">
        <h2>Compare Failed</h2>
        <p><a href="#/compare">Try again</a></p>
      </div>
    `;
  }
}

function showAboutPage() {
  currentView = 'about';
  const main = document.getElementById('main-content');

  main.innerHTML = `
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
  `;
}

// ===== Initialize =====
handleRoute();

