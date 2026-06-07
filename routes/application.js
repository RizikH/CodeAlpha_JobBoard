// Application routes — mounts CRUD endpoints for job applications under /applications
const express = require('express');
const router = express.Router();

const controller = require('../controllers/applicationController');
const rateLimiter = require('../middleware/rateLimiter');
const authorizeRole = require('../middleware/authorizeRole');
const protect = require('../middleware/protect');
const { ROLES } = require('../utils/constants');

// Apply rate limiting and auth to all application routes
router.use(rateLimiter.api);
router.use(protect);

router.get('/', controller.getAll);
router.get('/:id', controller.getOneById);

// Only candidates can submit or delete applications
router.post('/', authorizeRole(ROLES.CANDIDATE), controller.createNew);

router.put('/:id', controller.updateExisting);

router.delete('/:id', authorizeRole(ROLES.CANDIDATE), controller.deleteExistantApplication);

module.exports = router;
