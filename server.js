const https = require('https');
const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = 443;

const serverOptions = {
  key: fs.readFileSync('key.pem'), // Clave privada para HTTPS
  cert: fs.readFileSync('cert.pem') // Certificado para HTTPS
};

// Middleware para manejar la carga de archivos
app.use(fileUpload());

// Ruta para recibir el archivo cifrado
app.post('/upload', (req, res) => {
  if (!req.files || !req.files.file || !req.body.key || !req.body.iv) {
    return res.status(400).send('Datos insuficientes');
  }

  const encryptedFile = req.files.file.data;
  const aesKey = Buffer.from(req.body.key, 'base64');
  const iv = Buffer.from(req.body.iv, 'base64');

  try {
    // Descifrar el archivo usando AES
    const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
    let decryptedFile = decipher.update(encryptedFile);
    decryptedFile = Buffer.concat([decryptedFile, decipher.final()]);

    // Guardar el archivo descifrado
    fs.writeFileSync('documento_descifrado.docx', decryptedFile);
    res.send('Archivo recibido y descifrado con éxito');
  } catch (error) {
    console.error('Error al descifrar el archivo:', error);
    res.status(500).send('Error al descifrar el archivo');
  }
});

// Crear el servidor HTTPS
https.createServer(serverOptions, app).listen(PORT, () => {
  console.log(`Servidor escuchando en https://localhost:${PORT}`);
});
