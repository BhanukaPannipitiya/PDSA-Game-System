// Lightweight stub to satisfy legacy Jest tests (real storage uses SQL models in ../../models)
module.exports = {
  countDocuments: () => Promise.resolve(0),
  findOne: () => Promise.resolve(null),
  estimatedDocumentCount: () => Promise.resolve(0),
  updateMany: () => Promise.resolve(),
  find: () => ({ limit: () => ({ select: () => ({ lean: () => Promise.resolve([]) }) }) }),
  bulkWrite: () => Promise.resolve(),
  create: () => Promise.resolve({}),
};

