import { createElement as e, useEffect, useRef } from "react";
import { Icon, Button, IconButton, FormInput } from "./ui.jsx";
import { fmt, dateNow } from "../lib/format.mjs";

export default function ClassroomModal({ app }) {
  const dialogRef = useRef(null);
  const m = app.state.modal;
  useEffect(() => {
    if (!m) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() =>
      dialogRef.current
        ?.querySelector(
          'input:not([type="hidden"]),textarea,button[role="combobox"]',
        )
        ?.focus(),
    );
    const onKeyDown = (event) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        app.close();
      }
      if (event.key !== "Tab") return;
      const controls = [
        ...(dialogRef.current?.querySelectorAll(
          'button:not([disabled]),input:not([type="hidden"]),textarea,select:not([aria-hidden="true"])',
        ) || []),
      ];
      const first = controls[0],
        last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [m, app]);
  if (!m) return null;
  const item = m.item || {};
  const classId = app.state.classId;
  const module = app.currentModule;
  let title = "",
    fields = [];
  if (m.type === "class") {
    title = m.item ? "ویرایش کلاس" : "تعریف کلاس جدید";
    fields = [
      e(FormInput, {
        label: "نام کلاس",
        name: "name",
        value: item.name || "",
        required: true,
        placeholder: "مثلاً یازدهم شبکه",
      }),
      e(
        "div",
        { className: "form-grid" },
        e(FormInput, {
          label: "پایه",
          name: "grade",
          value: item.grade || "10",
          kind: "select",
          options: [
            [10, "دهم"],
            [11, "یازدهم"],
            [12, "دوازدهم"],
            [13, "سایر"],
          ].map(([value, label]) => ({ value, label })),
        }),
        e(FormInput, {
          label: "سال تحصیلی",
          name: "year",
          value: item.year || "۱۴۰۵–۱۴۰۶",
          required: true,
        }),
      ),
      e(FormInput, {
        label: "نام درس",
        name: "subject",
        value: item.subject || "",
        placeholder: "عنوان درس",
      }),
      e(FormInput, {
        label: "رنگ شناسایی کلاس",
        name: "color",
        kind: "color",
        value: item.color || "#5666e9",
      }),
    ];
  }
  if (m.type === "student") {
    title = m.item ? "ویرایش دانش‌آموز" : "افزودن دانش‌آموز";
    fields = [
      e(FormInput, {
        label: "نام و نام خانوادگی",
        name: "name",
        value: item.name || "",
        required: true,
        placeholder: "نام کامل",
      }),
      e(FormInput, {
        label: "کد دانش‌آموزی (اختیاری)",
        name: "studentCode",
        value: item.studentCode || "",
      }),
      e(FormInput, {
        label: "توضیحات",
        name: "note",
        kind: "textarea",
        value: item.note || "",
        placeholder: "مثلاً نیازمند بررسی نام در لیست",
      }),
    ];
  }
  if (m.type === "bulk") {
    title = "افزودن گروهی دانش‌آموزان";
    fields = [
      e(FormInput, {
        label: "اسامی دانش‌آموزان (هر سطر یک نام)",
        name: "names",
        kind: "textarea",
        rows: 9,
        required: true,
        placeholder: "علی محمدی\nرضا احمدی\n...",
      }),
      e(
        "p",
        { className: "note" },
        "می‌توانید اسامی را از Excel کپی کرده و در این کادر جای‌گذاری کنید.",
      ),
    ];
  }
  if (m.type === "module") {
    title = m.item ? "ویرایش پودمان" : "ایجاد پودمان";
    fields = [
      e(FormInput, {
        label: "نام پودمان",
        name: "name",
        value: item.name || "",
        required: true,
        placeholder: "مثلاً پودمان دوم",
      }),
      e(FormInput, {
        label: "ترتیب نمایش",
        name: "order",
        kind: "number",
        min: 1,
        value: item.order || app.modules.length + 1,
        required: true,
      }),
      e(FormInput, {
        label: "توضیحات (اختیاری)",
        name: "description",
        value: item.description || "",
        kind: "textarea",
      }),
    ];
  }
  if (m.type === "component") {
    title = m.item ? "ویرایش بخش نمره‌دهی" : "افزودن بخش نمره‌دهی";
    fields = [
      e(FormInput, {
        label: "عنوان بخش",
        name: "name",
        value: item.name || "",
        required: true,
        placeholder: "مثلاً پروژه عملی",
      }),
      e(FormInput, {
        label: "نوع محاسبه",
        name: "kind",
        kind: "select",
        value: item.kind || "assessment",
        options: [
          {
            label: "براساس نمره آیتم‌ها (آزمون، تمرین، پروژه...)",
            value: "assessment",
          },
          { label: "براساس حضور در جلسات پودمان", value: "attendance" },
        ],
      }),
      e(FormInput, {
        label: "سهم از نمره نهایی (از ۲۰)",
        name: "weight",
        kind: "number",
        value: item.weight ?? 0,
        min: 0,
        max: 20,
        step: 0.25,
        required: true,
      }),
      e(
        "p",
        { className: "note" },
        "می‌توانید هر تعداد بخش تعریف کنید؛ جمع وزن بخش‌ها باید ۲۰ شود. تغییر نوع بخش ممکن است روی ارزیابی‌های قبلی اثر بگذارد.",
      ),
    ];
  }
  if (m.type === "session") {
    title = m.item ? "ویرایش جلسه" : "تعریف جلسه جدید";
    fields = [
      e(FormInput, {
        label: "عنوان جلسه",
        name: "title",
        value: item.title || "جلسه " + fmt(app.classSessions.length + 1),
        required: true,
      }),
      e(FormInput, {
        label: "تاریخ جلسه (شمسی)",
        name: "date",
        value: item.date || dateNow(),
        required: true,
        placeholder: "۱۴۰۵/۰۸/۱۱",
      }),
      e(FormInput, {
        label: "پودمان این جلسه",
        name: "moduleId",
        kind: "select",
        value: item.moduleId || module?.id || "",
        required: true,
        options: app.modules.map((x) => ({ value: x.id, label: x.name })),
      }),
      e(
        "p",
        { className: "note" },
        "هر جلسه دقیقاً به یک پودمان متصل است؛ سهم حضور براساس جلسات همان پودمان محاسبه می‌شود.",
      ),
    ];
  }
  if (m.type === "assessment") {
    const opts = app.state.db.components.filter(
      (c) => c.moduleId === module?.id && c.kind === "assessment",
    );
    title = m.item ? "ویرایش آیتم ارزشیابی" : "آزمون یا تمرین جدید";
    fields = [
      e(FormInput, {
        label: "عنوان آیتم",
        name: "title",
        value: item.title || "",
        required: true,
        placeholder: "مثلاً آزمون پودمان اول",
      }),
      e(FormInput, {
        label: "بخش نمره‌دهی",
        name: "componentId",
        kind: "select",
        value: item.componentId || opts[0]?.id || "",
        required: true,
        options: opts.map((c) => ({ label: c.name, value: c.id })),
      }),
      e(
        "div",
        { className: "form-grid" },
        e(FormInput, {
          label: "بارم این آیتم",
          name: "maxScore",
          kind: "number",
          min: 0.25,
          step: 0.25,
          value: item.maxScore ?? 20,
          required: true,
        }),
        e(FormInput, {
          label: "تاریخ (شمسی)",
          name: "date",
          value: item.date || dateNow(),
        }),
      ),
      e(
        "p",
        { className: "note" },
        "بارم این آیتم مستقل از سهم بخش است. همه آیتم‌های یک بخش به نسبت بارم خود در آن بخش اثر می‌گذارند.",
      ),
    ];
  }
  return e(
    "div",
    {
      className: "dialog-overlay open",
      onMouseDown: (ev) => {
        if (ev.target === ev.currentTarget) app.close();
      },
    },
    e(
      "div",
      {
        className: "dialog",
        ref: dialogRef,
        role: "dialog",
        "aria-modal": "true",
        "aria-label": title,
      },
      e(
        "div",
        { className: "dialog-head" },
        e(
          "div",
          null,
          e("h3", null, title),
          e(
            "p",
            null,
            m.type === "class" && !m.item
              ? "پس از ساخت کلاس، به فهرست دانش‌آموزان آن می‌روید."
              : "اطلاعات را تکمیل و ذخیره کنید.",
          ),
        ),
        e(IconButton, {
          icon: "close",
          onClick: () => app.close(),
          label: "بستن",
        }),
      ),
      e(
        "form",
        { onSubmit: (ev) => app.saveModal(ev) },
        e(
          "div",
          { className: "dialog-body" },
          fields.map((field, i) => e("div", { key: i }, field)),
        ),
        e(
          "div",
          { className: "dialog-foot" },
          e(
            Button,
            { type: "submit", icon: "check" },
            m.type === "class" && !m.item
              ? "ساخت کلاس و ادامه"
              : "ذخیره تغییرات",
          ),
          e(Button, { variant: "ghost", onClick: () => app.close() }, "انصراف"),
        ),
      ),
    ),
  );
}
