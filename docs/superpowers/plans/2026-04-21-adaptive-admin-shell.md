# Adaptive Admin Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membuat area Admin Unit punya shell, dashboard, dan page turunan yang proporsional, responsif, dan konsisten di semua device.

**Architecture:** Gunakan satu shell admin yang mengatur sidebar, topbar, max-width content, dan mobile drawer. Dashboard dan page admin lain mengikuti sistem spacing, typography, dan panel styling yang sama agar visualnya stabil dan tidak saling bertabrakan.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS, lucide-react

---

### Task 1: Rebuild Admin Shell

**Files:**
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\components\layout\dashboard-shell.tsx`

- [ ] Definisikan ulang struktur shell menjadi sidebar desktop yang lebih ramping, drawer mobile, topbar tersegmentasi, dan wrapper content dengan max-width.
- [ ] Tambahkan accessibility untuk icon button, search field, dan overlay drawer.
- [ ] Pastikan title/subtitle/search tidak overlap di laptop maupun desktop lebar.

### Task 2: Recompose Admin Dashboard

**Files:**
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\components\pages\admin-dashboard-page.tsx`

- [ ] Ubah hero dashboard agar heading, subtitle, dan CTA memiliki ritme visual yang lebih stabil.
- [ ] Rapikan kartu metrik, tabel, dan side panels agar memakai grid responsif yang konsisten.
- [ ] Tambahkan treatment visual yang lebih refined tanpa mengorbankan keterbacaan.

### Task 3: Normalize Secondary Admin Pages

**Files:**
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\components\pages\admin-pages.tsx`

- [ ] Samakan intro section, panel title, form controls, detail cards, dan tables dengan shell baru.
- [ ] Turunkan skala tipografi yang masih terlalu besar di halaman detail, transaksi, blacklist, dan profil.
- [ ] Pastikan semua tombol dan field tetap nyaman untuk touch dan keyboard.

### Task 4: Verify Runtime Safety

**Files:**
- Verify only

- [ ] Jalankan validasi TypeScript untuk memastikan perubahan admin tidak menambah error baru.
- [ ] Jalankan dev server dan cek route `/admin?role=admin_unit`.
- [ ] Catat residual issue yang tidak terkait langsung dengan shell, bila masih ada.
