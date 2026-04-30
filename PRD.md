# PRD - Pentaract: Distributed Storage Reimagined

## 1. Product Vision
Pentaract is a high-performance, distributed storage system that leverages Telegram as a secure backend. The goal is to provide a "Infinite Storage" experience with a premium, state-of-the-art user interface that rivals top-tier cloud providers while maintaining user privacy and distributed reliability.

## 2. Target Audience
- **Power Users:** Individuals managing large volumes of data across multiple "drives" (storages).
- **Privacy-Conscious Users:** Those seeking alternatives to centralized cloud giants.
- **Developers:** Users looking for a programmable and extensible storage backend.

## 3. Design Philosophy
- **Rich Aesthetics:** Use "Deep Space" themes with vibrant accents and **Glassmorphism** for a futuristic look.
- **High Interactivity:** Every action should feel responsive, with micro-animations (hover scales, slide-ins, fades) confirming user intent.
- **Minimalist UX:** Simplify complex distributed logic into intuitive "Drive Cards" and a familiar file explorer.

## 4. Key Features

### 4.1. Multi-Drive Dashboard
- **Drive Cards:** Visual representation of distributed storage units.
- **Real-time Stats:** Instant visibility into file counts and storage usage per drive.
- **Quick Registration:** Simple flow to connect new storage workers/chats.

### 4.2. Advanced Navigation
- **Recursive File Tree:** A persistent sidebar providing a hierarchy view of all storages and folders.
- **Dynamic Breadcrumbs:** Clickable path tracking for rapid upward navigation.
- **Smart Global Search:** Instant filtering across the current view to find folders and files.

### 4.3. Premium File Explorer
- **Grid-First View:** Large, recognizable icons for different file types and folders.
- **Bulk Actions:** Multi-select capabilities triggered by a floating action bar for batch deletion and management.
- **Access Control:** Integrated permission management to share storages with other users.

### 4.4. Security & Performance
- **Telegram Backend:** Utilize Telegram's robust infrastructure for data persistence.
- **Rust Core:** A high-performance, safe backend capable of handling high-concurrency file operations.
- **Static Linking:** Fully self-contained Docker images for easy deployment.

## 5. Technical Stack
- **Backend:** Rust (Axum/Tokio), Postgres (Database).
- **Frontend:** SolidJS, Solid Router, SUID (Icons), Tailwind CSS v4.
- **Styling:** PostCSS with `@tailwindcss/postcss`.
- **Infrastructure:** Docker, Docker Compose, Alpine Linux.

## 6. Success Metrics
- **Performance:** UI response time < 100ms for local state transitions.
- **Engagement:** High frequency of use for the recursive tree navigation vs standard breadcrumbs.
- **Stability:** 99.9% success rate for distributed file uploads.

---
*Created on 2026-04-27*
