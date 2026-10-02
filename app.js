/**
 * BKK Flood Watch – Main App Logic (Static / GitHub Pages)
 */
(function () {
  'use strict';

  const D = window.BKK_DATA;
  let map = null;
  let userMarker = null;
  let stationMarkers = [];
  let cameraMarkers = [];
  let userLat = null;
  let userLng = null;
  let layers = { road: true, canal: true, rainfall: true, cctv: true };

  // ---------- Helpers ----------
  function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function findNearestDistrict(lat, lng) {
    let nearest = D.districts[0];
    let min = Infinity;
    D.districts.forEach(d => {
      const dist = haversineKm(lat, lng, d.lat, d.lng);
      if (dist < min) { min = dist; nearest = d; }
    });
    return nearest;
  }

  function formatTime(iso) {
    try {
      return new Date(iso).toLocaleString('th-TH', {
        hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short'
      });
    } catch { return '—'; }
  }

  function nowStr() {
    return new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  }

  // ---------- Offline Queue (localStorage) ----------
  const QUEUE_KEY = 'bkk_offline_queue';

  function getQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
    catch { return []; }
  }

  function addToQueue(payload) {
    const q = getQueue();
    q.push({ id: 'q-' + Date.now(), payload, created_at: new Date().toISOString(), synced: false });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  }

  function syncQueue() {
    const q = getQueue();
    const pending = q.filter(i => !i.synced);
    if (!pending.length) return;
    // Demo: mark as synced
    pending.forEach(i => { i.synced = true; });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
    console.log('[Offline Queue] synced', pending.length, 'items');
  }

  // ---------- Dashboard ----------
  function updateDashboard() {
    const active = D.stations.filter(s => s.active);
    const floods = active.filter(s => s.status === 'flood' || s.status === 'critical');
    const waters = active.filter(s => s.water_cm != null).map(s => s.water_cm);
    const maxWater = waters.length ? Math.max(...waters) : null;
    const rain = active.find(s => s.type === 'rainfall');

    let overall = 'normal';
    if (floods.some(s => s.status === 'critical')) overall = 'critical';
    else if (floods.length) overall = 'flood';
    else if (active.some(s => s.status === 'watch')) overall = 'watch';

    const badge = document.getElementById('status-badge');
    badge.className = 'status-badge ' + overall;
    badge.textContent = D.STATUS_LABEL[overall];

    document.getElementById('max-water').textContent =
      maxWater != null ? maxWater + ' ซม.' : '—';
    document.getElementById('rainfall').textContent =
      rain && rain.rainfall_mm != null ? rain.rainfall_mm + ' มม.' : '—';
    document.getElementById('alert-count').textContent = floods.length;

    let nearestKm = null;
    if (userLat != null && floods.length) {
      let min = Infinity;
      floods.forEach(s => {
        const km = haversineKm(userLat, userLng, s.lat, s.lng);
        if (km < min) min = km;
      });
      nearestKm = Math.round(min * 10) / 10;
    } else if (floods.length) {
      nearestKm = 1.8; // demo default
    }
    document.getElementById('nearest-flood').textContent =
      nearestKm != null ? nearestKm + ' กม.' : 'ไม่มี';

    document.getElementById('last-updated').textContent = formatTime(new Date().toISOString());
    document.getElementById('sync-time').textContent = nowStr();
  }

  // ---------- History Table ----------
  function renderHistory() {
    const tbody = document.querySelector('#history-table tbody');
    tbody.innerHTML = D.history.map(row => {
      const trendIcon = row.trend === 'up'
        ? '<span class="trend-up">↑</span>'
        : row.trend === 'down'
        ? '<span class="trend-down">↓</span>'
        : '–';
      return `<tr>
        <td><strong>${row.label}</strong></td>
        <td class="r">${row.rainfall.toFixed(1)} มม.</td>
        <td class="r">${row.max_water} ซม.</td>
        <td class="r">${row.flood_points}</td>
        <td><span class="pill ${row.status}">${D.STATUS_LABEL[row.status]}</span></td>
        <td class="c">${trendIcon}</td>
      </tr>`;
    }).join('');
  }

  // ---------- Forecast ----------
  function renderForecast() {
    const el = document.getElementById('forecast-list');
    el.innerHTML = D.forecasts.map(f => `
      <div class="forecast-item">
        <div class="fc-top">
          <span class="fc-day">${f.day}</span>
          <span class="pill ${f.risk}">${D.STATUS_LABEL[f.risk]}</span>
        </div>
        <p class="fc-rain">ฝนคาดการณ์: ${f.rain}</p>
        <p class="fc-advice">ความเชื่อมั่น: ${f.confidence} · ${f.advice}</p>
        ${f.confidence === 'ต่ำ' ? '<p class="fc-low">ข้อมูลอาจเปลี่ยนแปลง – ตรวจสอบก่อนเดินทาง</p>' : ''}
      </div>
    `).join('');
  }

  // ---------- Map ----------
  function initMap() {
    map = L.map('map', { zoomControl: true }).setView([13.7563, 100.5018], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(map);
    renderMarkers();
  }

  function clearMarkers() {
    stationMarkers.forEach(m => map.removeLayer(m));
    cameraMarkers.forEach(m => map.removeLayer(m));
    stationMarkers = [];
    cameraMarkers = [];
  }

  function renderMarkers() {
    clearMarkers();

    D.stations.forEach(s => {
      const show =
        ((s.type === 'road' || s.type === 'tunnel') && layers.road) ||
        (s.type === 'canal' && layers.canal) ||
        (s.type === 'rainfall' && layers.rainfall);
      if (!show) return;

      const color = D.STATUS_COLOR[s.status] || '#9ca3af';
      const marker = L.circleMarker([s.lat, s.lng], {
        radius: 10,
        color: color,
        fillColor: color,
        fillOpacity: 0.85,
        weight: 2
      }).addTo(map);

      let html = `<strong>${s.name}</strong><br>
        <span style="color:#64748b;font-size:11px">${
          s.type === 'road' ? 'จุดวัดน้ำถนน' :
          s.type === 'canal' ? 'จุดวัดคลอง' :
          s.type === 'rainfall' ? 'สถานีฝน' : 'อุโมงค์'
        }</span><br>
        เขต: <strong>${s.district}</strong><br>`;
      if (s.water_cm != null) html += `ระดับน้ำถนน: <strong>${s.water_cm} ซม.</strong><br>`;
      if (s.canal_m != null) html += `ระดับคลอง: <strong>${s.canal_m} ม.</strong><br>`;
      if (s.rainfall_mm != null) html += `ฝน: <strong>${s.rainfall_mm} มม.</strong><br>`;
      html += `สถานะ: <strong style="color:${color}">${D.STATUS_LABEL[s.status]}</strong><br>`;
      html += `<span style="font-size:11px;color:#94a3b8">อัปเดต: ${formatTime(s.measured_at)}</span>`;
      if (!s.active) html += `<br><span style="color:#ef4444;font-size:11px">อุปกรณ์ขัดข้อง</span>`;

      marker.bindPopup(html);
      stationMarkers.push(marker);
    });

    if (layers.cctv) {
      D.cameras.forEach(c => {
        const m = L.marker([c.lat, c.lng]).addTo(map);
        m.bindPopup(`<strong>${c.name}</strong><br>
          สถานะ: ${c.status === 'online' ? 'ออนไลน์' : 'ออฟไลน์'}<br>
          <span style="font-size:11px;color:#94a3b8">(Demo – เปิดลิงก์ต้นทางใน production)</span>`);
        cameraMarkers.push(m);
      });
    }
  }

  function updateUserMarker() {
    if (userMarker) map.removeLayer(userMarker);
    if (userLat == null) return;
    userMarker = L.circleMarker([userLat, userLng], {
      radius: 12, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.9, weight: 3
    }).addTo(map);
    userMarker.bindPopup('<strong style="color:#1d4ed8">ตำแหน่งของคุณ</strong>');
    map.setView([userLat, userLng], 13);
  }

  // ---------- Locate ----------
  function locate() {
    const btn = document.getElementById('btn-locate');
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ไม่รองรับ Geolocation');
      return;
    }
    btn.disabled = true;
    btn.textContent = 'กำลังหา...';
    navigator.geolocation.getCurrentPosition(
      pos => {
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;
        const d = findNearestDistrict(userLat, userLng);
        document.getElementById('user-district').textContent = 'เขต' + d.name;
        updateUserMarker();
        updateDashboard();
        btn.disabled = false;
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg> ใช้ตำแหน่ง';
      },
      err => {
        console.error(err);
        alert('ไม่สามารถระบุตำแหน่งได้ กรุณาอนุญาต Location');
        btn.disabled = false;
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg> ใช้ตำแหน่ง';
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // ---------- Online / Offline ----------
  function updateOnlineStatus() {
    const badge = document.getElementById('online-badge');
    if (navigator.onLine) {
      badge.className = 'badge online';
      badge.innerHTML = '<span class="dot"></span> Online';
      syncQueue();
    } else {
      badge.className = 'badge offline';
      badge.innerHTML = '<span class="dot"></span> Offline';
    }
  }

  // ---------- Report ----------
  function handleReport() {
    const payload = {
      type: 'flood_report',
      message: 'พบน้ำท่วมขัง (Demo)',
      lat: userLat,
      lng: userLng,
      created_at: new Date().toISOString()
    };
    if (!navigator.onLine) {
      addToQueue(payload);
      alert('บันทึกลง Offline queue แล้ว จะ sync เมื่อกลับมาออนไลน์');
    } else {
      console.log('[Report]', payload);
      alert('ส่งรายงานเรียบร้อย (Demo)');
    }
  }

  // ---------- Modal ----------
  function showDataModal() {
    const sample = {
      stations: D.stations.slice(0, 2),
      history: D.history.slice(0, 2),
      forecasts: D.forecasts.slice(0, 2),
      note: 'ข้อมูลทั้งหมดเป็น Mock Data สำหรับ Demo'
    };
    document.getElementById('modal-body').textContent = JSON.stringify(sample, null, 2);
    document.getElementById('modal').classList.remove('hidden');
  }

  // ---------- Init ----------
  function init() {
    // Stamp measured_at
    const now = new Date().toISOString();
    D.stations.forEach(s => { s.measured_at = now; });

    initMap();
    updateDashboard();
    renderHistory();
    renderForecast();
    updateOnlineStatus();

    // Events
    document.getElementById('btn-locate').addEventListener('click', locate);
    document.getElementById('btn-refresh').addEventListener('click', function () {
      this.classList.add('spin');
      const now = new Date().toISOString();
      D.stations.forEach(s => { s.measured_at = now; });
      updateDashboard();
      renderMarkers();
      setTimeout(() => this.classList.remove('spin'), 600);
    });
    document.getElementById('btn-report').addEventListener('click', handleReport);
    document.getElementById('btn-show-api').addEventListener('click', showDataModal);
    document.getElementById('modal-close').addEventListener('click', () => {
      document.getElementById('modal').classList.add('hidden');
    });
    document.getElementById('modal').addEventListener('click', e => {
      if (e.target.id === 'modal') e.target.classList.add('hidden');
    });

    // Layer toggles
    document.querySelectorAll('.layer-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.layer;
        layers[key] = !layers[key];
        btn.classList.toggle('active', layers[key]);
        renderMarkers();
      });
    });

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // PWA service worker (optional, silent fail)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
