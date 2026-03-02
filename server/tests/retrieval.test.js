const { cosineSimilarity } = require("../src/modules/knowledgebase/services/retrieval");

describe("Retrieval Service", () => {
  describe("cosineSimilarity", () => {
    it("should return 1 for identical vectors", () => {
      const a = [1, 2, 3];
      const score = cosineSimilarity(a, a);
      expect(score).toBeCloseTo(1, 5);
    });

    it("should return 0 for orthogonal vectors", () => {
      const a = [1, 0, 0];
      const b = [0, 1, 0];
      const score = cosineSimilarity(a, b);
      expect(score).toBeCloseTo(0, 5);
    });

    it("should return -1 for opposite vectors", () => {
      const a = [1, 0, 0];
      const b = [-1, 0, 0];
      const score = cosineSimilarity(a, b);
      expect(score).toBeCloseTo(-1, 5);
    });

    it("should return high similarity for similar vectors", () => {
      const a = [1, 2, 3, 4, 5];
      const b = [1.1, 2.1, 3.1, 4.1, 5.1];
      const score = cosineSimilarity(a, b);
      expect(score).toBeGreaterThan(0.99);
    });

    it("should return lower similarity for different vectors", () => {
      const a = [1, 0, 0, 0, 0];
      const b = [0, 0, 0, 0, 1];
      const score = cosineSimilarity(a, b);
      expect(score).toBeCloseTo(0, 5);
    });
  });
});
