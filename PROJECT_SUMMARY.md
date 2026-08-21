# Tasks Dashboard — สรุป Logic ของโปรเจค

> เอกสารนี้สรุปสถาปัตยกรรมและตรรกะการทำงานของโปรเจค ณ วันที่ 2026-07-24

## 1. ภาพรวมโปรเจค

**Tasks Dashboard** เป็น Internal Dashboard สำหรับผู้จัดการทีม (Manager) ใช้ติดตามงาน (Tasks), ทีมงาน (Teams) และสมาชิก (Members) พร้อมระบบวิเคราะห์ภาระงาน (Workload) ที่มี AI ช่วยอธิบายผลลัพธ์ Branding ในแอประบุว่าเป็นเครื่องมือภายในของ efinanceThai ("Manager — Task & Team Tracking", footer "efinanceThai — Internal Tool") และ**ไม่มีระบบ Login/Authentication ใดๆ**

### Tech Stack
- **Frontend**: React 19 + TypeScript, สร้างด้วย Vite 8, ตกแต่งด้วย Tailwind CSS 3
- **Routing**: react-router-dom v7
- **Charts**: Recharts v3 (ใช้ในหน้า Dashboard, Reports, WorkloadAI)
- **Icons**: lucide-react
- **Export**: xlsx (export ข้อมูลเป็นไฟล์ Excel)
- **Backend/Data**: Supabase (Postgres + PostgREST) เป็น persistence layer เดียว ไม่มี custom Node/Express backend
- **AI**: Supabase Edge Functions (Deno) เรียกใช้ **Google Gemini 2.0 Flash** สำหรับ 2 ฟีเจอร์ พร้อม fallback แบบ rule-based ทุกจุดที่ AI ใช้งานไม่ได้

## 2. โครงสร้างโฟลเดอร์ (src/)

```
src/
  pages/          — 1 ไฟล์ต่อ 1 route (Dashboard, Tasks, Team, TeamDetail, WorkloadAI, Reports, Export, Admin, Settings)
  components/
    layout/       — AppLayout (โครงหน้าหลัก + mapping route→title), Sidebar (เมนู), Topbar
    dashboard/    — AiSummaryCard (widget สรุป AI ในหน้า Dashboard)
    tasks/        — TaskBoard (kanban columns), TaskCard
    members/      — MemberDetailModal (modal แสดงรายละเอียดสมาชิก)
    workload/     — AiInsightModal (drawer AI insight รายคน), TeamWorkloadInsightCard (การ์ด AI ภาพรวมทีม)
    ui/           — Design system primitives: Card, Modal, Badge, Avatar, StatCard, ProgressBar, Pagination,
                    SearchInput, EmptyState, AsyncState, ActionMenu, formStyles, tableParts
  context/        — AppDataContext.tsx: global store เดียวสำหรับ teams/members/tasks + CRUD actions
  lib/            — business logic และ data access (ดูหัวข้อ 5)
  types/          — index.ts: TypeScript types/interfaces ทั้งหมดที่ใช้ร่วมกัน
```

## 3. Routing

`BrowserRouter` → `App` ครอบด้วย `AppDataProvider` แล้วมี route shell เดียว (`AppLayout` = Sidebar + Topbar + Outlet) ครอบคลุม:

| Path | หน้า | หน้าที่ |
|---|---|---|
| `/` | Dashboard | สถิติรวม, กราฟ, AI Summary |
| `/tasks` | Tasks | Kanban board / list view, CRUD งาน |
| `/team` | Team | Grid การ์ดทีม (read-only, คลิกเข้า TeamDetail) |
| `/workload` | WorkloadAI | กราฟ Load Score + AI insight |
| `/reports` | Reports | กราฟวิเคราะห์เชิงลึก |
| `/export` | Export | ปุ่ม export Excel |
| `/admin` | Admin | CRUD ทีม |
| `/admin/teams/:teamId` | TeamDetail | จัดการงาน/สมาชิกของทีมนั้น (tabs: overview/tasks/members) |
| `/settings` | Settings | สถานะการเชื่อมต่อระบบต่างๆ |

## 4. Data Layer / State Management

