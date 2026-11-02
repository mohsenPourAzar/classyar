# Classyar | کلاس‌یار

**A Persian classroom manager for attendance, modular assessment, and grade reporting, built with Next.js and MongoDB.**

Classyar helps teachers organize classes, maintain student rosters, record attendance, and calculate grades from flexible assessment components. The interface supports Persian text, right-to-left layouts, and mobile screens.

## Features

- **Classes and students:** manage subjects, academic years, student details, searchable rosters, and bulk student entry.
- **Modular assessment:** configure exam, exercise, project, and attendance weights for each module.
- **Attendance:** record present, absent, late, or excused status for each session.
- **Accurate grading:** distinguish missing marks from zeroes and show final grades only when the required data is complete.
- **Reports:** download multi-sheet Excel workbooks, export Persian-friendly CSV, and print landscape grade sheets.
- **MongoDB persistence:** store every classroom record, with atomic saves and revision checks.
- **Appearance:** light/dark themes with Parastoo as the fixed Persian font.
- **Persistence:** MongoDB storage for classroom records and chat history, with browser recovery for pending edits.

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
    appearance/           Light/dark theme switch
    layout/               Sidebar, header, and class selector
    views/                Dashboard, classes, students, attendance,
                          modules, assessments, grades, assistant
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
```

## Classroom workflow

1. Create a class and add its students individually or in bulk.
2. Create a module and configure its grading components.
3. Add sessions and record attendance.
4. Create exams, exercises, or projects and enter marks.
5. View grades for one module or all modules.
6. Export Excel/CSV or print a formal grade report.

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

Classroom records are saved together in one atomic update. A stale revision returns HTTP 409 and leaves the newer data intact. The snapshot model is intended for a single teacher and modest datasets; request bodies are limited to 12 MB. Conversations use separate `conversations` and `conversation_messages` collections, indexed for message pagination. Saving chat messages does not change the classroom revision.

An empty database imports an existing private `data/store.json`, if available, or initializes with anonymous demo records. Existing MongoDB records and the original JSON file are preserved.

Once the app has loaded, browser-cached data and local report generation can be used during a connection outage. Pending edits retry when connectivity returns. Conflicts keep local edits available and offer a backup before retrieving the server version. Loading or refreshing the app requires the Next.js server.

Theme choice remains browser-specific; Parastoo is fixed throughout the application. MongoDB credentials stay on the server and must never use the `NEXT_PUBLIC_` prefix.

### API

| Method | Route         | Purpose                                  |
| ------ | ------------- | ---------------------------------------- |
| GET    | `/api/health` | API and MongoDB connectivity             |
| GET    | `/api/state`  | Dataset, revision, update timestamp      |
| PUT    | `/api/state`  | Validate and atomically save the dataset |

PUT requires JSON and a quoted revision header, for example `If-Match: "0"`. Responses are not cached.

## Formal grade reports

The gradebook offers two reports in Excel, UTF-8 CSV, and print/PDF:

- **Final grades:** student names and final grades out of 20.
- **Detailed grades:** every assessment mark, each weighted component, raw assessment sum, module grades, and final grade. For all modules, the report also includes the sum of module grades.

Files and printouts contain a plain black-and-white bordered table, without branding, banners, or decorative headings. Missing grades stay blank; explicit zeroes remain zero. Raw sums are not weighted final grades. An all-module final grade is the average of module grades and remains blank until every module is complete. Turn off the browser's own headers and footers in the print dialog for a table-only PDF.

## Persian voice assistant

Add a Google Gemini API key to your local `.env`, then restart the server:

```dotenv
GEMINI_API_KEY=your-new-key
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_LIVE_MODEL=gemini-3.8-live
```

Keep this key server-side. Never put it in source code, browser settings, or a `NEXT_PUBLIC_` variable. Rotate any key shared in a conversation or public location. You can choose another Gemini model that supports audio input and structured JSON output.

The floating **گفتگوی زنده** button is available on every page. Open it, select the session and assessment when relevant, and start a continuous voice conversation. Gemini Live streams microphone audio and spoken replies over WebSocket, with live transcripts, interruption support, mute and stop controls. Navigation between app sections preserves the active call. Minimizing the panel keeps a visible active-call indicator and stop button. Switching classes invalidates pending previews and refreshes the classroom context while keeping the call connected. Drag the move handle in the panel header or beside the collapsed launcher to reposition it with a mouse or touch. Arrow keys also move it, Home or a double-click resets it, and the position stays within the viewport and is remembered locally. Saying **خداحافظ** ends the connection and releases the microphone immediately. Each connection lasts up to 15 minutes; start a new one to continue.

The **گفتگو با دستیار** page is a chatbot for general questions and classroom requests. It accepts text and voice messages of up to one minute, uses recent conversation history for follow-ups, and shares messages with the floating panel. Examples:

- Ask who is absent in the selected session.
- Say a student's full name or code and mark them absent, present, late, or excused.
- Read several students' marks for the selected assessment, including explicit zeroes.
- Ask for a student's saved assessment grade, module grade, or attendance history.
- Request a final or detailed report, or open another section.
- Create, edit or delete a class, student, module, grading component, session or assessment; switch the light/dark theme or change the active class.

The assistant asks follow-up questions for missing required details instead of guessing. It retains collected fields across turns: for example, it asks for a missing session date or assessment maximum, then executes the complete request. Creations use the same default module/component setup as the manual forms. Deletion summaries include dependent records that were removed. Available records and IDs refresh after changes.

Complete, valid requests execute directly without an approval or confirmation step. The assistant records an action summary and reports whether MongoDB saved the result or a local retry is pending. Missing or ambiguous required information still triggers a short follow-up question. Name/identifier resolution accepts IDs or unique exact titles; ambiguous matches and invalid scores are never guessed. Duplicate identical creation requests return the existing item, and repeated Live function-call IDs reuse the previous result. The assistant distinguishes saved assessment marks (including zero) from an incomplete calculated final grade. Invalid tool requests return actionable errors and cannot repeatedly hit the backend unchanged within the same user turn.
Voice requires microphone permission and localhost or HTTPS. Live replies come directly from Gemini audio, with no installed Persian system voice required. Stopping the call releases the microphone and audio resources. Raw audio stays in memory. Chat text, voice transcripts, and action summaries are saved to MongoDB and remain available after refresh. The history panel opens previous conversations, and “new conversation” retains older ones. Each history entry has a delete button that removes its messages from MongoDB and the browser cache. Deleted conversation IDs are marked without retaining message content so an offline retry cannot restore a deleted chat. Messages paginate instead of discarding older history. An offline browser outbox retries pending saves and retains unsent text across refresh. Restored action summaries are historical and never replay automatically. A new Live connection receives recent saved conversation context but waits for a new instruction before executing.

`GET /api/assistant` reports key configuration. `POST /api/assistant` handles chatbot text/audio and bounded recent history. `POST /api/assistant/live` issues a single-use ephemeral token with server-locked model, instructions and tools; the main API key never reaches the browser. `POST /api/assistant/tool` validates live function requests and returns deterministic answers or a preview. These endpoints are bounded, rate-limited and do not directly write records.

Google receives audio, conversation text, the class directory, selected-class details (names/codes, modules, session titles/dates and assessment titles/maximum scores), and requested query results needed for spoken answers or follow-up context. Student notes are excluded from the default catalog and appear only when explicitly requested or edited. MongoDB credentials are never sent. Gemini service availability, account access, quotas, pricing and Google's data-processing terms apply. See [Gemini Live](https://ai.google.dev/gemini-api/docs/live), [audio input](https://ai.google.dev/gemini-api/docs/audio) and [structured output](https://ai.google.dev/gemini-api/docs/structured-output).

`GET/POST /api/conversations` lists/starts chats; `DELETE /api/conversations/:id` removes a conversation; `GET/POST /api/conversations/:id/messages` pages and saves message batches. These endpoints never expose MongoDB credentials or restore executable action snapshots. During development, the cached MongoDB wrapper is versioned so Hot Reload can pick up new history methods without requiring data deletion.

The document itself stays fixed in the viewport. Dashboard cards flow naturally without separate section scrollbars; the dashboard has one unified content area. Student and attendance tables, module/class lists, grade reports, chat messages and conversation history use internal scrolling. Printing still produces the plain report table.

## Fonts

Parastoo regular and bold are bundled under `public/fonts/` with their upstream OFL license. The same fixed font is used throughout the interface and print reports; Excel exports also request Parastoo. No external font request is needed.

There is no font picker or settings/backup page. The header retains the light/dark switch.

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

The repository uses anonymous demo data. Environment files, classroom records, backups, generated builds, and locally supplied licensed assets are excluded from Git.
