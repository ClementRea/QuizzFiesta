const express = require('express');
const router = express.Router();
const organisationController = require('../controllers/organisationController');
const { protect } = require('../middlewares/authMiddleware');

// POST
router.post('/create', protect, organisationController.createOrganisation);
router.post('/update/:id', organisationController.updateOrganisation);
router.post('/addMembers/:id', organisationController.addMembersToOrganisation);
router.post('/removeMembers/:id', organisationController.removeMembersFromOrganisation);

// DELETE
router.delete('/:id', organisationController.deleteOrganisation);

// GET
router.get('/', organisationController.getOrganisations);
router.get('/:id', organisationController.getOrganisationById);
router.get('/myOrganisations', organisationController.getMyOrganisations);