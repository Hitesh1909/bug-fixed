function requiredText(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    const error = new Error(`${label} is required`);
    error.status = 400;
    throw error;
  }
  return value.trim();
}

function requiredYear(value) {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    const error = new Error("Published year is required");
    error.status = 400;
    throw error;
  }
  const max = new Date().getFullYear() + 1;
  if (value < 1000 || value > max) {
    const error = new Error("Published year is out of range");
    error.status = 400;
    throw error;
  }
  return value;
}

function requiredPrice(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    const error = new Error("Price must be zero or greater");
    error.status = 400;
    throw error;
  }
  return Math.round(value * 100) / 100;
}

function requiredQuantity(value) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    const error = new Error("Quantity must be zero or greater");
    error.status = 400;
    throw error;
  }
  return value;
}

function requiredAdjustment(value) {
  if (typeof value !== "number" || !Number.isInteger(value) || value === 0) {
    const error = new Error("Adjustment must be a non-zero integer");
    error.status = 400;
    throw error;
  }
  return value;
}

function parseId(id) {
  if (!/^\d+$/.test(String(id))) {
    return null;
  }
  return Number(id);
}

module.exports = {
  requiredText,
  requiredYear,
  requiredPrice,
  requiredQuantity,
  requiredAdjustment,
  parseId,
};
