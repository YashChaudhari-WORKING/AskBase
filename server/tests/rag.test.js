const { buildContext } = require("../src/modules/rag/services/contextBuilder");

jest.mock("../src/config/env", () => ({
  groqChatApiKey: "test-key",
}));
const { validate } = require("../src/modules/rag/services/validator");

global.fetch = jest.fn();

describe("RAG Services", () => {
  describe("contextBuilder", () => {
    it("should build context from chunks with source labels", () => {
      const chunks = [
        {
          text: "Bitcoin uses proof-of-work.",
          heading: "Introduction",
          documentId: "doc1",
          index: 0,
          relevanceScore: 0.95,
        },
        {
          text: "Mining secures the network.",
          heading: "Mining",
          documentId: "doc1",
          index: 2,
          relevanceScore: 0.88,
        },
      ];

      const { context, sources } = buildContext(chunks);

      expect(sources).toHaveLength(2);
      expect(sources[0].label).toBe("Introduction");
      expect(sources[0].id).toBe(1);
      expect(sources[1].label).toBe("Mining");
      expect(context).toContain("[Source 1 - Introduction]");
      expect(context).toContain("[Source 2 - Mining]");
      expect(context).toContain("Bitcoin uses proof-of-work.");
    });

    it("should use fallback label when heading is empty", () => {
      const chunks = [
        {
          text: "Some content here.",
          heading: "",
          documentId: "doc1",
          index: 3,
          relevanceScore: 0.9,
        },
      ];

      const { sources } = buildContext(chunks);
      expect(sources[0].label).toBe("Section 4");
    });

    it("should return empty context for no chunks", () => {
      const { context, sources } = buildContext([]);
      expect(context).toBe("");
      expect(sources).toHaveLength(0);
    });

    it("should separate chunks with dividers", () => {
      const chunks = [
        { text: "Chunk A", heading: "A", documentId: "d1", index: 0, relevanceScore: 1 },
        { text: "Chunk B", heading: "B", documentId: "d1", index: 1, relevanceScore: 0.9 },
      ];

      const { context } = buildContext(chunks);
      expect(context).toContain("---");
    });
  });

  describe("validator", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    const mockGroqResponse = (content) => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(content) } }],
      }),
    });

    it("should return validation result for grounded answer", async () => {
      global.fetch.mockResolvedValueOnce(
        mockGroqResponse({
          grounded: true,
          relevance: "high",
          confidence: 0.95,
          flaggedClaims: [],
        })
      );

      const result = await validate("What is Bitcoin?", "Bitcoin is a peer-to-peer cash system.", "Bitcoin is a peer-to-peer electronic cash system.");

      expect(result.grounded).toBe(true);
      expect(result.relevance).toBe("high");
      expect(result.confidence).toBe(0.95);
      expect(result.flaggedClaims).toHaveLength(0);
    });

    it("should flag hallucinated claims", async () => {
      global.fetch.mockResolvedValueOnce(
        mockGroqResponse({
          grounded: false,
          relevance: "medium",
          confidence: 0.3,
          flaggedClaims: ["Bitcoin uses 4MB blocks"],
        })
      );

      const result = await validate("What is block size?", "Bitcoin uses 4MB blocks.", "Bitcoin uses 1MB blocks.");

      expect(result.grounded).toBe(false);
      expect(result.flaggedClaims).toContain("Bitcoin uses 4MB blocks");
    });

    it("should return defaults on API failure", async () => {
      global.fetch.mockRejectedValueOnce(new Error("network error"));

      const result = await validate("question", "answer", "context");

      expect(result.grounded).toBeNull();
      expect(result.flaggedClaims).toHaveLength(0);
    });

    it("should clamp confidence between 0 and 1", async () => {
      global.fetch.mockResolvedValueOnce(
        mockGroqResponse({
          grounded: true,
          relevance: "high",
          confidence: 1.5,
          flaggedClaims: [],
        })
      );

      const result = await validate("q", "a", "c");
      expect(result.confidence).toBe(1);
    });
  });
});
