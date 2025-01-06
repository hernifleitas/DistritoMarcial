const express = require("express");
const router = express.Router();
const connection = require('../database/db');
const path = require('path');
//const verifyToken = require('../middleware/verifyToken')
// Ruta para el formulario de inscripción
router.get('/inscribirse', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'inscribir.html'));
});

// Ruta para procesar el formulario de inscripción
router.get('/inscribirse', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'inscribir.html'));
});

// Ruta para procesar el formulario de inscripción
router.post('/inscribir', (req, res) => {
    const { nombre, edad, categoria, escuela, contacto, genero, peleas, nueva_escuela } = req.body;

    let escuelaId = escuela; // Por defecto, tomamos el valor de escuela seleccionado

    // Si se eligió "nueva", insertamos la nueva escuela
    if (escuela === 'nueva' && nueva_escuela) {
        const insertEscuelaQuery = 'INSERT INTO escuelas (escuela_nombres) VALUES (?)';
        connection.query(insertEscuelaQuery, [nueva_escuela], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Error al agregar la escuela");
            }

            // Después de insertar, obtenemos el id de la nueva escuela
            escuelaId = result.insertId;

            // Ahora insertamos la inscripción
            const query = `
                INSERT INTO inscripciones (nombre, edad, categoria_id, escuela_id, contacto, genero, peleas)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            connection.query(query, [nombre, edad, categoria, escuelaId, contacto, genero, peleas], (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send("Error en la inscripción");
                }
            
                // Obtenemos el nombre de la escuela antes de redirigir
                connection.query('SELECT escuela_nombres FROM escuelas WHERE id = ?', [escuelaId], (err, rows) => {
                    if (err || rows.length === 0) {
                        console.log("Error al obtener el nombre de la escuela:", err || "No se encontraron resultados.");
                        return res.status(500).send("Error al obtener el nombre de la escuela");
                    }
            
                    const escuelaNombre = rows[0].escuela_nombres;
                    const mensaje = `Hola Soy ${nombre} De la escuela ${escuelaNombre} quería confirmar mi participación en TIERRA DE PELEADORES`;
                    const enlaceWhatsapp = `https://wa.me/1158286890?text=${encodeURIComponent(mensaje)}`;
                    return res.redirect(enlaceWhatsapp)
                });
            });
        });
    } else {
        // Si no se eligió "nueva", insertamos directamente la inscripción
        const query = `
            INSERT INTO inscripciones (nombre, edad, categoria_id, escuela_id, contacto, genero, peleas)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        connection.query(query, [nombre, edad, categoria, escuelaId, contacto, genero, peleas], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Error en la inscripción");
            }
        
            // Obtenemos el nombre de la escuela antes de redirigir
            connection.query('SELECT escuela_nombres FROM escuelas WHERE id = ?', [escuelaId], (err, rows) => {
                if (err || rows.length === 0) {
                    console.log("Error al obtener el nombre de la escuela:", err || "No se encontraron resultados.");
                    return res.status(500).send("Error al obtener el nombre de la escuela");
                }
        
                const escuelaNombre = rows[0].escuela_nombres;
                const mensaje = `Hola Soy ${nombre} De la escuela ${escuelaNombre} quería confirmar mi participación en TIERRA DE PELEADORES`;
                const enlaceWhatsapp = `https://wa.me/1158286890?text=${encodeURIComponent(mensaje)}`;
                return res.redirect(enlaceWhatsapp)
            });
        });
    }
});

module.exports = router;
