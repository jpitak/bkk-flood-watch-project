# BKK Flood Watch – ระบบติดตามและเฝ้าระวังน้ำท่วมกรุงเทพมหานคร

**Static HTML + PWA** พร้อมเปิดบน **GitHub Pages** ได้ทันที

> ข้อมูลเป็น **Demo / Mock** · แยกชัด: Near Real-time · ย้อนหลัง 5 วัน · คาดการณ์ 5 วัน

---

## ⚠️ วิธี Deploy บน GitHub ให้ถูกต้อง

### สำคัญมาก
ไฟล์ทั้งหมดต้องอยู่ที่ **root ของ repository** (ไม่ใช่ซ้อนในโฟลเดอร์อีกชั้น)

โครงสร้างที่ถูกต้องบน GitHub:
```
your-repo/
  index.html
  css/styles.css
  js/app.js
  js/data.js
  manifest.json
  sw.js
  .nojekyll
  icons/
  docs/
  README.md
```

### ขั้นตอน
1. สร้าง Repository ใหม่บน GitHub (Public)
2. **Upload files** → เลือกไฟล์ **ภายใน** โฟลเดอร์นี้ทั้งหมด (index.html, css, js, ...)
3. **อย่า** อัปโหลดโฟลเดอร์ `bkk-flood-watch-github` ทั้งก้อนเป็นชั้นใน
4. Settings → Pages → Source: **Deploy from a branch** → `main` → `/ (root)`
5. รอ 1–2 นาที แล้วเปิด `https://<username>.github.io/<repo>/`

### ไฟล์ `.nojekyll`
มีไฟล์นี้แล้ว เพื่อไม่ให้ GitHub Jekyll ประมวลผลผิดพลาด

---

## คุณสมบัติ

| ฟีเจอร์ | สถานะ |
|---------|--------|
| Mobile First + Responsive | ✅ |
| Dashboard (ตำแหน่ง / สถานะ / ระดับน้ำ / ฝน) | ✅ |
| แผนที่ Leaflet + Layer เปิด-ปิด | ✅ |
| Geolocation → ระบุเขต | ✅ |
| ย้อนหลัง 5 วัน (ตาราง) | ✅ |
| คาดการณ์ 5 วัน + Disclaimer | ✅ |
| Offline Queue (localStorage) | ✅ |
| Audit Log (Demo) | ✅ |
| PWA (manifest + Service Worker) | ✅ |
| Online / Offline indicator | ✅ |

---

## เปิดดู Local

```bash
# เปิด index.html ในเบราว์เซอร์
# หรือ
python -m http.server 8080
# แล้วเปิด http://localhost:8080
```

---

## ความหมายของข้อมูล

| ประเภท | ความหมาย |
|--------|----------|
| Near Real-time | ข้อมูลล่าสุดตามรอบ (Demo) |
| ย้อนหลัง 5 วัน | Snapshot ที่ระบบเก็บเอง |
| ล่วงหน้า 5 วัน | ระดับความเสี่ยงจากพยากรณ์ฝน **ไม่ใช่** ระดับน้ำเป็นซม. |

---

## ขั้นตอนถัดไป (Production)

1. เชื่อม Data Collector จาก BMA (floodbangkok, bmawaterflow, nowcast, thaiwater)
2. ใช้ `docs/schema.sql` (PostgreSQL + PostGIS)
3. เปลี่ยน `js/data.js` เป็นเรียก REST API จริง
4. เพิ่ม Next.js / NestJS ตามสถาปัตยกรรม 3-Tier

---

## License

Starter template · ข้อมูล Mock ไม่ใช่ข้อมูลจริงของ กทม.
