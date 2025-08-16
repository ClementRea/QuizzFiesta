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
    console.log("Request body:", req.body);
    console.log("Headers:", req.headers.authorization);

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
        amount: amount.toString(),
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
    return res
      .status(400)
      .send(`Webhook signature verification failed: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      const payment = await Payment.findOne({ stripeSessionId: session.id });
      if (payment) {
        payment.status = "completed";
        payment.stripePaymentIntentId = session.payment_intent;
        payment.updatedAt = new Date();
        await payment.save();
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du paiement:", error);
    }
  }

  res.json({ received: true });
};

exports.getPredefinedAmounts = (req, res) => {
  res.json(PREDEFINED_AMOUNTS);
};
