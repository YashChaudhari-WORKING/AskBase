const path = require("path");
const { parseDocument, normalize, removeNoise, SUPPORTED_TYPES } = require("../src/modules/documents/services/parser");

const FIXTURES_DIR = path.join(__dirname, "fixtures");

describe("Document Parser", () => {
  describe("SUPPORTED_TYPES", () => {
    it("should support txt, pdf, and docx", () => {
      expect(SUPPORTED_TYPES[".txt"]).toBe("text");
      expect(SUPPORTED_TYPES[".pdf"]).toBe("pdf");
      expect(SUPPORTED_TYPES[".docx"]).toBe("docx");
    });
  });

  describe("removeNoise", () => {
    it("should remove page numbers", () => {
      const result = removeNoise("Hello world\nPage 3 of 10\nMore text");
      expect(result).not.toMatch(/page\s*\d+/i);
    });

    it("should remove standalone numbers", () => {
      const result = removeNoise("Hello\n42\nWorld");
      expect(result).not.toMatch(/^\d+$/m);
    });

    it("should remove 'all rights reserved'", () => {
      const result = removeNoise("Content here. All Rights Reserved.");
      expect(result).not.toMatch(/all rights reserved/i);
    });

    it("should remove 'confidential'", () => {
      const result = removeNoise("Confidential. This is a policy.");
      expect(result).not.toMatch(/confidential/i);
    });
  });

  describe("normalize", () => {
    it("should rejoin hyphenated words", () => {
      const result = normalize("pro-\nduction");
      expect(result).toBe("production");
    });

    it("should collapse multiple blank lines into single separation", () => {
      const result = normalize("Hello\n\n\n\n\nWorld");
      expect(result).toBe("Hello\nWorld");
    });

    it("should trim each line", () => {
      const result = normalize("  Hello  \n  World  ");
      expect(result).toBe("Hello\nWorld");
    });

    it("should remove empty lines", () => {
      const result = normalize("Hello\n   \n   \nWorld");
      expect(result).toBe("Hello\nWorld");
    });
  });

  describe("parseDocument", () => {
    it("should parse a txt file and clean noise", async () => {
      const filePath = path.join(FIXTURES_DIR, "sample.txt");
      const result = await parseDocument(filePath);

      expect(result.content).toBeDefined();
      expect(result.content).toContain("Parental Leave Policy");
      expect(result.content).toContain("California");
      expect(result.content).not.toMatch(/page\s*\d+/i);
      expect(result.content).not.toMatch(/all rights reserved/i);

      expect(result.metadata.source).toBe("sample.txt");
      expect(result.metadata.type).toBe("text");
      expect(result.metadata.parsedAt).toBeDefined();
    });

    it("should throw error for unsupported file type", async () => {
      await expect(parseDocument("file.xyz")).rejects.toThrow("Unsupported file type");
    });
  });
});