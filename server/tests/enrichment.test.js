jest.mock("../src/config/env", () => ({
  groqEnrichApiKey: "test-key",
}));

const { enrichChunk, enrichBatch, callGroq } = require("../src/modules/knowledgebase/services/enrichment");

// mock fetch globally
global.fetch = jest.fn();

describe("Enrichment Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockGroqResponse = (content) => ({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
  });

  describe("callGroq", () => {
    it("should call Groq API and return parsed JSON", async () => {
      const expected = { keywords: ["test"], summary: "A test" };
      global.fetch.mockResolvedValueOnce(mockGroqResponse(expected));

      const result = await callGroq("system prompt", "user text");

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expected);
    });

    it("should throw on API error", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        text: async () => "rate limit exceeded",
      });

      await expect(callGroq("prompt", "text")).rejects.toThrow("Groq API error");
    });
  });

  describe("enrichChunk", () => {
    it("should return keywords, summary, and hypotheticalQuestions", async () => {
      global.fetch.mockResolvedValueOnce(
        mockGroqResponse({
          keywords: ["javascript", "node", "express"],
          summary: "A chunk about backend development",
          hypotheticalQuestions: ["What is Express?", "How does Node work?"],
        })
      );

      const result = await enrichChunk("Some text about javascript backend development with node and express");

      expect(result.keywords).toEqual(["javascript", "node", "express"]);
      expect(result.summary).toBe("A chunk about backend development");
      expect(result.hypotheticalQuestions).toHaveLength(2);
    });

    it("should cap keywords at 7 and questions at 4", async () => {
      global.fetch.mockResolvedValueOnce(
        mockGroqResponse({
          keywords: ["a", "b", "c", "d", "e", "f", "g", "h", "i"],
          summary: "test",
          hypotheticalQuestions: ["q1", "q2", "q3", "q4", "q5", "q6"],
        })
      );

      const result = await enrichChunk("some text");
      expect(result.keywords).toHaveLength(7);
      expect(result.hypotheticalQuestions).toHaveLength(4);
    });

    it("should return empty defaults on API failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("network error"));

      const result = await enrichChunk("some text");

      expect(result.keywords).toEqual([]);
      expect(result.summary).toBe("");
      expect(result.hypotheticalQuestions).toEqual([]);
    });

    it("should handle malformed Groq response gracefully", async () => {
      global.fetch.mockResolvedValueOnce(
        mockGroqResponse({
          keywords: "not an array",
          summary: 123,
          hypotheticalQuestions: null,
        })
      );

      const result = await enrichChunk("some text");

      expect(result.keywords).toEqual([]);
      expect(result.summary).toBe("");
      expect(result.hypotheticalQuestions).toEqual([]);
    });
  });

  describe("enrichBatch", () => {
    it("should enrich multiple chunks sequentially", async () => {
      const chunks = [
        { text: "chunk one about AI" },
        { text: "chunk two about databases" },
      ];

      chunks.forEach((_, i) => {
        global.fetch.mockResolvedValueOnce(
          mockGroqResponse({
            keywords: [`keyword${i}`],
            summary: `summary ${i}`,
            hypotheticalQuestions: [`question ${i}`],
          })
        );
      });

      const results = await enrichBatch(chunks);

      expect(results).toHaveLength(2);
      expect(results[0].keywords).toEqual(["keyword0"]);
      expect(results[1].summary).toBe("summary 1");
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
