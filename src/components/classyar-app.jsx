"use client";
import React, { createElement as e } from "react";
import * as L from "../lib/classroom/logic.mjs";
import * as EX from "../lib/classroom/reports.mjs";
import seed from "../lib/classroom/seed.json";
import { readAppearance, applyAppearance } from "../lib/appearance.mjs";
import { makeDefaultComponents } from "../lib/classroom/defaults.mjs";
import { downloadText, downloadBinary } from "../lib/download.mjs";
import { cn, fmt, dateNow, makeId } from "../lib/format.mjs";
import { nav } from "./navigation.mjs";
import { Icon, Empty, button } from "./ui.jsx";
import Header from "./layout/header.jsx";
import Sidebar from "./layout/sidebar.jsx";
import ClassSwitcher from "./layout/class-switcher.jsx";
import Dashboard from "./views/dashboard.jsx";
import Classes from "./views/classes.jsx";
import Students from "./views/students.jsx";
import Attendance from "./views/attendance.jsx";
import Modules from "./views/modules.jsx";
import Assessments from "./views/assessments.jsx";
import Grades from "./views/grades.jsx";
import Settings from "./views/settings.jsx";
import ClassroomModal from "./classroom-modal.jsx";
import ThemeSelector from "./appearance/theme-selector.jsx";
import FontSettings from "./appearance/font-settings.jsx";

