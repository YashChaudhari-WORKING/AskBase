const { hybridSearch } = require("../services/retrieval");
const AppError = require("../../../common/errors/AppError");

const search = async (req, res, next) => {
  try {
    const { q, documentId, topK, vectorWeight, keywordWeight } = req.query;

    if (!q || !q.trim()) {
      throw new AppError("Query parameter 'q' is required", 400);
    }

    const results = await hybridSearch(q, {
      documentId: documentId || null,
      topK: topK ? parseInt(topK) : 5,
      vectorWeight: vectorWeight ? parseFloat(vectorWeight) : 0.7,
      keywordWeight: keywordWeight ? parseFloat(keywordWeight) : 0.3,
    });

    res.json({
      success: true,
      data: {
        query: q,
        count: results.length,
        results,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { search };
