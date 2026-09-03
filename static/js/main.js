// main.js — Vanilla JS for Bharat Yatra Sahayak
// Handles: home search, AI assistant chat, emergency SOS, live translator

document.addEventListener('DOMContentLoaded', function () {

  // ---------- HOME PAGE: search bar -> redirect to assistant with query ----------
  const homeExploreBtn = document.getElementById('home-explore-btn');
  const homeSearchInput = document.getElementById('home-search-input');
  if (homeExploreBtn && homeSearchInput) {
    homeExploreBtn.addEventListener('click', function () {
      const q = homeSearchInput.value.trim();
      window.location.href = '/assistant' + (q ? ('?q=' + encodeURIComponent(q)) : '');
    });
    homeSearchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') homeExploreBtn.click();
    });
  }

  // "Explore" buttons on trending destination cards
  document.querySelectorAll('.explore-dest').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const place = btn.getAttribute('data-place');
      window.location.href = '/assistant?q=' + encodeURIComponent(place);
    });
  });

  // ---------- AI ASSISTANT PAGE: chat ----------
  const chatHistory = document.getElementById('chat-history');
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send-btn');

  function appendUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'flex justify-end';
    div.innerHTML = `<div class="bg-primary-fixed-dim text-on-primary-fixed max-w-[85%] md:max-w-xl rounded-2xl rounded-tr-sm p-stack-md shadow-sm">
        <p class="font-body-md text-body-md">${escapeHtml(text)}</p></div>`;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  function appendAiMessage(html) {
    const div = document.createElement('div');
    div.className = 'flex justify-start';
    div.innerHTML = `<div class="flex gap-stack-sm items-start max-w-[95%] md:max-w-2xl">
        <div class="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 mt-1">
          <span class="material-symbols-outlined" style="font-size:20px;">smart_toy</span>
        </div>
        <div class="bg-surface text-on-surface rounded-2xl rounded-tl-sm p-stack-md shadow-sm border border-outline-variant">${html}</div>
      </div>`;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.innerText = str;
    return d.innerHTML;
  }

  async function sendChatQuery(query) {
    if (!query) return;
    appendUserMessage(query);
    chatInput.value = '';
    try {
      const res = await fetch('/api/travel-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query })
      });
      const data = await res.json();
      const result = data.result || {};
      let html = '';
      if (result.info) {
        html = `<p class="font-body-md text-body-md">${escapeHtml(result.info)}</p>`;
      } else {
        html = `
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm max-w-sm">
            <img class="w-full h-40 object-cover" src="${result.image || ''}" alt="${escapeHtml(result.name || '')}">
            <div class="p-stack-md">
              <h4 class="font-headline-md text-on-surface mb-1">${escapeHtml(result.name || '')}</h4>
              <p class="font-caption text-on-surface-variant mb-2">Timings: ${escapeHtml(result.timings || 'N/A')}</p>
              <p class="font-caption text-on-surface-variant mb-3">Price: ${escapeHtml(result.price || 'N/A')}</p>
              <button class="get-directions-btn w-full bg-primary text-on-primary py-2 rounded-full font-label-md text-label-md" data-place="${escapeHtml(result.name || '')}">Get Directions</button>
            </div>
          </div>`;
      }
      appendAiMessage(html);
      // Wire up the "Get Directions" button we just inserted
      const lastBtn = chatHistory.querySelector('.flex.justify-start:last-child .get-directions-btn');
      if (lastBtn) {
        lastBtn.addEventListener('click', function () {
          const place = lastBtn.getAttribute('data-place');
          const mapsUrl = 'https://www.google.com/maps/search/' + encodeURIComponent(place + ', India');
          window.open(mapsUrl, '_blank');
        });
      }
    } catch (err) {
      appendAiMessage('<p class="text-error">Could not reach the server. Is the Flask backend running?</p>');
    }
  }

  if (chatSendBtn && chatInput) {
    chatSendBtn.addEventListener('click', function () { sendChatQuery(chatInput.value.trim()); });
    chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') sendChatQuery(chatInput.value.trim());
    });
    // If arrived via ?q=... from home page, auto-send
    const params = new URLSearchParams(window.location.search);
    const initialQ = params.get('q');
    if (initialQ) sendChatQuery(initialQ);
  }

  // "Recent" sidebar items — clicking re-sends that sample query
  document.querySelectorAll('.recent-chat-item').forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      const q = item.getAttribute('data-query');
      if (q) sendChatQuery(q);
    });
  });

  // "New Chat" button — clears the chat history back to the welcome message
  const newChatBtn = document.getElementById('new-chat-btn');
  if (newChatBtn && chatHistory) {
    newChatBtn.addEventListener('click', function () {
      chatHistory.innerHTML = `
        <div class="flex justify-start">
          <div class="flex gap-stack-sm items-start max-w-[95%] md:max-w-2xl">
            <div class="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0 mt-1">
              <span class="material-symbols-outlined" style="font-size: 20px;">smart_toy</span>
            </div>
            <div class="bg-surface text-on-surface rounded-2xl rounded-tl-sm p-stack-md shadow-sm border border-outline-variant">
              <p class="font-body-md text-body-md">Namaste! Ask me about destinations, ticket prices, timings, or offbeat places.</p>
            </div>
          </div>
        </div>`;
      if (chatInput) chatInput.value = '';
    });
  }

  // ---------- EMERGENCY PAGE: SOS + quick buttons ----------
  const sosBtn = document.getElementById('sos-btn');
  const sosResult = document.getElementById('sos-result');
  const sosPolice = document.getElementById('sos-police');
  const sosHospital = document.getElementById('sos-hospital');
  const sosContacts = document.getElementById('sos-contacts');

  // These get filled in once real GPS location is obtained (see initLiveLocation below)
  let userLat = null;
  let userLon = null;

  // Haversine formula — distance in km between two lat/lon points
  function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // Query OpenStreetMap's free Overpass API for the nearest place of a given amenity type
  async function findNearestAmenity(amenity, lat, lon, radiusMeters) {
    const query = `[out:json][timeout:15];(node["amenity"="${amenity}"](around:${radiusMeters},${lat},${lon});way["amenity"="${amenity}"](around:${radiusMeters},${lat},${lon}););out center;`;
    const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);
    const res = await fetch(url);
    const data = await res.json();
    if (!data.elements || data.elements.length === 0) return null;

    let nearest = null;
    let minDist = Infinity;
    data.elements.forEach(function (el) {
      const elLat = el.lat || (el.center && el.center.lat);
      const elLon = el.lon || (el.center && el.center.lon);
      if (elLat == null || elLon == null) return;
      const d = distanceKm(lat, lon, elLat, elLon);
      if (d < minDist) {
        minDist = d;
        nearest = { name: (el.tags && el.tags.name) || 'Unnamed ' + amenity, distance: d };
      }
    });
    return nearest;
  }

  async function fetchEmergencyInfo() {
    sosPolice.textContent = 'Searching nearby police station...';
    sosHospital.textContent = 'Searching nearby hospital...';
    sosContacts.textContent = 'Emergency Contacts: 112, 100 (Police), 108 (Ambulance)';
    sosResult.classList.remove('hidden');
    sosResult.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (userLat == null || userLon == null) {
      sosPolice.textContent = 'Nearest Police: location not available yet — please allow location access.';
      sosHospital.textContent = 'Nearest Hospital: location not available yet — please allow location access.';
      return;
    }

    try {
      const [police, hospital] = await Promise.all([
        findNearestAmenity('police', userLat, userLon, 8000),
        findNearestAmenity('hospital', userLat, userLon, 8000)
      ]);

      sosPolice.textContent = police
        ? `Nearest Police: ${police.name} (${police.distance.toFixed(1)} km away)`
        : 'Nearest Police: none found within 8km on OpenStreetMap — dial 100 or 112.';

      sosHospital.textContent = hospital
        ? `Nearest Hospital: ${hospital.name} (${hospital.distance.toFixed(1)} km away)`
        : 'Nearest Hospital: none found within 8km on OpenStreetMap — dial 108.';
    } catch (err) {
      sosPolice.textContent = 'Could not fetch nearby police station (network issue) — dial 100 or 112.';
      sosHospital.textContent = 'Could not fetch nearby hospital (network issue) — dial 108.';
    }
  }

  if (sosBtn) sosBtn.addEventListener('click', fetchEmergencyInfo);
  document.querySelectorAll('.quick-emergency').forEach(function (btn) {
    btn.addEventListener('click', fetchEmergencyInfo);
  });
  document.querySelectorAll('.play-phrase').forEach(function (btn) {
    btn.addEventListener('click', function () {
      alert('Audio playback would play here (browser Text-to-Speech can be wired in later).');
    });
  });

  // ---------- EMERGENCY PAGE: real live location via browser GPS ----------
  const locationText = document.getElementById('location-text');
  const locationMapContainer = document.getElementById('location-map-container');

  function initLiveLocation() {
    if (!locationText || !locationMapContainer) return; // not on emergency page

    if (!('geolocation' in navigator)) {
      locationText.textContent = 'Geolocation not supported by this browser.';
      return;
    }

    navigator.geolocation.getCurrentPosition(async function (pos) {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const accuracy = Math.round(pos.coords.accuracy);
      userLat = lat;
      userLon = lon;

      // Show coordinates immediately
      locationText.textContent = `Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)} (Accuracy: ${accuracy}m)`;

      // Embed a live OpenStreetMap centered on the real coordinates (no API key needed)
      const delta = 0.01;
      const bbox = [lon - delta, lat - delta, lon + delta, lat + delta].join('%2C');
      locationMapContainer.innerHTML = `<iframe class="w-full h-full border-0" src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}"></iframe>`;

      // Reverse-geocode to a human-readable place name (free, no API key)
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`);
        const geoData = await geoRes.json();
        if (geoData && geoData.display_name) {
          locationText.textContent = `${geoData.display_name} (Accuracy: ${accuracy}m)`;
        }
      } catch (e) {
        // If reverse geocoding fails, coordinates already shown above are enough
      }
    }, function (err) {
      locationText.textContent = 'Location permission denied. Please allow location access in your browser to see live SOS location.';
    }, { enableHighAccuracy: true, timeout: 10000 });
  }

  initLiveLocation();

  // ---------- TRANSLATE PAGE ----------
  const translateInput = document.getElementById('translate-input');
  const translateBtn = document.getElementById('translate-btn');
  const translateTarget = document.getElementById('translate-target');
  const translateOutput = document.getElementById('translate-output');
  const translateClearBtn = document.getElementById('translate-clear-btn');
  const translateCopyBtn = document.getElementById('translate-copy-btn');

  async function doTranslate() {
    const text = translateInput.value.trim();
    const target = translateTarget.value;
    if (!text) return;
    translateOutput.textContent = 'Translating...';
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text, target: target })
      });
      const data = await res.json();
      translateOutput.textContent = data.translated_text;
    } catch (err) {
      translateOutput.textContent = 'Could not reach the server. Is the Flask backend running?';
    }
  }

  if (translateBtn) translateBtn.addEventListener('click', doTranslate);
  if (translateClearBtn) translateClearBtn.addEventListener('click', function () {
    translateInput.value = '';
    translateOutput.textContent = 'Translation will appear here.';
  });
  if (translateCopyBtn) translateCopyBtn.addEventListener('click', function () {
    navigator.clipboard.writeText(translateOutput.textContent);
  });
  document.querySelectorAll('.quick-phrase').forEach(function (card) {
    card.addEventListener('click', function () {
      translateInput.value = card.getAttribute('data-phrase');
      doTranslate();
    });
  });

  // ---------- PROFILE PAGE: create / view / edit ----------
  const profileFormSection = document.getElementById('profile-form-section');
  const profileViewSection = document.getElementById('profile-view-section');
  const profileDetailsWrapper = document.getElementById('profile-details-wrapper');
  const profileForm = document.getElementById('profile-form');
  const profileFormError = document.getElementById('profile-form-error');
  const profileNameInput = document.getElementById('profile-name-input');
  const profileEmailInput = document.getElementById('profile-email-input');
  const profileEmergencyNameInput = document.getElementById('profile-emergency-name-input');
  const profileEmergencyRelationInput = document.getElementById('profile-emergency-relation-input');

  const profileAvatar = document.getElementById('profile-avatar');
  const profileNameEl = document.getElementById('profile-name');
  const profileEmailEl = document.getElementById('profile-email');
  const profileEditBtn = document.getElementById('profile-edit-btn');
  const profileEmergencyContactName = document.getElementById('profile-emergency-contact-name');
  const profileEmergencyContactRelation = document.getElementById('profile-emergency-contact-relation');

  function showProfileForm(existing) {
    profileFormSection.classList.remove('hidden');
    profileViewSection.classList.add('hidden');
    profileDetailsWrapper.classList.add('hidden');
    if (existing) {
      profileNameInput.value = existing.name || '';
      profileEmailInput.value = existing.email || '';
      profileEmergencyNameInput.value = existing.emergency_name || '';
      profileEmergencyRelationInput.value = existing.emergency_relation || '';
    } else {
      profileForm.reset();
    }
    profileFormError.classList.add('hidden');
  }

  function showProfileView(profile) {
    profileFormSection.classList.add('hidden');
    profileViewSection.classList.remove('hidden');
    profileDetailsWrapper.classList.remove('hidden');

    profileNameEl.textContent = profile.name;
    profileEmailEl.textContent = profile.email || '';
    const initials = profile.name.split(' ').map(function (p) { return p[0]; }).join('').slice(0, 2).toUpperCase();
    profileAvatar.textContent = initials;

    if (profile.emergency_name) {
      profileEmergencyContactName.textContent = profile.emergency_name;
      profileEmergencyContactRelation.textContent = profile.emergency_relation || '';
    } else {
      profileEmergencyContactName.textContent = 'Not set';
      profileEmergencyContactRelation.textContent = '';
    }
  }

  async function loadProfile() {
    if (!profileFormSection) return; // not on profile page
    try {
      const res = await fetch('/api/profile', { credentials: 'same-origin' });
      const data = await res.json();
      if (data.exists) {
        showProfileView(data.profile);
      } else {
        showProfileForm(null);
      }
    } catch (err) {
      showProfileForm(null);
    }
  }

  if (profileForm) {
    profileForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const name = profileNameInput.value.trim();
      if (!name) {
        profileFormError.textContent = 'Name is required.';
        profileFormError.classList.remove('hidden');
        return;
      }
      try {
        const res = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            name: name,
            email: profileEmailInput.value.trim(),
            emergency_name: profileEmergencyNameInput.value.trim(),
            emergency_relation: profileEmergencyRelationInput.value.trim()
          })
        });
        const data = await res.json();
        if (data.success) {
          showProfileView(data.profile);
        } else {
          profileFormError.textContent = data.error || 'Could not save profile.';
          profileFormError.classList.remove('hidden');
        }
      } catch (err) {
        profileFormError.textContent = 'Could not reach the server. Is the Flask backend running?';
        profileFormError.classList.remove('hidden');
      }
    });
  }

  if (profileEditBtn) {
    profileEditBtn.addEventListener('click', async function () {
      try {
        const res = await fetch('/api/profile', { credentials: 'same-origin' });
        const data = await res.json();
        showProfileForm(data.profile);
      } catch (err) {
        showProfileForm(null);
      }
    });
  }

  loadProfile();

});