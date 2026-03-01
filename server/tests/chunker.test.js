const { chunkText, splitByHeadings, splitByParagraphs, estimateTokens } = require("../src/modules/knowledgebase/services/chunker");

describe("Chunker", () => {
  describe("estimateTokens", () => {
    it("should estimate token count from text", () => {
      const text = "hello world this is a test";
      const tokens = estimateTokens(text);
      expect(tokens).toBeGreaterThan(0);
      expect(typeof tokens).toBe("number");
    });
  });

  describe("splitByHeadings", () => {
    it("should split text by markdown headings", () => {
      const text = "# Introduction\nSome intro text about the topic\n\n# Methods\nSome methods text here";
      const sections = splitByHeadings(text);
      expect(sections.length).toBe(2);
      expect(sections[0].heading).toBe("Introduction");
      expect(sections[1].heading).toBe("Methods");
    });

    it("should split text by capitalized headings", () => {
      const text = "Overview\nsome overview content here about the topic\n\nEligibility Requirements\nmust be full time employee";
      const sections = splitByHeadings(text);
      expect(sections.length).toBeGreaterThanOrEqual(2);
    });

    it("should return full text as single section when no headings", () => {
      const text = "just some plain text with no headings at all";
      const sections = splitByHeadings(text);
      expect(sections.length).toBe(1);
      expect(sections[0].content).toContain("just some plain text");
    });
  });

  describe("splitByParagraphs", () => {
    it("should split text by double newlines", () => {
      const text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.";
      const paragraphs = splitByParagraphs(text);
      expect(paragraphs.length).toBe(3);
      expect(paragraphs[0]).toBe("First paragraph.");
      expect(paragraphs[2]).toBe("Third paragraph.");
    });

    it("should filter empty paragraphs", () => {
      const text = "First.\n\n\n\n\nSecond.";
      const paragraphs = splitByParagraphs(text);
      expect(paragraphs.length).toBe(2);
    });
  });

  describe("chunkText", () => {
    it("should chunk short text into a single chunk", () => {
      const text = "This is a short document that should fit in one chunk. It has enough words to pass the minimum token threshold for chunking.";
      const chunks = chunkText(text, { minTokens: 5 });
      expect(chunks.length).toBe(1);
      expect(chunks[0].text).toContain("short document");
      expect(chunks[0].index).toBe(0);
    });

    it("should preserve headings with their content", () => {
      const text = "# Policy\nThis is the policy content that is important.\n# Requirements\nThese are the requirements for eligibility.";
      const chunks = chunkText(text, { minTokens: 3 });
      const policyChunk = chunks.find((c) => c.heading === "Policy");
      expect(policyChunk).toBeDefined();
      expect(policyChunk.text).toContain("Policy");
      expect(policyChunk.text).toContain("policy content");
    });

    it("should split large text into multiple chunks", () => {
      const longText = Array(200).fill("This is a sentence with several words in it.").join("\n\n");
      const chunks = chunkText(longText, { maxTokens: 100, minTokens: 10 });
      expect(chunks.length).toBeGreaterThan(1);
    });

    it("should respect maxTokens limit", () => {
      const longText = Array(200).fill("This is a sentence with several words in it.").join("\n\n");
      const chunks = chunkText(longText, { maxTokens: 100, minTokens: 10 });
      for (const chunk of chunks) {
        expect(chunk.tokens).toBeLessThanOrEqual(130);
      }
    });

    it("should include chunk index", () => {
      const text = Array(100).fill("Some repeated content here for testing.").join("\n\n");
      const chunks = chunkText(text, { maxTokens: 100, minTokens: 5 });
      chunks.forEach((chunk, i) => {
        expect(chunk.index).toBe(i);
      });
    });

    it("should handle empty text", () => {
      const chunks = chunkText("", { minTokens: 0 });
      expect(chunks.length).toBeLessThanOrEqual(1);
    });
  });
});
