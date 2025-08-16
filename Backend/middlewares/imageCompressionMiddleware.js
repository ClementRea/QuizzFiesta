const sharp = require("sharp");

const path = require("path");
const fs = require("fs").promises;

// No image found => continue
const compressImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const originalPath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    if (![".jpg", ".jpeg", ".png", ".webp"].includes(fileExtension)) {
      return next();
    }

    const compressedFilename = req.file.filename.replace(
      fileExtension,
      ".webp",
    );
    const compressedPath = path.join(
      path.dirname(originalPath),
      compressedFilename,
    );

    // resize
    await sharp(originalPath)
      .resize(800, 800, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: 80,
        effort: 3,
      })
      .toFile(compressedPath);

    await fs.unlink(originalPath);

    req.file.path = compressedPath;
    req.file.filename = compressedFilename;
    req.file.mimetype = "image/webp";

    next();
  } catch (error) {
    console.error("Erreur compression image:", error);
    next();
  }
};

module.exports = { compressImage };
