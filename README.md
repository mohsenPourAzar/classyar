# Classyar | کلاس‌یار

**A Persian classroom manager for attendance, modular assessment, and grade reporting, built with Next.js and MongoDB.**

Classyar helps teachers organize classes, maintain student rosters, record attendance, and calculate grades from flexible assessment components. The interface supports Persian text, right-to-left layouts, and mobile screens.

![Classyar dashboard in light mode](docs/images/dashboard-light.png)

## Features

- **Classes and students:** manage subjects, academic years, student details, searchable rosters, and bulk student entry.
- **Modular assessment:** configure exam, exercise, project, and attendance weights for each module.
- **Attendance:** record present, absent, late, or excused status for each session.
- **Accurate grading:** distinguish missing marks from zeroes and show final grades only when the required data is complete.
- **Reports:** download multi-sheet Excel workbooks, export Persian-friendly CSV, and print landscape grade sheets.
- **MongoDB persistence:** store every classroom record, with atomic saves and revision checks.
- **Appearance:** switch between the custom light/dark themes and select Vazirmatn, Iran Sans, or Parastoo.
- **Recovery:** export/restore JSON backups, retain pending edits in the browser, and retry after connection outages.

![Classyar dashboard in dark mode](docs/images/dashboard-dark.png)

## Stack

| Layer       | Implementation                                                   |
| ----------- | ---------------------------------------------------------------- |
| Application | Next.js 16 App Router, React 19, JavaScript                      |
| Interface   | Client components split into classroom views and shared controls |
| API         | Next.js Route Handlers using the Node.js runtime                 |
| Database    | MongoDB with the official Node.js driver                         |
| Styling     | Local Persian fonts, CSS theme variables, responsive RTL layouts |
| Reports     | Browser-side XLSX, CSV, and print generation                     |
| Tests       | Node.js unit tests and real MongoDB integration tests            |

## Getting started

Install **Node.js 22+** and start **MongoDB**, or prepare a MongoDB Atlas connection string.

```bash
git clone https://github.com/mohsenPourAzar/classyar.git
cd classyar
npm ci
```

Copy `.env.example` to `.env`:

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

```bash
# macOS / Linux
cp .env.example .env
```

Default configuration:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=classyar
PORT=4173
```

**PORT is the website port.** Keep MongoDB's port in `MONGODB_URI`. The launcher reads Next.js environment files before starting the server so your configured website port is respected.

Verify the database and start development:

```bash
npm run db:check
npm run dev
```

Open **http://127.0.0.1:4173**. Development mode supports Fast Refresh.

### Production

```bash
npm run build
npm start
```

`npm start` serves the production build; run `npm run build` again after changing source code. Use `npm run dev` while editing.

The server binds to `127.0.0.1`. If a port is already occupied, stop the previous instance with **Ctrl+C** or choose another website port in `.env`.

## Project structure

```text
src/
  app/
    layout.jsx            Persian RTL document, metadata, global styles
    page.jsx              Application entry
    error.jsx             Error recovery screen
    not-found.jsx         Missing-page screen
    api/
      health/route.js     MongoDB health check
      state/route.js      Read and save classroom records
  components/
    classyar-client.jsx   Browser-only gradebook boundary
    classyar-app.jsx      Classroom state, actions, and synchronization
    classroom-modal.jsx   Editing and creation forms
    ui.jsx                Shared interface controls
    appearance/           Theme switch and font picker
    layout/               Sidebar, header, and class selector
    views/                Dashboard, classes, students, attendance,
                          modules, assessments, grades, settings
  lib/
    classroom/            Grading, reports, defaults, anonymous seed data
    server/               MongoDB connection, initialization, API, validation
    appearance.mjs        Saved appearance and initial theme script
    download.mjs          Browser downloads
    format.mjs            Persian formatting and identifiers
  styles/                 Base styles, fonts, and light/dark themes
