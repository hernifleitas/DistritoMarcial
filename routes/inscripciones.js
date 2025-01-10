const express = require("express");
const router = express.Router();
const connection = require('../database/db');
const path = require('path');
const Joi = require('joi');

// Esquema de validación de datos
const schema = Joi.object({
    nombre: Joi.string().min(1).required(),
    edad: Joi.number().integer().min(1).required(),
    categoria: Joi.number().integer().required(),
    escuela: Joi.string().required(),
    contacto: Joi.string().min(1).required(),
    genero: Joi.string().valid('masculino', 'femenino').required(),
    peleas: Joi.number().integer().min(0).required(),
    nueva_escuela: Joi.string().allow(''), // Puede ser opcional
    modalidad: Joi.string()
    .valid('Pelea KickBoxing', 'Pelea K1','Pelea Full Contact' , 'Pelea Boxeo', 'Exhibicion KickBoxing','Exhibicion Boxeo', 'Exhibicion Full Contact')
    .required()
});

// Ruta para el formulario de inscripción
router.get('/inscribirse', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'inscribir.html'));
});

// Ruta para procesar el formulario de inscripción
router.post('/inscribir', (req, res) => {
    // Validación de los datos
    const { error, value } = schema.validate(req.body);
    if (error) {
        return res.status(400).send("Datos inválidos: " + error.details[0].message);
    }

    const { nombre, modalidad, edad, categoria, escuela, contacto, genero, peleas, nueva_escuela } = value;

    // Verificar si el participante ya está registrado
    const checkQuery = 'SELECT * FROM inscripciones WHERE nombre = ? AND categoria_id = ? AND contacto = ?';
    connection.query(checkQuery, [nombre, categoria, contacto], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error al verificar duplicados");
        }

        if (results.length > 0) {
            return res.status(400).send("Este participante ya está registrado.");
        }

        // Procesar inscripción si no hay duplicados
        procesarInscripcion({ nombre, modalidad, edad, categoria, escuela, contacto, genero, peleas, nueva_escuela }, res);
    });
});

function procesarInscripcion({ nombre, modalidad, edad, categoria, escuela, contacto, genero, peleas, nueva_escuela }, res) {
    let escuelaId = escuela;

    if (escuela === 'nueva' && nueva_escuela) {
        const insertEscuelaQuery = 'INSERT INTO escuelas (escuela_nombres) VALUES (?)';
        connection.query(insertEscuelaQuery, [nueva_escuela], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Error al agregar la escuela");
            }

            escuelaId = result.insertId;
            insertarInscripcion({ nombre,modalidad, edad, categoria, escuelaId, contacto, genero, peleas }, res);
        });
    } else {
        insertarInscripcion({ nombre,modalidad, edad, categoria, escuelaId, contacto, genero, peleas }, res);
    }
}

function insertarInscripcion({ nombre, modalidad, edad, categoria, escuelaId, contacto, genero, peleas }, res) {
    const query = `
        INSERT INTO inscripciones (nombre, modalidad, edad, categoria_id, escuela_id, contacto, genero, peleas)
        VALUES (?, ?, ?, ?, ?, ?, ?,?)
    `;
    connection.query(query, [nombre, modalidad, edad, categoria, escuelaId, contacto, genero, peleas], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error en la inscripción");
        }

        connection.query('SELECT escuela_nombres FROM escuelas WHERE id = ?', [escuelaId], (err, rows) => {
            if (err || rows.length === 0) {
                console.log("Error al obtener el nombre de la escuela:", err || "No se encontraron resultados.");
                return res.status(500).send("Error al obtener el nombre de la escuela");
            }

            const escuelaNombre = rows[0].escuela_nombres;
            const mensaje = `Hola Soy ${nombre} De la escuela ${escuelaNombre} quería inscribirme para ${modalidad} en TIERRA DE PELEADORES`;
            const enlaceWhatsapp = `https://wa.me/1158286890?text=${encodeURIComponent(mensaje)}`;
            return res.redirect(enlaceWhatsapp);
        });
    });
}

module.exports = router;