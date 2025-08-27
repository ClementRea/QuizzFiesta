const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const jwt = require("jsonwebtoken");

const Payment = require("../models/Payment");

const YOUR_DOMAIN = process.env.FRONTEND_URL || "http://localhost:9000";

const PREDEFINED_AMOUNTS = [
  { amount: 100, label: "1€" },
  { amount: 500, label: "5€" },
  { amount: 1000, label: "10€" },
  { amount: 2000, label: "20€" },
  { amount: 5000, label: "50€" },
];

exports.createCheckoutSession = async (req, res) => {
  try {
    const { amount } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token d'authentification requis" });
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (error) {
      return res.status(401).json({ error: "Token invalide" });
    }

    if (
      !amount ||
      !PREDEFINED_AMOUNTS.some((predefined) => predefined.amount === amount)
    ) {
      return res.status(400).json({ error: "Montant invalide" });
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Don pour QuizzFiesta",
              description: "Merci pour votre soutien !",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${YOUR_DOMAIN}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/payment/cancel`,
      metadata: {
        userId: userId.toString(),
      },
    });

    const payment = new Payment({
      userId,
      amount: amount / 100,
      currency: "eur",
      stripeSessionId: session.id,
      status: "pending",
    });

    await payment.save();

    res.json({ url: session.url });
  } catch (error) {
    console.error("Error in createCheckoutSession:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Erreur verification webhook:", err.message);
    return res
      .status(400)
      .send(`Webhook signature verification failed: ${err.message}`);
  }

  switch (event.type) {
    // session OK
    case "checkout.session.completed":
      const session = event.data.object;
      const userId = session?.metadata?.userId;

      try {
        if (userId) {
          const payment = await Payment.findOneAndUpdate(
            {
              stripeSessionId: session.id,
              userId: userId,
              status: "pending",
            },
            {
              status: "completed",
              stripePaymentIntentId: session.payment_intent,
              updatedAt: new Date(),
            },
          );
          if (!payment) {
            return;
          }
        } else {
          console.error(
            "checkout.session.completed sans metadata.userId – paiement ignoré",
          );
        }
      } catch (error) {
        console.error("Erreur mise à jour paiement:", error);
      }
      break;

    //Session expired
    case "checkout.session.expired":
      const expiredSession = event.data.object;
      await Payment.findOneAndUpdate(
        { stripeSessionId: expiredSession.id },
        {
          status: "canceled",
          updatedAt: new Date(),
        },
      );
      break;

    // Async payment succeeded
    case "checkout.session.async_payment_succeeded":
      const asyncSuccessSession = event.data.object;
      const asyncUserId = asyncSuccessSession?.metadata?.userId;

      try {
        if (asyncUserId) {
          await Payment.findOneAndUpdate(
            {
              stripeSessionId: asyncSuccessSession.id,
              userId: asyncUserId,
              status: "pending",
            },
            {
              status: "completed",
              stripePaymentIntentId: asyncSuccessSession.payment_intent,
              updatedAt: new Date(),
            },
          );
        }
      } catch (error) {
        console.error("Erreur async payment succeeded:", error);
      }
      break;

    // Async payment failed
    case "checkout.session.async_payment_failed":
      const asyncFailedSession = event.data.object;
      await Payment.findOneAndUpdate(
        { stripeSessionId: asyncFailedSession.id },
        {
          status: "failed",
          updatedAt: new Date(),
        },
      );
      break;

    // Payment fail
    case "payment_intent.payment_failed":
      const failedPayment = event.data.object;
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: failedPayment.id },
        {
          status: "failed",
          updatedAt: new Date(),
        },
      );
      break;
  }

  res.json({ received: true });
};

exports.getPredefinedAmounts = (req, res) => {
  res.json(PREDEFINED_AMOUNTS);
};
