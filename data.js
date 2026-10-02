/**
 * BKK Flood Watch – Mock Data (Demo)
 * ข้อมูลตัวอย่างสำหรับ Demo จนกว่าจะเชื่อมต่อ API จริงจาก BMA
 */
window.BKK_DATA = {
  districts: [
    { id: '1030', name: 'ลาดพร้าว', lat: 13.8167, lng: 100.5964 },
    { id: '1001', name: 'พระนคร', lat: 13.7563, lng: 100.5018 },
    { id: '1005', name: 'บางเขน', lat: 13.8736, lng: 100.5964 },
    { id: '1006', name: 'บางกะปิ', lat: 13.7650, lng: 100.6470 },
    { id: '1014', name: 'พญาไท', lat: 13.7800, lng: 100.5420 },
    { id: '1017', name: 'ห้วยขวาง', lat: 13.7760, lng: 100.5790 },
    { id: '1018', name: 'คลองเตย', lat: 13.7100, lng: 100.5700 },
    { id: '1019', name: 'สวนหลวง', lat: 13.7300, lng: 100.6500 }
  ],

  stations: [
    { id: 'RD-001', type: 'road', name: 'ถนนลาดพร้าว ซอย 1', lat: 13.8200, lng: 100.5900, district: 'ลาดพร้าว', districtId: '1030', water_cm: 7, status: 'watch', active: true, measured_at: null },
    { id: 'RD-002', type: 'road', name: 'ถนนวิภาวดีรังสิต', lat: 13.8300, lng: 100.5600, district: 'บางเขน', districtId: '1005', water_cm: 12, status: 'flood', active: true, measured_at: null },
    { id: 'RD-003', type: 'road', name: 'ถนนรัชดาภิเษก', lat: 13.7700, lng: 100.5700, district: 'ห้วยขวาง', districtId: '1017', water_cm: 3, status: 'normal', active: true, measured_at: null },
    { id: 'RD-005', type: 'road', name: 'ถนนพระราม 9', lat: 13.7500, lng: 100.5700, district: 'ห้วยขวาง', districtId: '1017', water_cm: 18, status: 'critical', active: true, measured_at: null },
    { id: 'RD-004', type: 'road', name: 'ถนนสุขุมวิท', lat: 13.7200, lng: 100.5800, district: 'คลองเตย', districtId: '1018', water_cm: null, status: 'unknown', active: false, measured_at: null },
    { id: 'RD-006', type: 'tunnel', name: 'อุโมงค์บางซื่อ', lat: 13.8050, lng: 100.5400, district: 'พญาไท', districtId: '1014', water_cm: 2, status: 'normal', active: true, measured_at: null },
    { id: 'CN-001', type: 'canal', name: 'คลองลาดพร้าว', lat: 13.8150, lng: 100.6000, district: 'ลาดพร้าว', districtId: '1030', canal_m: 1.25, flow: 12.5, status: 'watch', active: true, measured_at: null },
    { id: 'CN-002', type: 'canal', name: 'คลองแสนแสบ', lat: 13.7600, lng: 100.6400, district: 'บางกะปิ', districtId: '1006', canal_m: 1.85, flow: 28.0, status: 'flood', active: true, measured_at: null },
    { id: 'CN-003', type: 'canal', name: 'คลองประปา', lat: 13.7900, lng: 100.5300, district: 'พญาไท', districtId: '1014', canal_m: 0.95, flow: 8.2, status: 'normal', active: true, measured_at: null },
    { id: 'RF-001', type: 'rainfall', name: 'สถานีฝนลาดพร้าว', lat: 13.8180, lng: 100.5950, district: 'ลาดพร้าว', districtId: '1030', rainfall_mm: 15.2, status: 'watch', active: true, measured_at: null }
  ],

  cameras: [
    { id: 'CAM-001', name: 'กล้องถนนลาดพร้าว', lat: 13.8190, lng: 100.5910, status: 'online' },
    { id: 'CAM-002', name: 'กล้องคลองแสนแสบ', lat: 13.7610, lng: 100.6410, status: 'online' },
    { id: 'CAM-003', name: 'กล้องถนนรัชดา', lat: 13.7710, lng: 100.5710, status: 'offline' }
  ],

  history: [
    { label: 'วันนี้', rainfall: 28.5, max_water: 18, flood_points: 4, status: 'critical', trend: 'up' },
    { label: 'เมื่อวาน', rainfall: 12.0, max_water: 9, flood_points: 2, status: 'flood', trend: 'up' },
    { label: '2 วันที่แล้ว', rainfall: 5.5, max_water: 4, flood_points: 0, status: 'normal', trend: 'down' },
    { label: '3 วันที่แล้ว', rainfall: 35.0, max_water: 22, flood_points: 6, status: 'critical', trend: 'up' },
    { label: '4 วันที่แล้ว', rainfall: 8.0, max_water: 6, flood_points: 1, status: 'watch', trend: 'down' }
  ],

  forecasts: [
    { day: 'วันนี้', rain: 'ปานกลาง (15-30 มม.)', risk: 'flood', confidence: 'สูง', advice: 'หลีกเลี่ยงจุดเสี่ยง ตรวจสอบเส้นทางก่อนเดินทาง' },
    { day: 'พรุ่งนี้', rain: 'หนักบางพื้นที่ (30-50 มม.)', risk: 'critical', confidence: 'ปานกลาง', advice: 'วางแผนเส้นทางสำรอง เตรียมอุปกรณ์กันน้ำ' },
    { day: 'วันที่ 3', rain: 'เล็กน้อย (5-15 มม.)', risk: 'watch', confidence: 'ปานกลาง', advice: 'ติดตามข้อมูลต่อเนื่อง' },
    { day: 'วันที่ 4', rain: 'มีโอกาสฝน (0-10 มม.)', risk: 'watch', confidence: 'ต่ำ', advice: 'ตรวจสอบก่อนเดินทาง ข้อมูลอาจเปลี่ยนแปลง' },
    { day: 'วันที่ 5', rain: 'มีโอกาสฝน (0-10 มม.)', risk: 'normal', confidence: 'ต่ำ', advice: 'ข้อมูลอาจเปลี่ยนแปลง ติดตามอัปเดต' }
  ],

  STATUS_LABEL: {
    normal: 'ปกติ',
    watch: 'เฝ้าระวัง',
    flood: 'น้ำท่วมขัง',
    critical: 'น้ำท่วมสูง / วิกฤต',
    unknown: 'ไม่มีข้อมูล'
  },

  STATUS_COLOR: {
    normal: '#22c55e',
    watch: '#eab308',
    flood: '#f97316',
    critical: '#ef4444',
    unknown: '#9ca3af'
  }
};

// ตั้ง measured_at เป็นเวลาปัจจุบัน
(function () {
  const now = new Date().toISOString();
  window.BKK_DATA.stations.forEach(s => { s.measured_at = now; });
})();
