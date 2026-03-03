const { buildContext } = require("../src/modules/rag/services/contextBuilder");

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
});
