const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');

// Configurar la clave AES y el IV (debe ser compartido entre cliente y servidor de forma segura)
const aesKey = crypto.randomBytes(32); // Clave AES de 256 bits
const iv = crypto.randomBytes(16); // IV de 16 bytes

// Leer el archivo a enviar y cifrarlo con AES
const fileData = fs.readFileSync('documento.docx');
const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
let encryptedFile = cipher.update(fileData);
encryptedFile = Buffer.concat([encryptedFile, cipher.final()]);

// Enviar el archivo cifrado, la clave y el IV al servidor
const FormData = require('form-data');
const formData = new FormData();
formData.append('file', encryptedFile, 'documento_encriptado.docx');
formData.append('key', aesKey.toString('base64'));
formData.append('iv', iv.toString('base64'));

axios.post('https://localhost:443/upload', formData, {
  headers: {
    ...formData.getHeaders()
  },
  httpsAgent: new (require('https').Agent)({
    rejectUnauthorized: false // Desactivar verificación del certificado para localhost
  })
})
.then(response => {
  console.log('Respuesta del servidor:', response.data);
})
.catch(error => {
  console.error('Error al enviar el archivo:', error.message);
});
