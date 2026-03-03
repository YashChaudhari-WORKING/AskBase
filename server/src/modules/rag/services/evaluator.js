const { ask } = require("./pipeline");
const logger = require("../../../common/utils/logger");

const evaluate = async (testCases, options = {}) => {
  const { documentId = null } = options;
  const results = [];

  logger.info("Evaluation started", { totalCases: testCases.length });

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const startTime = Date.now();

    try {
      logger.info("Running test case", { index: i + 1, question: testCase.question });

      const response = await ask(testCase.question, { documentId, topK: 3 });

      const latencyMs = Date.now() - startTime;

      // check if expected answer keywords appear in the response
      let keywordHits = 0;
      const expectedKeywords = testCase.expectedKeywords || [];
      const answerLower = response.answer.toLowerCase();

      for (const keyword of expectedKeywords) {
        if (answerLower.includes(keyword.toLowerCase())) {
          keywordHits++;
        }
      }

      const keywordScore = expectedKeywords.length > 0
        ? keywordHits / expectedKeywords.length
        : null;

      results.push({
        question: testCase.question,
        answer: response.answer,
        validation: response.validation,
        keywordScore,
        keywordHits: `${keywordHits}/${expectedKeywords.length}`,
        sourcesUsed: response.sources.length,
        latencyMs,
        passed: response.validation.grounded !== false && (keywordScore === null || keywordScore >= 0.5),
      });
    } catch (error) {
      results.push({
        question: testCase.question,
        answer: null,
        error: error.message,
        latencyMs: Date.now() - startTime,
        passed: false,
      });
    }

    // delay between test cases to respect rate limits
    if (i < testCases.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // compute summary
  const passed = results.filter((r) => r.passed).length;
  const avgLatency = Math.round(results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length);
  const avgConfidence = results
    .filter((r) => r.validation?.confidence != null)
    .reduce((sum, r) => sum + r.validation.confidence, 0) / (results.filter((r) => r.validation?.confidence != null).length || 1);

  const summary = {
    total: testCases.length,
    passed,
    failed: testCases.length - passed,
    passRate: parseFloat((passed / testCases.length).toFixed(2)),
    avgLatencyMs: avgLatency,
    avgConfidence: parseFloat(avgConfidence.toFixed(2)),
  };

  logger.info("Evaluation complete", summary);

  return { summary, results };
};

module.exports = { evaluate };
