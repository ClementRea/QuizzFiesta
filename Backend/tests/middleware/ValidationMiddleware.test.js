const {
  validateRegister,
  validateLogin,
  validateUpdateUser,
  validateCreateQuiz,
  validateQuizId,
} = require("../../middlewares/validationMiddleware");

const runChain = async (chain, { body = {}, params = {}, query = {} } = {}) => {
  const req = { body, params, query };
  const res = {
    statusCode: 200,
    jsonPayload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.jsonPayload = payload;
      return this;
    },
  };
  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  for (const mw of chain) {
    const maybePromise = mw(req, res, next);
    if (maybePromise && typeof maybePromise.then === "function") {
      await maybePromise;
    }
    if (res.statusCode === 400 && res.jsonPayload) break;
  }

  return { req, res, nextCalled };
};

describe("validationMiddleware", () => {
  describe("validateRegister", () => {
    it("400 si email manquant (première erreur)", async () => {
      const { res } = await runChain(validateRegister, {
        body: { password: "Abcdef12", firstName: "Jean", lastName: "Dupont" },
      });
      expect(res.statusCode).toBe(400);
      expect(res.jsonPayload).toEqual(
        expect.objectContaining({
          status: "error",
          message: "Email valide requis",
        }),
      );
    });

    it("OK si payload valide", async () => {
      const { res, nextCalled } = await runChain(validateRegister, {
        body: {
          email: "valid@example.com",
          password: "Abcdef12",
          firstName: "Jean",
          lastName: "Dupont",
        },
      });
      expect(res.statusCode).toBe(200);
      expect(nextCalled).toBe(true);
    });

    it("400 si password trop court (après email valide)", async () => {
      const { res } = await runChain(validateRegister, {
        body: {
          email: "valid@example.com",
          password: "abc",
          firstName: "Jean",
          lastName: "Dupont",
        },
      });
      expect(res.statusCode).toBe(400);
      expect(res.jsonPayload.message).toMatch(/au moins 8 caractères/);
    });
  });

  describe("validateLogin", () => {
    it("400 si password manquant", async () => {
      const { res } = await runChain(validateLogin, {
        body: { email: "test@example.com" },
      });
      expect(res.statusCode).toBe(400);
      expect(res.jsonPayload.message).toBe("Mot de passe requis");
    });

    it("400 si email invalide", async () => {
      const { res } = await runChain(validateLogin, {
        body: { email: "bad", password: "x" },
      });
      expect(res.statusCode).toBe(400);
      expect(res.jsonPayload.message).toBe("Email valide requis");
    });

    it("OK si login valide", async () => {
      const { res, nextCalled } = await runChain(validateLogin, {
        body: { email: "user@example.com", password: "secret" },
      });
      expect(res.statusCode).toBe(200);
      expect(nextCalled).toBe(true);
    });
  });

  describe("validateUpdateUser", () => {
    it("400 si firstName trop court", async () => {
      const { res } = await runChain(validateUpdateUser, {
        body: { firstName: "J" },
      });
      expect(res.statusCode).toBe(400);
      expect(res.jsonPayload.message).toMatch(/entre 2 et 50 caractères/);
    });
  });

  describe("validateCreateQuiz", () => {
    it("400 si title manquant", async () => {
      const { res } = await runChain(validateCreateQuiz, { body: {} });
      expect(res.statusCode).toBe(400);
      expect(res.jsonPayload.message).toBe("Le titre est requis");
    });

    it("OK si title présent", async () => {
      const { res, nextCalled } = await runChain(validateCreateQuiz, {
        body: { title: "Quiz" },
      });
      expect(res.statusCode).toBe(200);
      expect(nextCalled).toBe(true);
    });
  });

  describe("validateQuizId", () => {
    it("400 si id invalide", async () => {
      const { res } = await runChain(validateQuizId, { params: { id: "123" } });
      expect(res.statusCode).toBe(400);
      expect(res.jsonPayload.message).toBe("ID de quiz invalide");
    });

    it("OK si id valide", async () => {
      const { res, nextCalled } = await runChain(validateQuizId, {
        params: { id: "507f1f77bcf86cd799439011" },
      });
      expect(res.statusCode).toBe(200);
      expect(nextCalled).toBe(true);
    });
  });
});
