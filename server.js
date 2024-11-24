const https = require('https');
const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = 443;

// Leer las claves RSA del servidor
const privateKey = fs.readFileSync('private_key.pem', 'utf8'); // Clave privada del servidor

const serverOptions = {
  key: fs.readFileSync('private_key.pem'), // Clave privada para HTTPS
  cert: fs.readFileSync('cert.pem'), // Certificado para HTTPS
};

// Middleware para manejar la carga de archivos
app.use(fileUpload());

// Ruta para recibir el archivo cifrado
app.post('/upload', (req, res) => {
  if (!req.files || !req.files.file || !req.body.key || !req.body.iv) {
    return res.status(400).send('Datos insuficientes');
  }

  const encryptedFile = req.files.file.data;
  const encryptedKey = Buffer.from(req.body.key, 'base64'); // Clave AES cifrada
  const iv = Buffer.from(req.body.iv, 'base64'); // IV necesario para AES

  try {
    // 1. Descifrar la clave AES usando RSA
    const aesKey = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256", // Asegúrate de que el hash sea el mismo que se usó para cifrar
      },
      encryptedKey
    );

    // 2. Descifrar el archivo usando AES
    const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
    let decryptedFile = decipher.update(encryptedFile);
    decryptedFile = Buffer.concat([decryptedFile, decipher.final()]);

    // Guardar el archivo descifrado
    const outputFilePath = 'documento_descifrado.docx';
    fs.writeFileSync(outputFilePath, decryptedFile);

    // Enviar mensaje de confirmación al cliente
    res.status(200).send({
      message: 'Archivo recibido y descifrado con éxito',
      descifrado: true,
      filePath: outputFilePath,
    });
    console.log('Archivo recibido y descifrado con éxito:', outputFilePath);
  } catch (error) {
    console.error('Error al descifrar el archivo:', error);
    res.status(500).send({
      message: 'Error al descifrar el archivo',
      descifrado: false,
      error: error.message,
    });
  }
});

// Crear el servidor HTTPS
https.createServer(serverOptions, app).listen(PORT, () => {
  console.log(`Servidor escuchando en https://localhost:${PORT}`);
});
