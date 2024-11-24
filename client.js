const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');
const FormData = require('form-data');

// Leer la clave pública del servidor
const publicKey = fs.readFileSync('public_key.pem', 'utf8');

// Leer el archivo Word a cifrar
const fileData = fs.readFileSync('documento.docx');

// 1. Generar clave AES y cifrar el archivo
const aesKey = crypto.randomBytes(32); // Clave AES de 256 bits
const iv = crypto.randomBytes(16); // IV de 16 bytes

// Cifrar el archivo con AES
const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
let encryptedFile = cipher.update(fileData);
encryptedFile = Buffer.concat([encryptedFile, cipher.final()]);

// Guardar el archivo cifrado localmente
fs.writeFileSync('documento_encriptado_cliente.docx', encryptedFile);
console.log('Archivo encriptado guardado como: documento_encriptado_cliente.docx');

// 2. Cifrar la clave AES con RSA
const encryptedKey = crypto.publicEncrypt(
  {
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: "sha256", // Debe coincidir con el hash usado en el servidor
  },
  aesKey
);

// 3. Enviar el archivo cifrado y la clave cifrada al servidor
const formData = new FormData();
formData.append('file', encryptedFile, 'documento_encriptado.docx');
formData.append('key', encryptedKey.toString('base64')); // Clave AES cifrada
formData.append('iv', iv.toString('base64')); // IV necesario para AES

axios
  .post('https://localhost:443/upload', formData, {
    headers: {
      ...formData.getHeaders(),
    },
    httpsAgent: new (require('https').Agent)({
      rejectUnauthorized: false, // Desactivar la verificación del certificado para localhost
    }),
  })
  .then((response) => {
    console.log('Respuesta del servidor:', response.data);
  })
  .catch((error) => {
    console.error('Error al enviar el archivo:', error.message);
  });