public/fonts/             Bundled Persian webfonts and their licenses
scripts/                  Next.js launcher and database check
tests/                    Unit and MongoDB integration tests
docs/                     Architecture and screenshots
```

## Classroom workflow

1. Create a class and add its students individually or in bulk.
2. Create a module and configure its grading components.
3. Add sessions and record attendance.
4. Create exams, exercises, or projects and enter marks.
5. View grades for one module or all modules.
6. Export Excel/CSV, print a report, or save a full JSON backup.

### Grade calculation

Each module is graded out of **20**, and its component weights must total 20.

```text
Assessment contribution = (total earned marks / total possible marks) × component weight
```

Attendance points: present = 1, late = 0.5, absent = 0; excused absences are excluded from the denominator.

The default module allocates 15 points to an exam, 4 to exercises, and 1 to attendance. Weights are editable. Missing marks remain blank; entered zeroes remain zero.

## MongoDB and data preservation

The default database is `classyar`. Its `app_state` collection contains the document `_id: "primary"`, with a complete dataset in `data`, plus `revision` and `updatedAt`.

| Records       | Contents                                  |
| ------------- | ----------------------------------------- |
| `classes`     | Class details, subject, academic year     |
| `students`    | Names, codes, notes, class membership     |
| `modules`     | Ordered modules for each class            |
| `components`  | Grading types and weights                 |
| `sessions`    | Session titles, dates, module links       |
| `attendance`  | Each student's session attendance         |
| `assessments` | Exams, exercises, projects, maximum marks |
| `marks`       | Each student's assessment marks           |

Records are saved together in one atomic update. A stale revision returns HTTP 409 and leaves the newer data intact. The snapshot model is intended for a single teacher and modest datasets; request bodies are limited to 12 MB.

An empty database imports an existing private `data/store.json`, if available, or initializes with anonymous demo records. Existing MongoDB records and the original JSON file are preserved.

Once the app has loaded, browser-cached data and local report generation can be used during a connection outage. Pending edits retry when connectivity returns. Conflicts keep local edits available and offer a backup before retrieving the server version. Loading or refreshing the app requires the Next.js server.

Theme and font choices remain browser-specific. MongoDB credentials stay on the server and must never use the `NEXT_PUBLIC_` prefix.

### API

| Method | Route         | Purpose                                  |
| ------ | ------------- | ---------------------------------------- |
| GET    | `/api/health` | API and MongoDB connectivity             |
| GET    | `/api/state`  | Dataset, revision, update timestamp      |
| PUT    | `/api/state`  | Validate and atomically save the dataset |

PUT requires JSON and a quoted revision header, for example `If-Match: "0"`. Responses are not cached.

## Fonts

Vazirmatn (Vazir) and Parastoo are bundled under `public/fonts/`, with upstream license files. No external font request is needed.

Iran Sans uses an installed copy or your own licensed files: `public/fonts/IRANSans-Regular.woff2` and `public/fonts/IRANSans-Bold.woff2`. These files are excluded from Git; Vazirmatn is the fallback.

## Commands and checks

```bash
npm run dev       # Development server with Fast Refresh
npm run build     # Optimized production build
npm start         # Serve the production build
npm test          # Grading, exports, state validation, port checks
npm run test:db   # Real MongoDB and API logic integration
npm run db:check  # Verify the configured MongoDB connection
npm run format    # Format application source, scripts, and tests
```

Integration tests create and remove only uniquely named `classyar_test_*` databases. They check all record collections, zero marks, revisions, validation, request limits, reconnects, and safe error responses.

## Scope and privacy

Classyar is currently a **single-teacher local application**. It does not include login, role-based permissions, or tenant separation. Those features are required before making a real classroom instance publicly accessible.

The repository uses anonymous demo data. Environment files, classroom records, backups, generated builds, and licensed Iran Sans files are excluded from Git.

See [Architecture](docs/ARCHITECTURE.md) for implementation details.
