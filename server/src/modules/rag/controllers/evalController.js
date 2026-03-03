const { evaluate } = require("../services/evaluator");
const AppError = require("../../../common/errors/AppError");

const runEvaluation = async (req, res, next) => {
  try {
    const { testCases, documentId } = req.body;

    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
      throw new AppError("'testCases' array is required with at least one test case", 400);
    }

    for (const tc of testCases) {
      if (!tc.question) {
        throw new AppError("Each test case must have a 'question' field", 400);
      }
    }

    const result = await evaluate(testCases, { documentId: documentId || null });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { runEvaluation };
