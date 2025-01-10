const express = require('express');
const router = express.Router();
const path = require('path')

router.get('/horarios', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'horarios.html'));

});
module.exports = router