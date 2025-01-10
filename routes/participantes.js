const express = require("express");
const router = express.Router();
const connection = require('../database/db');  // Conexión a la base de datos

// Ruta para mostrar los participantes
router.get('/', (req, res) => {
    const query = `
        SELECT 
            i.id, 
            i.nombre, 
            i.edad, 
            i.genero, 
            c.categoria, 
            e.escuela_nombres AS escuela, 
            i.contacto, 
            i.peleas,
            i.modalidad
        FROM inscripciones i
        JOIN categorias c ON i.categoria_id = c.id
        JOIN escuelas e ON i.escuela_id = e.id
        ORDER BY c.categoria, i.modalidad
    `;

    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).send("Error al obtener inscripciones");
        }

        // Agrupar participantes por modalidad y luego por categoría
        const modalidades = {
            'Pelea KickBoxing': {},
            'Pelea K1': {},
            'Pelea Full Contact': {},
            'Pelea Boxeo': {},
            'Exhibicion KickBoxing': {},
            'Exhibicion Boxeo': {},
            'Exhibicion Full Contact': {}
        };

        results.forEach(participante => {
            if (!modalidades[participante.modalidad]) return;

            if (!modalidades[participante.modalidad][participante.categoria]) {
                modalidades[participante.modalidad][participante.categoria] = [];
            }

            modalidades[participante.modalidad][participante.categoria].push(participante);
        });

        // Generar HTML
        let html = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Participantes</title>
                <link rel="stylesheet" href="/participantes.css">
            </head>
            <body>
                <div class="logo">
                    <a href=""><img class="elemento-golpe" src="/images/image.png" alt="logo"> </a>
                </div>
                <h1>Lista de Participantes</h1>
        `;

        // Generar una sección para cada modalidad
        Object.keys(modalidades).forEach(modalidad => {
            if (Object.keys(modalidades[modalidad]).length > 0) {
                html += `<br><h2>${modalidad}</h2>`; // Título de la modalidad

                // Generar las categorías dentro de cada modalidad
                Object.keys(modalidades[modalidad]).forEach(categoria => {
                    const categoriaParticipantes = modalidades[modalidad][categoria];
                    html += `<br><h2>${categoria}</h2>`; // Título de la categoría
                    html += `
                        <table>
                            <tr>
                                <th data=label="Nombre">Nombre</th>
                                <th data=label="Modalidad">Modalidad</th>
                                <th>Edad</th>
                                <th>Categoría</th>
                                <th>Escuela</th>
                                <th>Contacto</th>
                                <th>Género</th>
                                <th>Peleas</th>
                                <th>Acción</th>
                            </tr>
                    `;
                    categoriaParticipantes.forEach(participante => {
                        html += `
                            <tr>
                                <td data-label="Nombre:">${participante.nombre}</td>
                                <td data-label="Modalidad:">${participante.modalidad}</td>
                                <td data-label="Edad:">${participante.edad}</td>
                                <td data-label="Categoría:">${participante.categoria}</td>
                                <td data-label="Escuela:">${participante.escuela}</td>
                                <td data-label="Contacto:">${participante.contacto}</td>
                                <td data-label="Género:">${participante.genero}</td>
                                <td data-label="Peleas:">${participante.peleas}</td>
                                <td data-label="Actualizar:">
                                    <button class="btn-edit" onclick="editarParticipante(${participante.id})">Editar</button>
                                    <button class="btn-delete" onclick="eliminarParticipante(${participante.id})">Eliminar</button>
                                </td>
                            </tr>
                        `;
                    });
                    html += `</table>`;
                });
            }
        });

        html += `
            <script>
                function editarParticipante(id) {
                    window.location.href = '/participantes/editar/' + id;
                }

                function eliminarParticipante(id) {
                    if (confirm('¿Estás seguro de que deseas eliminar este participante?')) {
                        fetch('/participantes/eliminar/' + id, { method: 'DELETE' })
                            .then(response => {
                                if (response.ok) {
                                    alert('Participante eliminado con éxito.');
                                    
                                    window.location.reload();
                                } else {
                                    alert('Error al eliminar el participante, Comunicarse con el programador.');
                                }
                            });
                    }
                }
            </script>
            </body>
            </html>
        `;

        res.send(html);
    });
});

// Ruta para editar un participante
router.get('/editar/:id', (req, res) => {
    const id = req.params.id;
    const query = 'SELECT * FROM inscripciones WHERE id = ?';
    connection.query(query, [id], (err, results) => {
        if (err || results.length === 0) {
            console.error(err || "Participante no encontrado");
            return res.status(404).send('Participante no encontrado');
        }
        const participante = results[0];

        // Obtener las categorías disponibles
        const categoriasQuery = 'SELECT * FROM categorias';
        connection.query(categoriasQuery, (err, categorias) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error al obtener categorías');
            }

            // Obtener las escuelas únicas (sin duplicados)
            const escuelasQuery = 'SELECT DISTINCT escuela_nombres, id FROM escuelas ORDER BY escuela_nombres';
            connection.query(escuelasQuery, (err, escuelas) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Error al obtener escuelas');
                }

                // Filtrar las escuelas duplicadas y crear las opciones
                let escuelasOptions = '';
                let escuelasVistas = new Set();

                // Solo agregar escuelas no duplicadas
                escuelas.forEach(escuela => {
                    if (!escuelasVistas.has(escuela.escuela_nombres)) {
                        escuelasVistas.add(escuela.escuela_nombres);
                        escuelasOptions += `<option value="${escuela.id}" ${escuela.id === participante.escuela_id ? 'selected' : ''}>${escuela.escuela_nombres}</option>`;
                    }
                });

                // Si la escuela seleccionada es "Otra", agregar la opción para escribir una nueva escuela
                if (participante.escuela_id === 'nueva') {
                    escuelasOptions += `<option value="nueva" selected>Otra (Escribe tu escuela)</option>`;
                } else {
                    escuelasOptions += `<option value="nueva">Otra (Escribe tu escuela)</option>`;
                }

                // Generar el formulario de edición
                res.send(`
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Editar Participante</title>
                        <link rel="stylesheet" href="/editar.css">
                    </head>
                    <body>
                        <div class="logo">
                            <a href=""><img class="elemento-golpe" src="/images/image.png" alt="logo"> </a>
                        </div>

                        <div class="form-container">
                            <h1>Editar Participante</h1>
                            <form method="POST" action="/participantes/actualizar/${id}">
                                <label for="nombre">Nombre:</label>
                                <input type="text" id="nombre" name="nombre" value="${participante.nombre}" required><br>
                                <label for="modalidad">MODALIDAD:</label>
                                <select id="modalidad" name="modalidad" required>
                                    <option value="Pelea KickBoxing" ${participante.modalidad === "Pelea KickBoxing" ? "selected" : ""}>Pelea KickBoxing</option>
                                    <option value="Pelea K1" ${participante.modalidad === "Pelea K1" ? "selected" : ""}>Pelea K1</option>
                                    <option value="Pelea Full Contact" ${participante.modalidad === "Pelea Full Contact" ? "selected" : ""}>Pelea Full Contact</option>
                                    <option value="Pelea Boxeo" ${participante.modalidad === "Pelea Boxeo" ? "selected" : ""}>Pelea Boxeo</option>
                                    <option value="Exhibicion KickBoxing" ${participante.modalidad === "Exhibicion KickBoxing" ? "selected" : ""}>Exhibicion KickBoxing</option>
                                    <option value="Exhibicion Boxeo" ${participante.modalidad === "Exhibicion Boxeo" ? "selected" : ""}>Exhibición Boxeo</option>
                                    <option value="Exhibicion Full Contact" ${participante.modalidad === "Exhibicion Full Contact" ? "selected" : ""}>Exhibición Full Contact</option>
                                </select><br>

                                <label for="edad">Edad:</label>
                                <input type="number" id="edad" name="edad" value="${participante.edad}" required><br>

                                <label for="genero">Género:</label>
                                <select name="genero" id="genero">
                                    <option value="masculino" ${participante.genero === "masculino" ? "selected" : ""}>Masculino</option>
                                    <option value="femenino" ${participante.genero === "femenino" ? "selected" : ""}>Femenino</option>
                                </select><br>

                                <label for="categoria">Categoría:</label>
                                <select name="categoria" id="categoria">
                                    ${categorias.map(categoria => {
                                        return `<option value="${categoria.id}" ${categoria.id === participante.categoria_id ? 'selected' : ''}>${categoria.categoria}</option>`;
                                    }).join('')}
                                </select><br>

                                <label for="escuela">Escuela:</label>
                                <select name="escuela" id="escuela">
                                    ${escuelasOptions}
                                </select><br>

                                <div id="escuela-input-container" class="form-section" style="display: ${participante.escuela_id === 'nueva' ? 'block' : 'none'};">
                                    <label for="nueva_escuela">Nombre de la escuela:</label>
                                    <input type="text" id="nueva_escuela" name="nueva_escuela" placeholder="Escribe el nombre de tu escuela" />
                                </div>

                                <label for="peleas">Peleas:</label>
                                <input type="number" id="peleas" name="peleas" value="${participante.peleas}" required><br>

                                <button type="submit">Actualizar</button>
                            </form>
                        </div>

                        <script>
                            document.getElementById('escuela').addEventListener('change', function() {
                                var escuelaInputContainer = document.getElementById('escuela-input-container');
                                if (this.value === 'nueva') {
                                    escuelaInputContainer.style.display = 'block';
                                } else {
                                    escuelaInputContainer.style.display = 'none';
                                }
                            });
                        </script>
                    </body>
                    </html>
                `);
            });
        });
    });
});

// Ruta para actualizar un participante
router.post('/actualizar/:id', (req, res) => {
    const id = req.params.id;
    const { nombre, modalidad, edad, genero, categoria, escuela, nueva_escuela, peleas } = req.body;

    // Si se ha ingresado una nueva escuela, verificar si ya existe en la base de datos
    let escuelaId = escuela;
    if (escuela === 'nueva' && nueva_escuela) {
        // Verificar si la escuela ya existe
        const checkEscuelaQuery = 'SELECT id FROM escuelas WHERE escuela_nombres = ?';
        connection.query(checkEscuelaQuery, [nueva_escuela], (err, result) => {
            if (err) {
                console.error("Error al verificar la escuela:", err);
                return res.status(500).send('Error al verificar la escuela');
            }

            if (result.length > 0) {
                // Si la escuela ya existe, usar su ID
                escuelaId = result[0].id;

                // Actualizar la inscripción con la escuela existente
                const updateQuery = 'UPDATE inscripciones SET nombre = ? ,modalidad = ?, edad = ?, genero = ?, categoria_id = ?, escuela_id = ?, peleas = ? WHERE id = ?';
                connection.query(updateQuery, [nombre, modalidad, edad, genero, categoria, escuelaId, peleas, id], (err) => {
                    if (err) {
                        console.error("Error al actualizar participante:", err);
                        return res.status(500).send('Error al actualizar participante');
                    }
                    res.redirect('/participantes');
                });
            } else {
                // Si la escuela no existe, insertarla en la base de datos
                const insertEscuelaQuery = 'INSERT INTO escuelas (escuela_nombres) VALUES (?)';
                connection.query(insertEscuelaQuery, [nueva_escuela], (err, result) => {
                    if (err) {
                        console.error("Error al insertar nueva escuela:", err);
                        return res.status(500).send('Error al insertar nueva escuela');
                    }

                    escuelaId = result.insertId;

                    // Actualizar la inscripción con la nueva escuela
                    const updateQuery = 'UPDATE inscripciones SET nombre = ?,modalidad = ?, edad = ?, genero = ?, categoria_id = ?, escuela_id = ?, peleas = ? WHERE id = ?';
                    connection.query(updateQuery, [nombre, modalidad, edad, genero, categoria, escuelaId, peleas, id], (err) => {
                        if (err) {
                            console.error("Error al actualizar participante:", err);
                            return res.status(500).send('Error al actualizar participante');
                        }
                        res.redirect('/participantes');
                    });
                });
            }
        });
    } else {
        // Si no se selecciona "nueva" escuela, se actualiza directamente la inscripción con la escuela seleccionada
        const updateQuery = 'UPDATE inscripciones SET nombre = ?, modalidad = ?, edad = ?, genero = ?, categoria_id = ?, escuela_id = ?, peleas = ? WHERE id = ?';
        connection.query(updateQuery, [nombre, modalidad, edad, genero, categoria, escuelaId, peleas, id], (err) => {
            if (err) {
                console.error("Error al actualizar participante:", err);
                return res.status(500).send('Error al actualizar participante');
            }
            res.redirect('/participantes');
        });
    }
});

// Ruta para eliminar un participante
router.delete('/eliminar/:id', (req, res) => {
    const id = req.params.id;
    const query = 'DELETE FROM inscripciones WHERE id = ?';
    connection.query(query, [id], (err) => {
        if (err) {
            console.error("Error al eliminar participante:", err);
            return res.status(500).send('Error al eliminar participante');
        }
        res.sendStatus(200);
    });
});

module.exports = router;