import './style.css';

// ===== API Client =====
const API_BASE = '/api';

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

// ===== State =====
let allVoiceActors = [];
let currentView = 'list'; // 'list' or 'detail'
let currentVaId = null;

// ===== Router =====
function handleRoute() {
  const hash = window.location.hash;
  if (hash.startsWith('#/voice-actor/')) {
    const id = parseInt(hash.split('/')[2]);
    showDetailPage(id);
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

// Card click listeners no longer needed - using anchor links

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

// ===== Initialize =====
handleRoute();
