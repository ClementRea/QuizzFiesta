const jwt = require("jsonwebtoken");
const Payment = require("../../models/Payment");

const mockCreateSession = jest.fn();
const mockConstructEvent = jest.fn();
jest.mock("stripe", () => {
  return () => ({
    checkout: { sessions: { create: mockCreateSession } },
    webhooks: { constructEvent: mockConstructEvent },
  });
});

const paymentController = require("../../controllers/PaymentController");
const User = require("../../models/User");

describe("PaymentController", () => {
  let user;
  let token;
  let res;

  beforeAll(() => {
    process.env.STRIPE_SECRET_KEY =
      process.env.STRIPE_SECRET_KEY || "sk_test_123";
    process.env.STRIPE_WEBHOOK_SECRET =
      process.env.STRIPE_WEBHOOK_SECRET || "whsec_test";
    process.env.FRONTEND_URL = "http://localhost:9000";
  });

  beforeEach(async () => {
    mockCreateSession.mockReset();
    mockConstructEvent.mockReset();
    await User.deleteMany({});
    await Payment.deleteMany({});
    user = await User.create({
      email: "payer@example.com",
      userName: "payer",
      password: "password123",
    });
    token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET);
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe("createCheckoutSession", () => {
    it("401 si token manquant", async () => {
      const req = { body: { amount: 500 }, headers: {} };
      await paymentController.createCheckoutSession(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringMatching(/Token d'authentification requis/),
        }),
      );
    });

    it("401 si token invalide", async () => {
      const req = {
        body: { amount: 500 },
        headers: { authorization: "Bearer badtoken" },
      };
      await paymentController.createCheckoutSession(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Token invalide" }),
      );
    });

    it("400 si montant invalide", async () => {
      const req = {
        body: { amount: 123 },
        headers: { authorization: `Bearer ${token}` },
      };
      await paymentController.createCheckoutSession(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Montant invalide" }),
      );
    });

    it("crée une session et enregistre Payment (status pending)", async () => {
      mockCreateSession.mockResolvedValue({
        id: "cs_test_123",
        url: "https://stripe.test/session/cs_test_123",
      });
      const req = {
        body: { amount: 500 },
        headers: { authorization: `Bearer ${token}` },
      };
      await paymentController.createCheckoutSession(req, res);
      expect(mockCreateSession).toHaveBeenCalledWith(
        expect.objectContaining({ mode: "payment" }),
      );
      expect(res.json).toHaveBeenCalledWith({
        url: "https://stripe.test/session/cs_test_123",
      });
      const saved = await Payment.findOne({ stripeSessionId: "cs_test_123" });
      expect(saved).toBeTruthy();
      expect(saved.amount).toBe(5);
      expect(saved.status).toBe("pending");
    });
  });

  describe("handleWebhook", () => {
    it("400 si signature invalide", async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error("invalid signature");
      });
      const req = { headers: { "stripe-signature": "bad" }, body: {} };
      await paymentController.handleWebhook(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.stringContaining("Webhook signature verification failed"),
      );
    });

    it("met à jour le paiement sur checkout.session.completed", async () => {
      const payment = await Payment.create({
        userId: user._id,
        amount: 5,
        currency: "eur",
        stripeSessionId: "cs_done",
        status: "pending",
      });
      mockConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: { id: "cs_done", payment_intent: "pi_123" } },
      });
      const req = { headers: { "stripe-signature": "sig" }, body: {} };
      await paymentController.handleWebhook(req, res);
      expect(mockConstructEvent).toHaveBeenCalled();
      const updated = await Payment.findById(payment._id);
      expect(updated.status).toBe("completed");
      expect(updated.stripePaymentIntentId).toBe("pi_123");
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    it("ignores autres events", async () => {
      const payment = await Payment.create({
        userId: user._id,
        amount: 5,
        currency: "eur",
        stripeSessionId: "cs_other",
        status: "pending",
      });
      mockConstructEvent.mockReturnValue({
        type: "payment_intent.succeeded",
        data: { object: {} },
      });
      const req = { headers: { "stripe-signature": "sig" }, body: {} };
      await paymentController.handleWebhook(req, res);
      const unchanged = await Payment.findById(payment._id);
      expect(unchanged.status).toBe("pending");
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });
  });

  describe("getPredefinedAmounts", () => {
    it("retourne la liste des montants prédéfinis", () => {
      const req = {};
      paymentController.getPredefinedAmounts(req, res);
      expect(res.json).toHaveBeenCalled();
      const arr = res.json.mock.calls[0][0];
      expect(Array.isArray(arr)).toBe(true);
      expect(arr).toHaveLength(5);
      expect(arr.map((a) => a.amount)).toEqual(
        expect.arrayContaining([100, 500, 1000, 2000, 5000]),
      );
    });
  });
});
