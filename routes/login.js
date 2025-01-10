const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
// Simulando una base de datos con un solo usuario (el profesor)
const users = [
  {
    id: '1',
    username: 'profesor',  // Nombre de usuario del profesor
    password: '$2b$10$HzZ7Kr5oCb0y6ySxD.lX9.XmL2fSTuSoKZfAB7r0FEiIX0ICzk56i', 
    role: 'admin' 
  }
];

const app = express();
app.use(bodyParser.json());

// Middleware para verificar la autenticación del usuario
function checkAdmin(req, res, next) {
  const { username, password } = req.body;

  // Buscar al usuario por su nombre de usuario
  const user = users.find(u => u.username === username);
  
  if (!user) {
    return res.status(401).send('Usuario no encontrado');
  }

  // Verificar la contraseña
  bcrypt.compare(password, user.password, (err, result) => {
    if (err || !result) {
      return res.status(401).send('Contraseña incorrecta');
    }

    // Verificar que el usuario tiene el rol 'admin'
    if (user.role !== 'admin') {
      return res.status(403).send('No tiene permisos');
    }

    next();  // Si es el profesor, continuar con la solicitud
  });
}

// Ruta de login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Buscar el usuario en la "base de datos"
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).send('Usuario no encontrado');
  }

  // Comparar la contraseña
  bcrypt.compare(password, user.password, (err, result) => {
    if (err || !result) {
      return res.status(401).send('Contraseña incorrecta');
    }

    // Si la autenticación es exitosa, enviar mensaje de éxito
    res.status(200).send('Inicio de sesión exitoso');
  });
});

// Ruta protegida que solo puede acceder el profesor
app.get('/participantes', checkAdmin, (req, res) => {
  res.send('Listado de participantes (solo accesible por el profesor)');
});
