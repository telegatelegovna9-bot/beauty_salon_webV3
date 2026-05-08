function normalizePhone(phone) {
  return String(phone || '').trim();
}

function getPhoneDigits(phone) {
  return normalizePhone(phone).replace(/\D/g, '');
}

function isValidPhone(phone, minDigits = 10, maxDigits = 15) {
  const digits = getPhoneDigits(phone);
  return digits.length >= minDigits && digits.length <= maxDigits;
}

module.exports = {
  normalizePhone,
  getPhoneDigits,
  isValidPhone
};

