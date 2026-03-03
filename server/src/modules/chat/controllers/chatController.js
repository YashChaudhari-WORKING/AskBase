const { ask } = require("../../rag/services/pipeline");
const AppError = require("../../../common/errors/AppError");

const askQuestion = async (req, res, next) => {
  try {
    const { question, documentId, topK } = req.body;

    if (!question || !question.trim()) {
      throw new AppError("'question' is required", 400);
    }

    const result = await ask(question, {
      documentId: documentId || null,
      topK: topK ? parseInt(topK) : 3,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { askQuestion };
