Here is the polished, professional `README.md` file. All emojis have been removed, and the formatting is optimized for GitHub/GitLab rendering.

---

# Sarasva

**Sarasva** is a privacy-first, local-only academic companion designed to help students manage subjects, timetables, attendance, focus, and exam preparation safely and intelligently.

In an era of data surveillance and feature bloat, this project prioritizes **data integrity, clarity, and student control** over convenience or engagement metrics.

---

## Why Sarasva?

Students today face a fragmented digital experience. Common struggles include:

* **Fragile Tracking:** One accidental click or update can corrupt months of history.
* **The "Timetable Trap":** Modifying a timetable for a new semester often breaks previous attendance records in existing apps.
* **Attendance Anxiety:** Uncertainty about "safe" skipping limits leads to unnecessary stress.
* **Privacy Concerns:** Most free apps rely on ads or backend data collection.

**The Sarasva Difference:** While other apps optimize for engagement and ads, Sarasva optimizes for **trust** and **correctness**.

---

## Core Principles

Sarasva is built on four non-negotiable pillars:

### 1. Data Integrity

* **Immutability:** Once an attendance record is logged, it cannot be silently recalculated or manipulated by changing a timetable later.
* **Honest Metrics:** No back-dating or hidden adjustments. The app reflects reality.

### 2. Guidance, Not Pressure

* **Safe/Risk Zones:** The app calculates SAFE (can skip) or RISK (must attend) zones based on target percentages.
* **Actionable Intelligence:** It answers the specific question: *"How many classes do I need to attend to hit 75%?"*

### 3. Archive over Delete

* **Context Preservation:** Subjects and timetables are never destroyed; they are archived.
* **History:** Students can review previous semesters without cluttering their current dashboard.

### 4. Privacy-First (Local-First)

* **Zero Knowledge:** No backend servers, no analytics, no tracking.
* **Device-Centric:** All data lives in the user's browser `localStorage`.

---

## Technical Overview

Sarasva serves as a prime example of a **Local-First Single Page Application (SPA)**. It demonstrates that complex state management does not require a backend server.

### The Stack

| Component | Technology | Benefit |
| --- | --- | --- |
| **Architecture** | Local-First SPA | Zero latency, offline capability, total privacy. |
| **Routing** | Hash-based Routing | Ensures reload stability on static hosts. |
| **Storage** | Browser Storage | Persistent data without server dependencies. |
| **State** | Centralized + Versioned | Prevents data corruption during updates. |
| **Hosting** | Static (GitHub Pages/Netlify) | High availability, zero maintenance. |

---

## Features

### Core Academic System (Phase 5)

The foundation of the application:

* **Dynamic Subjects:** Create subjects that can be active or archived.
* **Timetable Management:**
* Support for multiple timetables (e.g., Semester 1 vs. Semester 2).
* **Slot Editor:** Visual tool to map subjects to time slots.
* **Safe Activation:** Switching timetables freezes old attendance data to prevent historical corruption.


* **Attendance Engine:**
* Date-based, immutable logging.
* Real-time calculation of subject-wise percentages.



### Usability & Intelligence (Phase 6)

Tools designed to assist execution:

* **Focus Mode:**
* *Soft Focus:* Standard timer for casual study.
* *Strict Focus:* High-friction exit protocols to discourage distraction.


* **Exam Preparation:**
* Hierarchical tracking: Exams > Subjects > Chapters.
* Granular progress tracking (Theory vs. Practice completion).


* **Smart Insights:** A dashboard highlighting subjects that "Need Attention" before they become critical risks.

---

## Comparison: Sarasva vs. Typical Apps

| Feature | Typical Apps | Sarasva |
| --- | --- | --- |
| **Data Storage** | Central Server | **Local-Only** |
| **Attendance Logic** | Editable Counters | **Immutable Ledger** |
| **History** | Often overwritten | **Safe Archiving** |
| **Business Model** | Ads & Data Selling | **Free & Open Source** |
| **Design Goal** | Daily Active Users | **Academic Success** |

---

## Target Audience

### Students

Provides clear academic visibility, reduces stress, and ensures full ownership of personal data.

### Developers & Reviewers

Sarasva is designed as an **Interview-Grade Project** demonstrating:

1. **System Design:** Handling relational data (Timetables to Attendance) without a SQL database.
2. **State Management:** Robust handling of application state and versioning.
3. **Ethical Engineering:** Prioritizing user rights in software architecture.

---

## Future Scope

* **Analytics:** Visual graphs showing attendance trends over time.
* **PWA Support:** Full "Install to Home Screen" capability with offline service workers.
* **Data Portability:** User-controlled JSON export/import for backup.

---

## Project Status

* **Phase 5:** Complete
* **Phase 6:** Complete
* **Core System:** Stable
* **Architecture:** Locked

---

## License

This project operates under a **Restricted License**.

You may view, study, and learn from the code. However, **commercial use, redistribution, or modification for resale is not permitted** without explicit permission from the author.



### Final Note

Sarasva is not built to impress with complexity. It is built to **work correctly, safely, and honestly.**

That is its strength.
