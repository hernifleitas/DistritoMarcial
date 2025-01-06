const jwt = require('jsonwebtoken');

function verifyToken(req,res, next){
    const token = req.headers['authorization']?.split(' ')[1];
    if(!token) return res.status(401).send('Token requerido');

    try {
        const decoded = jwt.verify(token,'mi_clave_secreta');
        req.user = decoded;
        next();
    } catch (err){
        return res.status(401).send('Token inválido o expirado');
    }
}

module.exports = verifyToken