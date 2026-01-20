const { createHash } = require('crypto'); // módulo para hashing

/**
 * Devuelve el hash SHA-1 (hexadecimal, mayúsculas) de la contraseña dada.
 * @param {string} password 
 * @returns {string} hash en HEX
 */
function hashPassword(password) {
  const hash = createHash('sha1'); // usamos sh1 pero se puede usar 'sha256' para más seguridad
  hash.update(password, 'utf8');
  return hash.digest('hex').toUpperCase();
}


module.exports = { hashPassword };
