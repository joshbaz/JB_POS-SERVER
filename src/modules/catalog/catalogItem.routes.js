const express = require('express');
const multer = require('multer');
const { getCatalogItems, importCSV } = require('./catalogItem.controller');

const router = express.Router();
// Set up multer upload for saving to a short-lived 'uploads/' directory inside the workspace
const upload = multer({ dest: './uploads/' });

router.route('/').get(getCatalogItems);
router.route('/upload').post(upload.single('file'), importCSV);

module.exports = router;
