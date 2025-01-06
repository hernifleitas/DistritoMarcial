const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: '',
    database: 'tierraDePeleadores'
});

connection.connect(err => {
    if (err) {
        console.log("Error de conexión: " + err.stack);
        return;
    }
    console.log("Conectado a la base de datos como " + connection.threadId);
});

module.exports = connection;