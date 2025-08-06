const express = require('express');
const router = express.Router();
const organisationController = require('../controllers/organisationController');
const { protect } = require('../middlewares/authMiddleware');

// POST
router.post('/create', organisationController.createOrganisation);

// PUT
router.put('/update/:id', organisationController.updateOrganisation);
router.put('/members/add/:id', organisationController.addMembersToOrganisation);
router.put('/members/remove/:id', organisationController.removeMembersFromOrganisation);

// DELETE
router.delete('/:id', organisationController.deleteOrganisation);

// GET
router.get('/', organisationController.getOrganisations);
router.get('/myOrganisations', organisationController.getMyOrganisations);
router.get('/:id', organisationController.getOrganisationById);

module.exports = router;