export default class ClassyarApp extends React.Component {
  constructor(props) {
    super(props);
    let db = structuredClone(seed);
    try {
      const saved = JSON.parse(
        localStorage.getItem("classyar-data-v1") || "null",
      );
      if (L.validateDatabase(saved)) db = L.normalizedDatabase(saved);
    } catch {}
    const { theme, font } = readAppearance();
    this.state = {
      db,
      theme,
      font,
      gradeScope: "module",
      view: "dashboard",
      classId: db.classes[0] ? db.classes[0].id : null,
      moduleId: null,
      sessionId: null,
      assessmentId: null,
      modal: null,
      search: "",
      mobileMenu: false,
      saveStatus: "آماده",
      notification: null,
      ready: false,
    };
    this.timer = null;
    this.notificationTimer = null;
    this.retryTimer = null;
    this.saving = false;
    this.syncBlocked = false;
    this.lastSavedData = null;
    this.serverRevision = null;
    this.pendingChanges = false;
    try {
      const sync = JSON.parse(
        localStorage.getItem("classyar-sync-v2") || "null",
      );
      if (sync) {
        this.serverRevision = Number.isSafeInteger(sync.revision)
          ? sync.revision
          : null;
        this.pendingChanges = sync.pending === true;
      }
    } catch {}
  }
  componentDidMount() {
    applyAppearance(this.state);
    if (location.protocol === "http:" || location.protocol === "https:") {
      this.connectServer();
    } else this.setState({ ready: true, saveStatus: "حالت آفلاین" });
  }
  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.theme !== this.state.theme ||
      prevState.font !== this.state.font
    ) {
      applyAppearance(this.state);
      try {
        localStorage.setItem("classyar-theme-v2", this.state.theme);
        localStorage.setItem("classyar-font-v2", this.state.font);
      } catch {}
    }
    if (prevState.db !== this.state.db) {
      const snapshot = JSON.stringify(this.state.db);
      try {
        localStorage.setItem("classyar-data-v1", snapshot);
      } catch {
        this.notify("فضای ذخیره مرورگر کافی نیست؛ نسخه پشتیبان بگیرید.");
      }
      if (snapshot !== this.lastSavedData) {
        this.pendingChanges = true;
        this.rememberSync();
        if (
          this.state.ready &&
          (location.protocol === "http:" || location.protocol === "https:")
        ) {
          if (!this.syncBlocked)
            this.setState({ saveStatus: "در انتظار ذخیره در MongoDB" });
          clearTimeout(this.timer);
          this.timer = setTimeout(() => this.saveToServer(), 600);
        }
      }
    }
  }
  componentWillUnmount() {
    clearTimeout(this.timer);
    clearTimeout(this.notificationTimer);
    clearTimeout(this.retryTimer);
  }
  rememberSync() {
    try {
      localStorage.setItem(
        "classyar-sync-v2",
        JSON.stringify({
          revision: this.serverRevision,
          pending: this.pendingChanges,
        }),
      );
    } catch {}
  }
  conflict() {
    this.syncBlocked = true;
    clearTimeout(this.retryTimer);
    this.setState({ ready: true, saveStatus: "تداخل تغییرات؛ پشتیبان بگیرید" });
    this.notify(
      "اطلاعات سرور تغییر کرده است. ابتدا نسخه پشتیبان تغییرات این دستگاه را بگیرید و سپس نسخه سرور را دریافت کنید.",
    );
  }
  resolveConflict() {
    this.exportBackup();
    this.pendingChanges = false;
    this.syncBlocked = false;
    this.rememberSync();
    this.connectServer();
  }
  async connectServer() {
    try {
      const response = await fetch("/api/state", {
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error();
      const saved = await response.json();
      if (!L.validateDatabase(saved) || !Number.isSafeInteger(saved.revision))
        throw new Error();
      if (this.pendingChanges) {
        if (this.serverRevision !== saved.revision) {
          this.conflict();
          return;
        }
        this.setState({ ready: true }, () => this.saveToServer());
        return;
      }
      const db = L.normalizedDatabase(saved);
      this.serverRevision = saved.revision;
      this.lastSavedData = JSON.stringify(db);
      this.rememberSync();
      this.setState((s) => ({
        db,
        classId:
          s.classId && saved.classes.some((c) => c.id === s.classId)
            ? s.classId
            : (saved.classes[0] || {}).id || null,
        ready: true,
        saveStatus: "متصل به MongoDB",
      }));
    } catch {
      this.setState({ ready: true, saveStatus: "آفلاین؛ فقط در این مرورگر" });
      clearTimeout(this.retryTimer);
      this.retryTimer = setTimeout(() => this.connectServer(), 5000);
    }
  }
  async saveToServer() {
    if (this.saving || this.syncBlocked || !this.pendingChanges) return;
    if (this.serverRevision === null) {
      this.connectServer();
      return;
    }
    this.saving = true;
    const snapshot = JSON.stringify(this.state.db);
    try {
      const response = await fetch("/api/state", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "If-Match": '"' + this.serverRevision + '"',
        },
        body: snapshot,
        signal: AbortSignal.timeout(8000),
      });
      if (response.status === 409) {
        this.conflict();
        return;
      }
      if (response.status === 400 || response.status === 413) {
        this.syncBlocked = true;
        this.setState({
          saveStatus: "ذخیره نشد؛ داده نامعتبر یا بیش از حد مجاز",
        });
        this.notify(
          "MongoDB تغییرات را نپذیرفت؛ برای حفظ اطلاعات نسخه پشتیبان بگیرید.",
        );
        return;
      }
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (!Number.isSafeInteger(result.revision)) throw new Error();
      this.serverRevision = result.revision;
      this.lastSavedData = snapshot;
      this.pendingChanges = JSON.stringify(this.state.db) !== snapshot;
      this.rememberSync();
      clearTimeout(this.retryTimer);
      this.setState({
        saveStatus: this.pendingChanges
          ? "در انتظار ذخیره در MongoDB"
          : "در MongoDB ذخیره شد",
      });
      if (this.pendingChanges) {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.saveToServer(), 100);
      }
    } catch {
      this.setState({ saveStatus: "آفلاین؛ فقط در این مرورگر" });
      clearTimeout(this.retryTimer);
      this.retryTimer = setTimeout(() => this.saveToServer(), 5000);
    } finally {
      this.saving = false;
    }
  }
  notify(message) {
    this.setState({ notification: message });
    clearTimeout(this.notificationTimer);
    this.notificationTimer = setTimeout(
      () => this.setState({ notification: null }),
      3500,
    );
  }
  write(fn) {
    this.setState((s) => {
      const db = JSON.parse(JSON.stringify(s.db));
      fn(db);
      return { db };
    });
  }
  get selectedClass() {
    return (
      this.state.db.classes.find((c) => c.id === this.state.classId) || null
    );
  }
  get students() {
    return this.state.db.students.filter(
      (s) => s.classId === this.state.classId,
    );
  }
  get modules() {
    return this.state.db.modules
      .filter((m) => m.classId === this.state.classId)
      .sort((a, b) => a.order - b.order);
  }
  get currentModule() {
    return (
      this.modules.find((m) => m.id === this.state.moduleId) ||
      this.modules[0] ||
      null
    );
  }
  get classSessions() {
    return this.state.db.sessions
      .filter((s) => s.classId === this.state.classId)
      .sort((a, b) => Number(b.order || 0) - Number(a.order || 0));
  }
  changeClass(id) {
    this.setState({
      classId: id,
      moduleId: null,
      sessionId: null,
      assessmentId: null,
      search: "",
      view: "dashboard",
      mobileMenu: false,
    });
  }
  go(view) {
    this.setState({ view, search: "", mobileMenu: false });
  }
  renderFontSettings() {
    return e(FontSettings, { app: this });
  }
  renderThemeSelector(name) {
    return e(ThemeSelector, { app: this, name });
  }
  open(type, item = null) {
    this.setState({ modal: { type, item }, mobileMenu: false });
  }
  close() {
    this.setState({ modal: null });
  }
  remove(type, item) {
    const names = {
      class: "کلاس",
      student: "دانش‌آموز",
      module: "پودمان",
      component: "بخش نمره‌دهی",
      session: "جلسه",
      assessment: "آیتم ارزشیابی",
    };
    if (
      !confirm(
        `«${item.name || item.title}» حذف شود؟ اطلاعات وابسته به ${names[type]} نیز حذف خواهد شد.`,
      )
    )
      return;
    this.write((db) => {
      const removeStudents = new Set(),
        removeModules = new Set(),
        removeComponents = new Set(),
        removeSessions = new Set(),
        removeAssessments = new Set();
      if (type === "class") {
        db.classes = db.classes.filter((x) => x.id !== item.id);
        db.students
          .filter((x) => x.classId === item.id)
          .forEach((x) => removeStudents.add(x.id));
        db.modules
          .filter((x) => x.classId === item.id)
          .forEach((x) => removeModules.add(x.id));
        db.sessions
          .filter((x) => x.classId === item.id)
          .forEach((x) => removeSessions.add(x.id));
      }
      if (type === "student") {
        removeStudents.add(item.id);
      }
      if (type === "module") {
        removeModules.add(item.id);
      }
      if (type === "component") {
        removeComponents.add(item.id);
      }
      if (type === "session") {
        removeSessions.add(item.id);
      }
      if (type === "assessment") {
        removeAssessments.add(item.id);
      }
      db.modules
        .filter((x) => removeModules.has(x.id))
        .forEach((x) => {
          db.sessions
            .filter((s) => s.moduleId === x.id)
            .forEach((s) => removeSessions.add(s.id));
          db.components
            .filter((c) => c.moduleId === x.id)
            .forEach((c) => removeComponents.add(c.id));
        });
      db.assessments
        .filter((a) => removeComponents.has(a.componentId))
        .forEach((a) => removeAssessments.add(a.id));
      db.students = db.students.filter((x) => !removeStudents.has(x.id));
      db.modules = db.modules.filter((x) => !removeModules.has(x.id));
      db.components = db.components.filter((x) => !removeComponents.has(x.id));
      db.sessions = db.sessions.filter((x) => !removeSessions.has(x.id));
      db.assessments = db.assessments.filter(
        (x) => !removeAssessments.has(x.id),
      );
      db.attendance = db.attendance.filter(
        (x) =>
          !removeStudents.has(x.studentId) && !removeSessions.has(x.sessionId),
      );
      db.marks = db.marks.filter(
        (x) =>
          !removeStudents.has(x.studentId) &&
          !removeAssessments.has(x.assessmentId),
      );
    });
    if (type === "class")
      this.setState((s) => ({
        classId: s.db.classes.find((c) => c.id !== item.id)?.id || null,
        view: "classes",
      }));
    if (type === "module") this.setState({ moduleId: null });
    if (type === "session") this.setState({ sessionId: null });
    if (type === "assessment") this.setState({ assessmentId: null });
    this.notify("مورد انتخاب‌شده حذف شد.");
  }
  setAttendance(sessionId, studentId, status) {
    this.write((db) => {
      db.attendance = db.attendance.filter(
        (x) => !(x.sessionId === sessionId && x.studentId === studentId),
      );
      if (status !== "unset")
        db.attendance.push({ sessionId, studentId, status });
    });
  }
  markAllPresent(sessionId) {
    this.write((db) => {
      this.students.forEach((s) => {
        if (
          !db.attendance.some(
            (x) => x.studentId === s.id && x.sessionId === sessionId,
          )
        )
          db.attendance.push({ sessionId, studentId: s.id, status: "present" });
      });
    });
    this.notify("دانش‌آموزان بدون وضعیت، حاضر ثبت شدند.");
  }
  setMark(aid, studentId, raw, max) {
    if (
      raw !== "" &&
      (!Number.isFinite(Number(raw)) ||
        Number(raw) < 0 ||
        Number(raw) > Number(max))
    )
      return;
    this.write((db) => {
      db.marks = db.marks.filter(
        (x) => !(x.assessmentId === aid && x.studentId === studentId),
      );
      if (raw !== "")
        db.marks.push({ assessmentId: aid, studentId, score: Number(raw) });
    });
  }
  saveModal(ev) {
    ev.preventDefault();
    const m = this.state.modal;
    if (!m) return;
    const form = new FormData(ev.currentTarget);
    const v = Object.fromEntries(form.entries());
    const old = m.item;
    const id = old?.id || makeId();
    const classId = this.state.classId,
      module = this.currentModule;
    if (m.type === "component" && Number(v.weight) < 0) {
      this.notify("وزن نباید منفی باشد.");
      return;
    }
    if (m.type === "assessment" && !(Number(v.maxScore) > 0)) {
      this.notify("بارم باید بزرگ‌تر از صفر باشد.");
      return;
    }
    this.write((db) => {
      const put = (table, item) => {
        const idx = db[table].findIndex((x) => x.id === id);
        if (idx >= 0) db[table][idx] = { ...db[table][idx], ...item };
        else db[table].push(item);
      };
      if (m.type === "class") {
        put("classes", {
          id,
          name: v.name.trim(),
          grade: v.grade,
          subject: v.subject.trim(),
          year: v.year.trim(),
          color: v.color,
        });
        if (!old) {
          const newModule = makeId();
          db.modules.push({
            id: newModule,
            classId: id,
            name: "پودمان اول",
            description: "قابل ویرایش و توسعه",
            order: 1,
          });
          makeDefaultComponents(db, newModule);
        }
      }
      if (m.type === "student")
        put("students", {
          id,
          classId,
          name: v.name.trim(),
          studentCode: v.studentCode.trim(),
          note: v.note.trim(),
        });
      if (m.type === "module") {
        put("modules", {
          id,
          classId,
          name: v.name.trim(),
          description: v.description.trim(),
          order: Number(v.order) || 1,
        });
        if (!old) makeDefaultComponents(db, id);
      }
      if (m.type === "component")
        put("components", {
          id,
          moduleId: module.id,
          name: v.name.trim(),
          kind: v.kind,
          weight: Number(v.weight),
          tag: old?.tag || "custom",
        });
      if (m.type === "session")
        put("sessions", {
          id,
          classId,
          moduleId: v.moduleId,
          title: v.title.trim(),
          date: v.date.trim(),
          order:
            old?.order ||
            Math.max(
              0,
              ...db.sessions
                .filter((s) => s.classId === classId)
                .map((s) => Number(s.order || 0)),
            ) + 1,
        });
      if (m.type === "assessment")
        put("assessments", {
          id,
          moduleId: module.id,
          componentId: v.componentId,
          title: v.title.trim(),
          date: v.date.trim(),
          maxScore: Number(v.maxScore),
        });
      if (m.type === "bulk")
        v.names
          .split(/\r?\n/)
          .map((x) => x.trim())
          .filter(Boolean)
          .forEach((name) =>
            db.students.push({
              id: makeId(),
              classId,
              name,
              studentCode: "",
              note: "",
            }),
          );
    });
    if (m.type === "class" && !old) this.setState({ classId: id });
    if (m.type === "module") this.setState({ moduleId: id });
    if (m.type === "session") this.setState({ sessionId: id });
    if (m.type === "assessment") this.setState({ assessmentId: id });
    this.close();
    this.notify(old ? "تغییرات ذخیره شد." : "مورد جدید با موفقیت ثبت شد.");
  }
  exportBackup() {
    downloadText(
      JSON.stringify(this.state.db, null, 2),
      `classyar-backup-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json;charset=utf-8",
    );
    this.notify("نسخه پشتیبان دریافت شد.");
  }
  importBackup(ev) {
    const f = ev.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const incoming = JSON.parse(reader.result);
        if (!L.validateDatabase(incoming))
          throw Error("ساختار فایل نامعتبر است");
        if (
          !confirm(
            "اطلاعات فعلی با محتوای این نسخه پشتیبان جایگزین شود؟ ابتدا از داده‌های فعلی فایل پشتیبان بگیرید.",
          )
        )
          return;
        this.setState({
          db: L.normalizedDatabase(incoming),
          classId: incoming.classes[0]?.id || null,
          moduleId: null,
          sessionId: null,
          assessmentId: null,
          view: "dashboard",
        });
        this.notify("نسخه پشتیبان بازیابی شد.");
      } catch {
        this.notify("فایل انتخاب‌شده معتبر نیست.");
      }
    };
    reader.readAsText(f);
    ev.target.value = "";
  }
  get reportScope() {
    return this.state.gradeScope === "all"
      ? "all"
      : this.currentModule?.id || "all";
  }
  exportGradeList(format = "xlsx") {
    if (!this.selectedClass) return;
    try {
      const scope = this.reportScope;
      const report = EX.listRows(this.state.db, this.state.classId, scope);
      const safe = (
        this.selectedClass.name +
        "-" +
        (scope === "all" ? "تمام-پودمان‌ها" : this.currentModule.name)
      ).replace(/[\\/:*?"<>|]/g, "-");
      if (format === "xlsx")
        downloadBinary(
          EX.makeXLSX(this.state.db, this.state.classId, scope),
          `لیست-نمرات-${safe}.xlsx`,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
      else
        downloadText(
          EX.makeCSV(report),
          `لیست-نمرات-${safe}.csv`,
          "text/csv;charset=utf-8",
        );
      this.notify(
        format === "xlsx"
          ? "فایل اکسل لیست نمرات آماده شد."
          : "فایل CSV لیست نمرات آماده شد.",
      );
    } catch (err) {
      this.notify("خطا در خروجی: " + err.message);
    }
  }
  printGradeList() {
    window.print();
  }
  renderHeader() {
    return e(Header, { app: this });
  }
  renderSidebar() {
    return e(Sidebar, { app: this });
  }
  renderClassSwitcher() {
    return e(ClassSwitcher, { app: this });
  }
  renderDashboard() {
    return e(Dashboard, { app: this });
  }
  renderClasses() {
    return e(Classes, { app: this });
  }
  renderStudents() {
    return e(Students, { app: this });
  }
  renderAttendance() {
    return e(Attendance, { app: this });
  }
  renderModules() {
    return e(Modules, { app: this });
  }
  renderAssessments() {
    return e(Assessments, { app: this });
  }
  renderGrades() {
    return e(Grades, { app: this });
  }
  renderSettings() {
    return e(Settings, { app: this });
  }
  renderModal() {
    return e(ClassroomModal, { app: this });
  }
  render() {
    const current = this.selectedClass;
    let content;
    if (!current && !["classes", "settings"].includes(this.state.view))
      content = e(Empty, {
        title: "هنوز کلاسی تعریف نشده است",
        description:
          "برای استفاده از امکانات سامانه، ابتدا یک کلاس ایجاد کنید.",
        action: button(
          "تعریف کلاس",
          "plus",
          () => this.open("class"),
          "primary",
        ),
      });
    else
      switch (this.state.view) {
        case "classes":
          content = this.renderClasses();
          break;
        case "students":
          content = this.renderStudents();
          break;
        case "attendance":
          content = this.renderAttendance();
          break;
        case "modules":
          content = this.renderModules();
          break;
        case "assessments":
          content = this.renderAssessments();
          break;
        case "grades":
          content = this.renderGrades();
          break;
        case "settings":
          content = this.renderSettings();
          break;
        default:
          content = this.renderDashboard();
      }
    return e(
      "div",
      { className: "app" },
      this.renderSidebar(),
      e(
        "div",
        { className: "main-area" },
        this.renderHeader(),
        e(
          "main",
          { className: "main-content" },
          this.renderClassSwitcher(),
          this.syncBlocked
            ? e(
                "div",
                { className: "notice no-print", role: "alert" },
                e(Icon, { name: "alert", size: 18 }),
                "تغییرات این دستگاه هنوز در سرور ذخیره نشده‌اند.",
                button("پشتیبان و دریافت نسخه سرور", "download", () =>
                  this.resolveConflict(),
                ),
              )
            : null,
          content,
          e(
            "footer",
            { className: "app-footer" },
            "کلاس‌یار ۳ · طراحی پودمانی و گزارش‌گیری پویا · اطلاعات شما روی دستگاه شما",
          ),
        ),
      ),
      this.renderModal(),
      this.state.notification
        ? e(
            "div",
            { className: "toast" },
            e(Icon, { name: "check", size: 18 }),
            this.state.notification,
          )
        : null,
    );
  }
}
