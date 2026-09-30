# Tasks Dashboard

Dashboard สำหรับผู้จัดการทีม ใช้ติดตามงาน ทีม และสมาชิก พร้อมประเมินภาระงาน (Workload) ด้วย AI
เป็นเครื่องมือภายในของ efinanceThai — **ยังไม่มีระบบ Login** ใครที่เข้าถึง URL ได้จะเห็นและแก้ข้อมูลได้ทั้งหมด

สถาปัตยกรรมและตรรกะโดยละเอียดอยู่ที่ [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

**Stack:** React 19 + TypeScript, Vite, Tailwind CSS 3, Recharts, Supabase (Postgres + Edge Functions), Gemini (ผ่าน Edge Function)

## เริ่มใช้งาน

ต้องมี Node.js และโปรเจกต์ Supabase ของตัวเอง (ฟรีก็ได้)

```bash
git clone https://github.com/flwerl0v/tasks-dashboard.git
cd tasks-dashboard
npm install
cp .env.example .env
```

1. สร้างตารางในฐานข้อมูล: เปิด Supabase → SQL Editor → รันไฟล์ [supabase/schema.sql](supabase/schema.sql)
2. เปิดไฟล์ `.env` แล้วใส่ค่า (Supabase → Project Settings → API)
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. รัน `npm run dev` แล้วเปิด http://localhost:5173

ถ้าไม่ใส่ค่าใน `.env` แอปจะเปิดได้ แต่ขึ้น "ยังไม่ได้ตั้งค่า Supabase" และไม่มีข้อมูล
ถ้าเปิดแล้วขึ้น "โหลดข้อมูลไม่สำเร็จ" ให้เช็คว่าโปรเจกต์ Supabase (แผนฟรี) ไม่ได้ถูก pause

## ใช้ฐานข้อมูลเดียวกับทีม

ถ้าต้องการเห็นข้อมูลจริงเหมือนคนอื่นในทีม ไม่ต้องสร้างโปรเจกต์ Supabase ใหม่ และไม่ต้องรัน `schema.sql`

1. ขอไฟล์ `.env` จากเจ้าของโปรเจกต์ (ขอผ่านแชตส่วนตัวหรืออีเมลบริษัท **ห้ามส่งในกลุ่มใหญ่ หรือ commit ขึ้น GitHub**)
2. วางไว้ในโฟลเดอร์ที่มี `package.json` ตั้งชื่อว่า `.env`
3. `npm install` แล้ว `npm run dev`

ข้อควรระวัง
- ข้อมูลเป็นชุดเดียวกันทั้งทีม เพิ่ม/แก้/ลบแล้วทุกคนเห็นทันที และแอปยังไม่มีระบบล็อกอินหรือแยกสิทธิ์
- โควตา Gemini ใช้ร่วมกัน ถ้าขึ้น HTTP 429 แปลว่าโควตาเต็ม แอปจะกลับไปใช้ Rule-Based เอง

## AI (ไม่บังคับ)

ฟีเจอร์สรุปด้วย AI ใช้ Edge Function ใน [supabase/functions/](supabase/functions/) ซึ่งเรียก Gemini
ถ้าไม่ตั้งค่า แอปจะใช้การคำนวณแบบ rule-based แทนโดยอัตโนมัติ

1. ตั้ง secret `GEMINI_API_KEY` ในโปรเจกต์ Supabase
2. Deploy ฟังก์ชัน `ai-summary` และ `workload-insight`
3. ใส่ URL ของฟังก์ชันใน `.env` ที่ `VITE_AI_SUMMARY_ENDPOINT` และ `VITE_WORKLOAD_INSIGHT_ENDPOINT`

## คำสั่ง

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | รันตอนพัฒนา |
| `npm run build` | build สำหรับ production |
| `npm run lint` | ตรวจโค้ดด้วย ESLint |
