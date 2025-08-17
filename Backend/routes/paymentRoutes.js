const express = require("express");

const router = express.Router();
const paymentController = require("../controllers/PaymentController");

router.post(
  "/create-checkout-session",
  paymentController.createCheckoutSession,
);
router.get("/predefined-amounts", paymentController.getPredefinedAmounts);
router.post("/webhook", paymentController.handleWebhook);

module.exports = router;
