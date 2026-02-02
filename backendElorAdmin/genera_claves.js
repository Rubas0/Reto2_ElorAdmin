const { generateKeyPairSync } = require('crypto');
const fs = require('fs');

// Crea la carpeta 'keys' si no existe (sin necesidad de verificar antes)
fs.mkdirSync('keys', { recursive: true });

// Genera un par de claves RSA (2048 bits) y las guarda en archivos PEM
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding:  { type: 'pkcs1', format: 'pem' }, // pem = Privacy-Enhanced Mail
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
});

fs.writeFileSync('keys/public.key', publicKey);
fs.writeFileSync('keys/private.key', privateKey);

console.log('Claves generadas: public.key y private.key');