const express = require("express");

const router = express.Router();
const organisationController = require("../controllers/organisationController");
const { protect } = require("../middlewares/authMiddleware");
const {
  validateCreateOrganisation,
  validateUpdateOrganisation,
  validateUserId,
} = require("../middlewares/validationMiddleware");

// POST
router.post("/create", protect, validateCreateOrganisation, organisationController.createOrganisation);

// PUT
router.put("/update/:id", protect, validateUserId, validateUpdateOrganisation, organisationController.updateOrganisation);
router.put(
  "/members/add/:id",
  protect,
  validateUserId,
  organisationController.addMembersToOrganisation,
);
router.put(
  "/members/remove/:id",
  protect,
  validateUserId,
  organisationController.removeMembersFromOrganisation,
);

// DELETE
router.delete("/:id", protect, validateUserId, organisationController.deleteOrganisation);

// GET
router.get("/", organisationController.getOrganisations);
router.get(
  "/myOrganisations",
  protect,
  organisationController.getMyOrganisations,
);
router.get("/:id", validateUserId, organisationController.getOrganisationById);

module.exports = router;
