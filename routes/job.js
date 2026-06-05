const express = require('express');
const router = express.Router();
const { ROLES } = require('../utils/constants')

const controller = require('../controllers/jobController');
const rateLimiter = require('../middleware/rateLimiter');

const authorizeRole = require('../middleware/authorizeRole');
const protect = require('../middleware/protect');

router.use(rateLimiter.api);

// Employer only GET
router.get('/mine', protect, authorizeRole(ROLES.EMPLOYER), controller.getMine);

// Public GET
router.get('/', controller.getAll);
router.get('/:id', controller.getOneById);

// Employer only
router.post('/', protect, authorizeRole(ROLES.EMPLOYER), controller.createNew);
router.put('/:id', protect, authorizeRole(ROLES.EMPLOYER), controller.updateExisting);

router.delete('/:id', protect, authorizeRole(ROLES.EMPLOYER), controller.deleteExistant);


module.exports = router;