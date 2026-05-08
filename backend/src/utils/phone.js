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

module.exports = {
  normalizePhone,
  getPhoneDigits,
  isValidPhone,
  isValidUaPhone
};
