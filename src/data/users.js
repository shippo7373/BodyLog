export const USERS = [
  { id: "nami", label: "nami", color: "#4f8f8b", greeting: "daily note" },
  { id: "kaz", label: "kaz", color: "#b27a45", greeting: "daily note" },
];

export const WEIGHT_TIMINGS = [
  { value: "beforeDinner", label: "夕食前" },
  { value: "afterDinner", label: "夕食後" },
];

export const MEAL_FIELDS = [
  { key: "meal1", label: "1回目" },
  { key: "meal2", label: "2回目" },
  { key: "meal3", label: "3回目" },
];

export const SNACK_FIELDS = [
  { key: "snack1", label: "1回目" },
  { key: "snack2", label: "2回目" },
  { key: "snack3", label: "3回目" },
];

export const FOOD_FIELDS = [...MEAL_FIELDS, ...SNACK_FIELDS];
