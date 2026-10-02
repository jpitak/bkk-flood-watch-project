# BKK Flood Watch – ระบบติดตามและเฝ้าระวังน้ำท่วมกรุงเทพมหานคร

**Static HTML / PWA** พร้อมเปิดบน **GitHub Pages** ได้ทันที (ไม่ต้อง build)

> ข้อมูลทั้งหมดเป็น **Demo / Mock Data**  
> ใช้เป็นมาตรฐานตั้งต้นก่อนเชื่อมต่อ API จริงจาก BMA

---

## เปิดดูทันที (ไม่ต้องติดตั้งอะไร)

1. แตกไฟล์ zip
2. เปิดไฟล์ `index.html` ด้วยเบราว์เซอร์  
   หรือใช้ Live Server / Python: `python -m http.server 8080`

---

## วิธี Deploy บน GitHub Pages

### วิธีที่ 1: Upload ผ่านเว็บ GitHub
1. สร้าง Repository ใหม่บน GitHub (เช่น `bkk-flood-watch`)
2. ไปที่ **Add file → Upload files**
3. ลากไฟล์ทั้งหมดในโฟลเดอร์นี้ขึ้นไป → Commit
4. ไปที่ **Settings → Pages**
5. Source เลือก **Deploy from a branch** → Branch: `main` / folder: `/ (root)`
6. รอ 1–2 นาที แล้วเปิด  
   `https://<username>.github.io/bkk-flood-watch/`

### วิธีที่ 2: ใช้ Git CLI
```bash
git init
git add .
git commit -m "Initial BKK Flood Watch static demo"
git branch -M main
git remote add origin https://github.com/<username>/bkk-flood-watch.git
git push -u origin main
```
จากนั้นตั้งค่า Pages ตามขั้นตอนด้านบน

---

## คุณสมบัติที่มี

| ฟีเจอร์ | สถานะ |
|---------|--------|
| Mobile First + Responsive | ✅ |
| แผนที่ Leaflet (OpenStreetMap) | ✅ |
| Layer เปิด/ปิด (น้ำถนน / คลอง / ฝน / CCTV) | ✅ |
| Geolocation → ระบุเขตใกล้สุด | ✅ |
| Dashboard สรุปสถานการณ์ | ✅ |
| ตารางย้อนหลัง 5 วัน | ✅ |
| คาดการณ์ความเสี่ยง 5 วัน + Disclaimer | ✅ |
| Online / Offline indicator | ✅ |
| Offline Queue (localStorage) | ✅ |
| PWA (manifest + Service Worker) | ✅ พื้นฐาน |
| เปิดบน GitHub Pages ได้ทันที | ✅ |

---

## โครงสร้างไฟล์

```
bkk-flood-watch-github/
├── index.html          ← หน้าหลัก
├── css/styles.css
├── js/
│   ├── data.js         ← Mock data
│   └── app.js          ← Logic + แผนที่
├── sw.js               ← Service Worker
├── manifest.json
├── icons/
├── docs/schema.sql     ← Schema สำหรับ production
└── README.md
```

---

## ความหมายของข้อมูล

| ประเภท | ความหมาย |
|--------|----------|
| Near Real-time | ข้อมูลล่าสุดตามรอบ (Demo ใช้เวลาปัจจุบัน) |
| ย้อนหลัง 5 วัน | Snapshot ที่ระบบเก็บเอง |
| ล่วงหน้า 5 วัน | ระดับความเสี่ยงจากพยากรณ์ฝน **ไม่ใช่** ระดับน้ำเป็นซม. |
| CCTV | แสดงหมุด – ฝัง stream ต้องได้รับอนุญาตก่อน |

---

## ขั้นตอนถัดไป (Production)

1. เชื่อม Data Collector จาก  
   - https://floodbangkok.bangkok.go.th/  
   - https://bmawaterflow.bangkok.go.th/  
   - https://nowcast.bangkok.go.th/  
   - https://bangkok.thaiwater.net/  
2. ใช้ `docs/schema.sql` (PostgreSQL + PostGIS)
3. เปลี่ยนจาก Mock ใน `js/data.js` เป็นเรียก REST API จริง
4. เพิ่ม Polygon เขตจริงสำหรับ point-in-polygon

---

## License / หมายเหตุ

Starter template สำหรับใช้ภายในองค์กร  
ข้อมูล Mock ไม่เกี่ยวข้องกับข้อมูลจริงของกรุงเทพมหานคร
