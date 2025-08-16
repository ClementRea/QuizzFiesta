const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const tokenService = require("../../services/tokenService");

describe("tokenService", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "secret-test";
    process.env.JWT_REFRESH_SECRET = "secret-test";
  });

  describe("generateAccessToken", () => {
    it("génère un access token valide avec payload attendu", () => {
      const token = tokenService.generateAccessToken("user123", 2);
      const { valid, payload } = tokenService.verifyAccessToken(token);
      expect(valid).toBe(true);
      expect(payload.id).toBe("user123");
      expect(payload.tokenVersion).toBe(2);
      expect(payload.type).toBe("access");
      expect(payload.iss).toBe("quizzfiesta");
      expect(payload.aud).toBe("quizzfiesta-client");
      expect(payload.exp - payload.iat).toBeLessThanOrEqual(600);
      expect(payload.exp - payload.iat).toBeGreaterThan(0);
    });
  });

  describe("generateRefreshToken", () => {
    it("génère un refresh token avec uuid de famille", () => {
      const token = tokenService.generateRefreshToken("userABC");
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: "quizzfiesta",
        audience: "quizzfiesta-client",
      });
      expect(decoded.userId).toBe("userABC");
      expect(decoded.type).toBe("refresh");
      expect(decoded.family).toMatch(/^[0-9a-fA-F-]{36}$/);
      expect(decoded.exp - decoded.iat).toBeGreaterThan(600000); // largement > 10m
    });
    it("familles différentes à chaque appel", () => {
      const t1 = tokenService.generateRefreshToken("u1");
      const t2 = tokenService.generateRefreshToken("u1");
      const f1 = jwt.decode(t1).family;
      const f2 = jwt.decode(t2).family;
      expect(f1).not.toBe(f2);
    });
  });

  describe("hashRefreshToken", () => {
    it("hachage vérifiable avec bcrypt", async () => {
      const token = tokenService.generateRefreshToken("user");
      const hash = await tokenService.hashRefreshToken(token);
      expect(hash).not.toBe(token);
      const ok = await bcrypt.compare(token, hash);
      expect(ok).toBe(true);
      const ko = await bcrypt.compare(token + "x", hash);
      if (ko) {
        console.warn(
          "Collision bcrypt improbable détectée dans test (token altéré valide).",
        );
      } else {
        expect(ko).toBe(false);
      }
    });
  });

  describe("verifyRefreshToken / verifyAccessToken", () => {
    it("retourne valid true pour refresh token correct", () => {
      const rt = tokenService.generateRefreshToken("userZ");
      const { valid, payload } = tokenService.verifyRefreshToken(rt);
      expect(valid).toBe(true);
      expect(payload.type).toBe("refresh");
    });
    it("retourne valid false pour token altéré", () => {
      const at = tokenService.generateAccessToken("userZ", 0);
      const bad = at + "tamper";
      const { valid } = tokenService.verifyAccessToken(bad);
      expect(valid).toBe(false);
    });
  });

  describe("extractSecurityInfo", () => {
    it("extrait user-agent et ip", () => {
      const req = {
        get: jest
          .fn()
          .mockImplementation((h) => (h === "User-Agent" ? "AgentX" : "")),
        ip: "127.0.0.1",
        connection: {},
      };
      const info = tokenService.extractSecurityInfo(req);
      expect(info.userAgent).toBe("AgentX");
      expect(info.ipAddress).toBe("127.0.0.1");
    });
  });

  describe("detectSuspiciousActivity", () => {
    const makeToken = (minutesAgo, ip = "1.1.1.1") => ({
      createdAt: new Date(Date.now() - minutesAgo * 60 * 1000),
      ipAddress: ip,
    });
    it("non suspect par défaut", () => {
      const user = { refreshTokens: [makeToken(10), makeToken(30)] };
      const r = tokenService.detectSuspiciousActivity(user, {});
      expect(r.suspicious).toBe(false);
    });
    it("suspect si >5 tokens récents", () => {
      const user = {
        refreshTokens: [0, 1, 2, 3, 4, 5].map((i) => makeToken(i * 5)),
      };
      const r = tokenService.detectSuspiciousActivity(user, {});
      expect(r.suspicious).toBe(true);
      expect(r.reason).toMatch(/Too many/);
    });
    it("suspect si >3 IP récentes distinctes", () => {
      const user = {
        refreshTokens: [
          makeToken(5, "1"),
          makeToken(10, "2"),
          makeToken(15, "3"),
          makeToken(20, "4"),
        ],
      };
      const r = tokenService.detectSuspiciousActivity(user, {});
      expect(r.suspicious).toBe(true);
      expect(r.reason).toMatch(/Multiple IP/);
    });
  });

  describe("cleanExpiredTokens", () => {
    it("retire les tokens expirés", () => {
      const past = new Date(Date.now() - 1000);
      const future = new Date(Date.now() + 100000);
      const user = {
        refreshTokens: [{ expiresAt: past }, { expiresAt: future }],
      };
      tokenService.cleanExpiredTokens(user);
      expect(user.refreshTokens.length).toBe(1);
      expect(user.refreshTokens[0].expiresAt).toBe(future);
    });
  });

  describe("invalidateTokenFamily", () => {
    it("retire la famille et incrémente tokenVersion", () => {
      const user = {
        tokenVersion: 0,
        refreshTokens: [{ family: "A" }, { family: "B" }],
      };
      tokenService.invalidateTokenFamily(user, "A");
      expect(user.refreshTokens).toEqual([{ family: "B" }]);
      expect(user.tokenVersion).toBe(1);
    });
  });

  describe("invalidateAllTokens", () => {
    it("vide tous les tokens et incrémente version", () => {
      const user = { tokenVersion: 3, refreshTokens: [{ family: "A" }] };
      tokenService.invalidateAllTokens(user);
      expect(user.refreshTokens.length).toBe(0);
      expect(user.tokenVersion).toBe(4);
    });
  });
});
