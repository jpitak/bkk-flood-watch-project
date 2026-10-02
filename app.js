/**
 * BKK Flood Watch – Main App (GitHub Pages compatible)
 */
(function () {
  'use strict';

  function start() {
    if (typeof window.BKK_DATA === 'undefined') {
      console.error('[BKK] data.js not loaded');
      return;
    }
    if (typeof L === 'undefined') {
      console.warn('[BKK] Leaflet not loaded yet, retry...');
      setTimeout(start, 300);
      return;
    }
    init();
  }

  const D = window.BKK_DATA;
  let map = null;
  let userMarker = null;
  let stationMarkers = [];
  let cameraMarkers = [];
  let userLat = null;
  let userLng = null;
  let layers = { road: true, canal: true, rainfall: true, cctv: true };

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
    D.districts.forEach(function (d) {
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
    } catch (e) { return '—'; }
  }

  function nowStr() {
    return new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  }

  const QUEUE_KEY = 'bkk_offline_queue';
  function getQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function addToQueue(payload) {
    const q = getQueue();
    q.push({ id: 'q-' + Date.now(), payload: payload, created_at: new Date().toISOString(), synced: false });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  }
  function syncQueue() {
    const q = getQueue();
    const pending = q.filter(function (i) { return !i.synced; });
    if (!pending.length) return;
    pending.forEach(function (i) { i.synced = true; });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  }

  function updateDashboard() {
    const active = D.stations.filter(function (s) { return s.active; });
    const floods = active.filter(function (s) { return s.status === 'flood' || s.status === 'critical'; });
    const waters = active.filter(function (s) { return s.water_cm != null; }).map(function (s) { return s.water_cm; });
    const maxWater = waters.length ? Math.max.apply(null, waters) : null;
    const rain = active.filter(function (s) { return s.type === 'rainfall'; })[0];

    let overall = 'normal';
    if (floods.some(function (s) { return s.status === 'critical'; })) overall = 'critical';
    else if (floods.length) overall = 'flood';
    else if (active.some(function (s) { return s.status === 'watch'; })) overall = 'watch';

    const badge = document.getElementById('status-badge');
    if (badge) {
      badge.className = 'status-badge ' + overall;
      badge.textContent = D.STATUS_LABEL[overall];
    }

    var el;
    el = document.getElementById('max-water');
    if (el) el.textContent = maxWater != null ? maxWater + ' ซม.' : '—';
    el = document.getElementById('rainfall');
    if (el) el.textContent = rain && rain.rainfall_mm != null ? rain.rainfall_mm + ' มม.' : '—';
    el = document.getElementById('alert-count');
    if (el) el.textContent = String(floods.length);

    var nearestKm = null;
    if (userLat != null && floods.length) {
      var min = Infinity;
      floods.forEach(function (s) {
        var km = haversineKm(userLat, userLng, s.lat, s.lng);
        if (km < min) min = km;
      });
      nearestKm = Math.round(min * 10) / 10;
    } else if (floods.length) {
      nearestKm = 1.8;
    }
    el = document.getElementById('nearest-flood');
    if (el) el.textContent = nearestKm != null ? nearestKm + ' กม.' : 'ไม่มี';

    el = document.getElementById('last-updated');
    if (el) el.textContent = formatTime(new Date().toISOString());
    el = document.getElementById('sync-time');
    if (el) el.textContent = nowStr();

    // Audit times
    ['audit-t1', 'audit-t2', 'audit-t3'].forEach(function (id, i) {
      var a = document.getElementById(id);
      if (a) {
        var d = new Date(Date.now() - (i + 1) * 300000);
        a.textContent = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      }
    });
  }

  function renderHistory() {
    var tbody = document.querySelector('#history-table tbody');
    if (!tbody) return;
    tbody.innerHTML = D.history.map(function (row) {
      var trendIcon = row.trend === 'up'
        ? '<span class="trend-up">↑</span>'
        : row.trend === 'down'
        ? '<span class="trend-down">↓</span>'
        : '–';
      return '<tr><td><strong>' + row.label + '</strong></td>' +
        '<td class="r">' + row.rainfall.toFixed(1) + ' มม.</td>' +
        '<td class="r">' + row.max_water + ' ซม.</td>' +
        '<td class="r">' + row.flood_points + '</td>' +
        '<td><span class="pill ' + row.status + '">' + D.STATUS_LABEL[row.status] + '</span></td>' +
        '<td class="c">' + trendIcon + '</td></tr>';
    }).join('');
  }

  function renderForecast() {
    var el = document.getElementById('forecast-list');
    if (!el) return;
    el.innerHTML = D.forecasts.map(function (f) {
      return '<div class="forecast-item"><div class="fc-top">' +
        '<span class="fc-day">' + f.day + '</span>' +
        '<span class="pill ' + f.risk + '">' + D.STATUS_LABEL[f.risk] + '</span></div>' +
        '<p class="fc-rain">ฝนคาดการณ์: ' + f.rain + '</p>' +
        '<p class="fc-advice">ความเชื่อมั่น: ' + f.confidence + ' · ' + f.advice + '</p>' +
        (f.confidence === 'ต่ำ' ? '<p class="fc-low">ข้อมูลอาจเปลี่ยนแปลง</p>' : '') +
        '</div>';
    }).join('');
  }

  function initMap() {
    var mapEl = document.getElementById('map');
    if (!mapEl) return;
    try {
      map = L.map('map', { zoomControl: true }).setView([13.7563, 100.5018], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
      }).addTo(map);
      setTimeout(function () { map.invalidateSize(); }, 100);
      setTimeout(function () { if (map) map.invalidateSize(); }, 500);
      setTimeout(function () { if (map) map.invalidateSize(); }, 1200);
      renderMarkers();
    } catch (err) {
      console.error('[BKK] Map init failed', err);
      mapEl.innerHTML = '<div style="padding:24px;text-align:center;color:#64748b">ไม่สามารถโหลดแผนที่ได้<br>ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</div>';
    }
  }

  function clearMarkers() {
    if (!map) return;
    stationMarkers.forEach(function (m) { map.removeLayer(m); });
    cameraMarkers.forEach(function (m) { map.removeLayer(m); });
    stationMarkers = [];
    cameraMarkers = [];
  }

  function renderMarkers() {
    if (!map) return;
    clearMarkers();
    D.stations.forEach(function (s) {
      var show =
        ((s.type === 'road' || s.type === 'tunnel') && layers.road) ||
        (s.type === 'canal' && layers.canal) ||
        (s.type === 'rainfall' && layers.rainfall);
      if (!show) return;
      var color = D.STATUS_COLOR[s.status] || '#9ca3af';
      var marker = L.circleMarker([s.lat, s.lng], {
        radius: 10, color: color, fillColor: color, fillOpacity: 0.85, weight: 2
      }).addTo(map);
      var typeLabel = s.type === 'road' ? 'จุดวัดน้ำถนน' : s.type === 'canal' ? 'จุดวัดคลอง' : s.type === 'rainfall' ? 'สถานีฝน' : 'อุโมงค์';
      var html = '<strong>' + s.name + '</strong><br><span style="color:#64748b;font-size:11px">' + typeLabel + '</span><br>เขต: <strong>' + s.district + '</strong><br>';
      if (s.water_cm != null) html += 'ระดับน้ำถนน: <strong>' + s.water_cm + ' ซม.</strong><br>';
      if (s.canal_m != null) html += 'ระดับคลอง: <strong>' + s.canal_m + ' ม.</strong><br>';
      if (s.rainfall_mm != null) html += 'ฝน: <strong>' + s.rainfall_mm + ' มม.</strong><br>';
      html += 'สถานะ: <strong style="color:' + color + '">' + D.STATUS_LABEL[s.status] + '</strong><br>';
      html += '<span style="font-size:11px;color:#94a3b8">อัปเดต: ' + formatTime(s.measured_at) + '</span>';
      if (!s.active) html += '<br><span style="color:#ef4444;font-size:11px">อุปกรณ์ขัดข้อง</span>';
      marker.bindPopup(html);
      stationMarkers.push(marker);
    });
    if (layers.cctv) {
      D.cameras.forEach(function (c) {
        var m = L.marker([c.lat, c.lng]).addTo(map);
        m.bindPopup('<strong>' + c.name + '</strong><br>สถานะ: ' + (c.status === 'online' ? 'ออนไลน์' : 'ออฟไลน์') +
          '<br><span style="font-size:11px;color:#94a3b8">(Demo)</span>');
        cameraMarkers.push(m);
      });
    }
  }

  function updateUserMarker() {
    if (!map) return;
    if (userMarker) map.removeLayer(userMarker);
    if (userLat == null) return;
    userMarker = L.circleMarker([userLat, userLng], {
      radius: 12, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.9, weight: 3
    }).addTo(map);
    userMarker.bindPopup('<strong style="color:#1d4ed8">ตำแหน่งของคุณ</strong>');
    map.setView([userLat, userLng], 13);
  }

  function locate() {
    var btn = document.getElementById('btn-locate');
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ไม่รองรับ Geolocation');
      return;
    }
    if (btn) { btn.disabled = true; btn.textContent = 'กำลังหา...'; }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;
        var d = findNearestDistrict(userLat, userLng);
        var el = document.getElementById('user-district');
        if (el) el.textContent = 'เขต' + d.name;
        updateUserMarker();
        updateDashboard();
        if (btn) { btn.disabled = false; btn.textContent = '📍 ใช้ตำแหน่ง'; }
      },
      function (err) {
        console.error(err);
        alert('ไม่สามารถระบุตำแหน่งได้ กรุณาอนุญาต Location');
        if (btn) { btn.disabled = false; btn.textContent = '📍 ใช้ตำแหน่ง'; }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function updateOnlineStatus() {
    var badge = document.getElementById('online-badge');
    if (!badge) return;
    if (navigator.onLine) {
      badge.className = 'badge online';
      badge.innerHTML = '<span class="dot"></span> Online';
      syncQueue();
    } else {
      badge.className = 'badge offline';
      badge.innerHTML = '<span class="dot"></span> Offline';
    }
  }

  function handleReport() {
    var payload = {
      type: 'flood_report',
      message: 'พบน้ำท่วมขัง (Demo)',
      lat: userLat,
      lng: userLng,
      created_at: new Date().toISOString()
    };
    if (!navigator.onLine) {
      addToQueue(payload);
      alert('บันทึกลง offline queue แล้ว จะ sync เมื่อกลับมาออนไลน์');
    } else {
      console.log('[Report]', payload);
      alert('ส่งรายงานเรียบร้อย (Demo)');
    }
  }

  function showDataModal() {
    var sample = {
      stations: D.stations.slice(0, 2),
      history: D.history.slice(0, 2),
      forecasts: D.forecasts.slice(0, 2),
      note: 'Mock Data สำหรับ Demo – แยก Near Real-time / ย้อนหลัง 5 วัน / คาดการณ์ 5 วัน'
    };
    var body = document.getElementById('modal-body');
    var modal = document.getElementById('modal');
    if (body) body.textContent = JSON.stringify(sample, null, 2);
    if (modal) modal.classList.remove('hidden');
  }

  function init() {
    var now = new Date().toISOString();
    D.stations.forEach(function (s) { s.measured_at = now; });

    initMap();
    updateDashboard();
    renderHistory();
    renderForecast();
    updateOnlineStatus();

    var btnLocate = document.getElementById('btn-locate');
    if (btnLocate) btnLocate.addEventListener('click', locate);

    var btnRefresh = document.getElementById('btn-refresh');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', function () {
        this.classList.add('spin');
        var n = new Date().toISOString();
        D.stations.forEach(function (s) { s.measured_at = n; });
        updateDashboard();
        renderMarkers();
        var self = this;
        setTimeout(function () { self.classList.remove('spin'); }, 600);
      });
    }

    var btnReport = document.getElementById('btn-report');
    if (btnReport) btnReport.addEventListener('click', handleReport);

    var btnApi = document.getElementById('btn-show-api');
    if (btnApi) btnApi.addEventListener('click', showDataModal);

    var modalClose = document.getElementById('modal-close');
    if (modalClose) {
      modalClose.addEventListener('click', function () {
        document.getElementById('modal').classList.add('hidden');
      });
    }
    var modal = document.getElementById('modal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target.id === 'modal') e.target.classList.add('hidden');
      });
    }

    document.querySelectorAll('.layer-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-layer');
        layers[key] = !layers[key];
        btn.classList.toggle('active', layers[key]);
        renderMarkers();
      });
    });

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
