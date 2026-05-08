function normalizePhone(phone) {
  return String(phone || '').trim();
}

function getPhoneDigits(phone) {
  return normalizePhone(phone).replace(/\D/g, '');
}

function isValidPhone(phone, minDigits = 10, maxDigits = 12) {
  const digits = getPhoneDigits(phone);
  return digits.length >= minDigits && digits.length <= maxDigits;
}

function isValidUaPhone(phone) {
  const digits = getPhoneDigits(phone);
  return /^0\d{9}$/.test(digits) || /^380\d{9}$/.test(digits);
}

function isValidInternationalPhone(phone) {
  const normalized = normalizePhone(phone);
  const digits = getPhoneDigits(normalized);

  // Local UA formats without '+' are explicitly allowed
  if (isValidUaPhone(normalized)) return true;

  // For non-UA numbers require international format with '+'
  if (!normalized.startsWith('+')) return false;

  // E.164 max length is 15 digits, practical min is 8
  return digits.length >= 8 && digits.length <= 15;
}

module.exports = {
  normalizePhone,
  getPhoneDigits,
  isValidPhone,
  isValidUaPhone,
  isValidInternationalPhone
};
