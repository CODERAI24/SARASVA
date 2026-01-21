export function isValidId(id) {
  return typeof id === "string" && id.length > 0;
}

export function isValidDate(date) {
  return typeof date === "string" && !isNaN(Date.parse(date));
}

export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function isBoolean(value) {
  return typeof value === "boolean";
}
