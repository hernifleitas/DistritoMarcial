const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const connection = require('../database/db');
const path = require('path')

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'index.html'));

});


module.exports = router