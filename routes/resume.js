const express = require('express');
const router = express.Router();

const protect = require('../middleware/protect');
const authorizeRole = require('../middleware/authorizeRole');
const controller = require('../controllers/resumeController');
const upload = require('../middleware/upload');

const { ROLES } = require('../utils/constants');

router.use(protect);

router.get('/', authorizeRole(ROLES.CANDIDATE), controller.getAll);
router.get('/:id', authorizeRole(ROLES.CANDIDATE), controller.getOneById);

router.get('/:id/download', controller.downloadResume);

router.post('/', authorizeRole(ROLES.CANDIDATE), upload, controller.uploadResumes);

router.delete('/:id', authorizeRole(ROLES.CANDIDATE), controller.deleteResume);

module.exports = router;