// Transformers.js requires an image library at load time, and npm installs run
// with --omit=optional, which drops sharp's native binary. Speech never
// decodes images, so this placeholder satisfies the import and fails loudly
// if anything ever tries to use it.
module.exports = function sharp() {
  throw new Error("Image processing is unavailable in Read Aloud.");
};