- **Single source of truth**: `AppDataContext` — โหลดข้อมูลทั้งหมด (`dataService.fetchAllData()`) ครั้งเดียวตอน mount แล้วเก็บ `teams`, `members`, `tasks` ไว้ใน React state
- ทุกหน้า/component อ่านข้อมูลผ่าน `useAppData()` hook — ไม่มี Redux/React Query, เป็น Context + local state ที่เขียนขึ้นเอง
- **`lib/dataService.ts`**: ห่อหุ้ม Supabase client ด้วยฟังก์ชัน CRUD (fetchAllData, create/update/delete สำหรับ teams/members/tasks) ทุกฟังก์ชันเช็ค `assertSupabaseConfigured()` ก่อนเสมอ
- **`lib/supabaseClient.ts`**: สร้าง client จาก `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, export `isSupabaseConfigured` ใช้เช็คสถานะในหน้า Settings
- **Optimistic cascade จำลอง DB**: เมื่อลบทีม/สมาชิก ระบบจะ set `team_id`/`owner_id` เป็น null ให้ข้อมูลที่เกี่ยวข้องทันทีฝั่ง client (เลียนแบบ `ON DELETE SET NULL` ของฐานข้อมูล) โดยไม่ต้อง refetch ใหม่

### Schema (`supabase/schema.sql`)
ตาราง `teams`, `members`, `tasks`, `ai_summaries` (unused cache table) — FK ทั้งหมดใช้ `ON DELETE SET NULL` มี trigger auto-update `tasks.updated_at`

⚠️ **RLS เปิดกว้างให้ทั้ง `anon` และ `authenticated`** เข้าถึงข้อมูลได้เต็มรูปแบบ — ในโค้ดมีคอมเมนต์ระบุชัดว่ายอมรับได้เฉพาะกรณีใช้งานภายในองค์กร (private network) เท่านั้น **หากต้องเปิดใช้งานสาธารณะต้องเพิ่ม Supabase Auth + policy ที่ผูกกับ `auth.uid()` ก่อน**

## 5. Business Logic หลัก (`src/lib/`)

### 5.1 ระบบคำนวณ Load Score — แกนหลักของแอป
เป็นสูตรกำหนดตายตัว (deterministic, ไม่พึ่ง AI) ระบุในคอมเมนต์ว่าตอบโจทย์ requirement REQ-AI-006:

**`workloadConfig.ts`** — ค่าคงที่ของสูตร:
- Priority weights: low `0.75`, medium `1.0`, high `1.25`, critical `1.5`
- `weeklyCapacityDays`: 5 วัน
- Threshold: Underload `< 60%`, Overload `> 110%`
- Due-soon window: 3 วัน (ร่วมกับเงื่อนไข progress < 50% ถือว่ามีความเสี่ยง)

**`workload.ts`** — อัลกอริทึม (`computeMemberWorkloads`):
1. `remainingEffortDays(task)` = effort_days × (1 − progress/100) → เป็น 0 ถ้า done แล้ว
2. `weightedRemainingEffort(task)` = remaining effort × priority weight
3. `loadScore` = round((ผลรวม weighted remaining effort ของงานที่ยังไม่เสร็จ) ÷ weeklyCapacityDays × 100)
4. จัดระดับ: **Overload** (>110%) / **Balanced** / **Underload** (<60%)
5. สร้าง `reason` และ `suggestedAction` เป็นข้อความภาษาไทยแบบ rule-based
6. `computeTeamWorkloadSummary` — รวบ average load score ต่อทีม
7. `computeWeeklyClosedTrend` — จัดกลุ่มงานที่ done ตามสัปดาห์ (ISO week) สำหรับกราฟเส้นแนวโน้ม

### 5.2 อื่นๆ
- **`stats.ts`** — helper พื้นฐาน: isOverdue, isDueSoon, countByStatus, countByTeam, daysSince
- **`aiSummary.ts`** — client เรียก AI Summary (มี cache 15 วินาที กันเรียกซ้ำถี่เกินไป) พร้อม fallback เป็นข้อความสรุปแบบ rule-based ถ้า endpoint ใช้งานไม่ได้
- **`workloadInsight.ts`** — client เรียก AI Insight ระดับคน/ทีม ส่งเฉพาะ**ตัวเลขที่คำนวณไว้แล้ว**ให้ AI อธิบาย (ไม่ให้ AI คำนวณเอง) มี cache 15 วินาทีเช่นกัน และ fallback เป็นข้อความ rule-based เดียวกับ workload.ts
- **`colors.ts` / `colorPalette.js`** — source of truth ของสี ใช้ร่วมกับ Tailwind config และกราฟ Recharts
- **`teamColor.ts`** — hash ชื่อทีม/สมาชิกเป็นสีที่คงที่ (ไม่ต้องเก็บสีในฐานข้อมูล)
- **`exporters.ts`** — สร้างไฟล์ Excel 3 ชีท (Tasks, Workload (AI), Team Summary)
- **`useTableState.ts`** — hook ใช้ร่วมสำหรับ sort/pagination/row-selection ของตารางต่างๆ

## 6. ชั้น AI (Supabase Edge Functions)

ทั้งสองฟังก์ชันเป็น Deno HTTP handler, เปิด CORS, เรียก **Gemini 2.0 Flash** ผ่าน secret `GEMINI_API_KEY` (เก็บฝั่ง server เท่านั้น)

- **`ai-summary`**: รับ `SummaryStats` → สั่ง Gemini สรุปภาษาไทย 2-4 ประโยค มี retry 3 ครั้งเมื่อโดน rate limit (HTTP 429) หากล้มเหลวคืนค่า fallback แบบ rule-based พร้อม HTTP 200 เสมอ (ไม่ปล่อย error ให้ client)
- **`workload-insight`**: รับ `{level: 'member'|'team', payload}` → สั่ง Gemini คืนค่า JSON เคร่งครัด `{summary, risk_reason, suggested_action}` หาก parse ไม่ได้หรือเรียกไม่สำเร็จ คืนค่า fallback พร้อม disclaimer ภาษาไทย ("สรุปโดย Gemini 2.0 Flash เป็นสัญญาณช่วยตรวจสอบ ไม่ใช่การชี้ขาด")

**หลักการสำคัญ**: ทั้งสอง AI feature เป็นเพียง "ผู้อธิบาย" ตัวเลขที่คำนวณไว้แล้ว ไม่ใช่ผู้คำนวณ — แอปทำงานได้ครบทุกฟีเจอร์แม้ไม่ได้ตั้งค่า AI ใดๆ เลย

## 7. หน้าเพจหลัก

| หน้า | หน้าที่และ logic สำคัญ |
|---|---|
| **Dashboard** | Stat card 5 ตัว (total/doing/done/dueSoon/overdue), donut สถานะ, stacked bar งานต่อทีม, กราฟเส้นแนวโน้มปิดงานรายสัปดาห์, ตารางงานล่าสุด (กระจายทีมละ 1 แถวเมื่อไม่ได้ filter), AI Summary card, ปุ่ม export |
| **Tasks** | Board (Kanban) หรือ List view, ค้นหา/filter (status, priority, team), เปลี่ยนสถานะ inline, modal แก้ไขงานเต็มรูปแบบ |
| **Team** | Grid การ์ดทีม (avatar สมาชิก, จำนวนงาน active, % done, จำนวนงาน overdue) → คลิกไป TeamDetail |
| **TeamDetail** | Tab overview/tasks/members: แก้ไข/ลบทีม, CRUD สมาชิก, CRUD งานของทีม, bulk-select + bulk-delete, ตาราง sort/pagination ผ่าน `useTableState` |
| **WorkloadAI** | Stat card overload/balanced/underload, bar chart Load Score รายคน/ทีม (มีเส้นอ้างอิงที่ 60%/110%), การ์ด AI ภาพรวมทีม, ตารางรายคนพร้อมปุ่มดู AI Insight |
| **Admin** | CRUD เฉพาะทีม (ชื่อ + category) คลิกการ์ดทีมเพื่อไปจัดการสมาชิก/งานที่ TeamDetail |
| **Reports** | Stacked bar งานเสร็จ/ค้างต่อทีม, bar chart การกระจาย priority, กราฟแนวโน้มปิดงาน 8 สัปดาห์, stat card สรุป |
| **Export** | ปุ่ม export ข้อมูลเป็น Excel เหมือน Dashboard |
| **Settings** | สถานะการเชื่อมต่อ Supabase / AI Summary endpoint / Workload Insight endpoint พร้อมคำแนะนำตั้งค่า |

## 8. กติกาพิเศษที่น่าสนใจ

**การบังคับความสอดคล้อง status ↔ progress** ในฟอร์มแก้ไขงาน (TeamDetail.tsx):
- ตั้ง status เป็น `done` → บังคับ progress = 100
- ตั้ง status เป็น `todo` → บังคับ progress = 0
- ตั้ง progress = 100 → บังคับ status เป็น `done`
- ตั้ง progress = 0 → บังคับ status เป็น `todo`
- ตั้ง progress ระหว่างกลาง → บังคับ status เป็น `doing` (ถ้าเดิมเป็น todo/done)

## 9. ประเด็นที่ควรทราบ / จุดที่ควรปรับปรุง

1. **ไม่มีระบบ Authentication** — RLS เปิดให้ anon/authenticated เข้าถึงข้อมูลทุกแถวได้ เหมาะกับใช้ภายในองค์กรเท่านั้น ควรเพิ่ม Supabase Auth ก่อนเปิดใช้งานสาธารณะ
2. **เอกสารไม่ตรงกับโค้ด** — หน้า Settings.tsx ยังอ้างอิงตัวแปร `OPENAI_API_KEY` ในคำแนะนำ ทั้งที่ edge functions ใช้ `GEMINI_API_KEY` จริง
3. **Environment Variables** (`.env.example`):
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — บังคับ
   - `VITE_AI_SUMMARY_ENDPOINT`, `VITE_WORKLOAD_INSIGHT_ENDPOINT` — optional (ว่าง = ใช้ fallback แบบ rule-based)
   - `GEMINI_API_KEY` — ตั้งฝั่ง Supabase secret เท่านั้น ไม่อยู่ใน `.env.example`

---