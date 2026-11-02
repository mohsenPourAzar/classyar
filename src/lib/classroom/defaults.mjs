import { makeId } from "../format.mjs";
export function makeDefaultComponents(db, moduleId) {
  for (const [tag, name, weight] of [
    ["exam", "آزمون پودمان", 15],
    ["exercise", "تمرین‌ها", 4],
    ["attendance", "حضور و غیاب", 1],
  ])
    db.components.push({
      id: makeId(),
      moduleId,
      name,
      weight,
      kind: tag === "attendance" ? "attendance" : "assessment",
      tag,
    });
}
