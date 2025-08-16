const express = require("express");

const router = express.Router();
const organisationController = require("../controllers/organisationController");
const { protect } = require("../middlewares/authMiddleware");

// POST
router.post("/create", protect, organisationController.createOrganisation);

// PUT
router.put("/update/:id", protect, organisationController.updateOrganisation);
router.put(
  "/members/add/:id",
  protect,
  organisationController.addMembersToOrganisation,
);
router.put(
  "/members/remove/:id",
  protect,
  organisationController.removeMembersFromOrganisation,
);

// DELETE
router.delete("/:id", protect, organisationController.deleteOrganisation);

// GET
router.get("/", organisationController.getOrganisations);
router.get(
  "/myOrganisations",
  protect,
  organisationController.getMyOrganisations,
);
router.get("/:id", organisationController.getOrganisationById);

module.exports = router;
