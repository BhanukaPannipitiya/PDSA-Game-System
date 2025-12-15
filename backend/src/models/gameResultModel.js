// Lightweight stub to satisfy legacy Jest tests (real storage uses SQL models in ../../models)
module.exports = {
  create: () => Promise.resolve({}),
};

