const express = require('express');
const router = express.Router();
const sampleController = require('../controllers/sampleController');

router.get('/', sampleController.getHome);

module.exports = router;
