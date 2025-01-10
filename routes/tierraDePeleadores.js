const express = require('express');
const router = express.Router();
const path = require('path')

router.get('/tierraDePeleadores', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'tierraDePeleadores.html'));

});


module.exports = router