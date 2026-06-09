const express = require('express');
const router = express.Router();

const rateLimiter = require('../middleware/rateLimiter');
const authorizeRole = require('../middleware/authorizeRole');
const protect = require('../middleware/protect');
const { ROLES } = require('../utils/constants');
const controller = require('../controllers/adminController');

router.use(rateLimiter.api, protect, authorizeRole(ROLES.ADMIN));

// Admin user routes
router.get('/user', controller.getAllUsers);
router.get('/user/:id', controller.getOneUserById);
router.put('/user/:id', controller.updateUserById);
router.delete('/user/:id', controller.deleteUserById);

// Admin candidate routes
router.get('/candidate', controller.getAllCandidates);
router.get('/candidate/:id', controller.getCandidateById);
router.delete('/candidate/:id', controller.deleteCandidateById);

// Admin employer routes
router.get('/employer', controller.getAllEmployers);
router.get('/employer/:id', controller.getEmployerById);
router.delete('/employer/:id', controller.deleteEmployerById);

// Admin job routes
router.get('/job', controller.getAllJobs);
router.get('/job/:id', controller.getJobById);
router.delete('/job/:id', controller.deleteJobById);

// Admin application routes
router.get('/application', controller.getAllApplications);
router.get('/application/:id', controller.getApplicationById);
router.delete('/application/:id', controller.deleteApplicationById);

// Admind resume routes
router.get('/resume', controller.getAllResumes);
router.get('/resume/:id', controller.getResumeById);
router.delete('/resume/:id', controller.deleteResumeById);

module.exports = router;