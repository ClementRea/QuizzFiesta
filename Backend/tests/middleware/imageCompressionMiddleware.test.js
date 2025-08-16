const path = require("path");
const fs = require("fs");
jest.mock("sharp", () => {
  const factory = jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue(),
  }));
  return factory;
});

const sharp = require("sharp");
const {
  compressImage,
} = require("../../middlewares/imageCompressionMiddleware");

describe("imageCompressionMiddleware", () => {
  let unlinkSpy;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    unlinkSpy = jest.spyOn(fs.promises, "unlink").mockResolvedValue();
    next = jest.fn();
  });

  afterEach(() => {
    unlinkSpy.mockRestore();
  });

  function buildReqFile({
    name = "photo.jpg",
    dir = "/tmp",
    mimetype = "image/jpeg",
  } = {}) {
    const filename = name;
    const filePath = path.join(dir, filename);
    return {
      file: {
        path: filePath,
        originalname: name,
        filename,
        mimetype,
      },
    };
  }

  it("passe si aucun fichier", async () => {
    const req = {};
    await compressImage(req, {}, next);
    expect(next).toHaveBeenCalled();
    expect(sharp).not.toHaveBeenCalled();
  });

  it("ignore extension non supportée (.gif)", async () => {
    const req = buildReqFile({ name: "anim.gif", mimetype: "image/gif" });
    await compressImage(req, {}, next);
    expect(next).toHaveBeenCalled();
    expect(sharp).not.toHaveBeenCalled();
    expect(req.file.filename).toBe("anim.gif");
  });

  it("compresse un jpg en webp", async () => {
    const req = buildReqFile({ name: "image.jpg" });
    await compressImage(req, {}, next);
    expect(next).toHaveBeenCalled();
    expect(sharp).toHaveBeenCalledWith(req.file.path.replace(".webp", ".jpg")); // original path avant mutation
    const instance = sharp.mock.results[0].value;
    const expectedCompressed = path.join(
      path.dirname(req.file.path),
      "image.webp",
    );
    expect(instance.toFile).toHaveBeenCalledWith(expectedCompressed);
    expect(unlinkSpy).toHaveBeenCalledWith(
      expectedCompressed.replace(".webp", ".jpg"),
    );
    expect(req.file.filename).toBe("image.webp");
    expect(req.file.mimetype).toBe("image/webp");
  });

  it("garde extension correcte pour un fichier déjà webp", async () => {
    const req = buildReqFile({ name: "photo.webp", mimetype: "image/webp" });
    await compressImage(req, {}, next);
    expect(next).toHaveBeenCalled();
    expect(req.file.filename).toBe("photo.webp");
    expect(req.file.path.endsWith("photo.webp")).toBe(true);
  });

  it("continue silencieusement en cas derreur sharp", async () => {
    sharp.mockImplementationOnce(() => ({
      resize: jest.fn().mockReturnThis(),
      webp: jest.fn().mockReturnThis(),
      toFile: jest.fn().mockRejectedValue(new Error("boom")),
    }));
    const req = buildReqFile({ name: "bad.jpg" });
    await compressImage(req, {}, next);
    expect(next).toHaveBeenCalled();
    expect(unlinkSpy).not.toHaveBeenCalled();
    expect(req.file.filename).toBe("bad.jpg");
  });
});
