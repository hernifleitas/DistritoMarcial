const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const inscripcionesRoutes = require('./routes/inscripciones');
const participantesRoutes = require('./routes/participantes');
const indexRoutes = require('./routes/index')
const instructoresRoutes = require('./routes/instructores')
const connection = require("./database/db");
const app = express();
const port = 3000;

// Middleware para archivos estáticos (CSS)
app.use(express.static(path.join(__dirname, 'public')));


// Middleware para el body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Usamos las rutas importadas
app.use('/', inscripcionesRoutes);
app.use('/participantes', participantesRoutes); 
app.use('/', indexRoutes);
app.use('/', instructoresRoutes);

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});