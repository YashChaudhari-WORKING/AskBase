const fs = require("fs/promises");
const path = require("path");
const mammoth = require("mammoth");
const he = require("he");
const AppError = require("../../../common/errors/AppError");
const logger = require("../../../common/utils/logger");

const SUPPORTED_TYPES = {
  ".txt": "text",
  ".pdf": "pdf",
  ".docx": "docx",
};

const parseTxt = async (filePath) => {
  const content = await fs.readFile(filePath, "utf-8");
  return content;
};

const parseDocx = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  const result = await mammoth.convertToHtml({ buffer });

  if (result.messages.length > 0) {
    logger.warn("Docx parsing warnings", { warnings: result.messages });
  }

  const decoded = he.decode(result.value);
  const cleaned = decoded.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return cleaned;
};

const parsePdf = async (filePath) => {
  const { LlamaParseReader } = await import("llamaindex");
  const { llamaParseApiKey } = require("../../../config/env");

  if (!llamaParseApiKey) {
    throw new AppError("LLAMAPARSE_API_KEY is not configured", 500);
  }

  const reader = new LlamaParseReader({
    apiKey: llamaParseApiKey,
    resultType: "markdown",
  });

  const documents = await reader.loadData(filePath);
  const content = documents.map((doc) => doc.text).join("\n\n");
  return content;
};

const normalize = (text) => {
  return text
    .replace(/(\w)-\n(\w)/g, "$1$2")
    .replace(/([a-z])\n([a-z])/g, "$1 $2")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n")
    .trim();
};

const removeNoise = (text) => {
  return text
    .replace(/page\s*\d+\s*(of\s*\d+)?/gi, "")
    .replace(/^\d+$/gm, "")
    .replace(/all rights reserved\.?/gi, "")
    .replace(/confidential\.?/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
};

const parseDocument = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  if (!SUPPORTED_TYPES[ext]) {
    throw new AppError(
      `Unsupported file type: ${ext}. Supported: ${Object.keys(SUPPORTED_TYPES).join(", ")}`,
      400
    );
  }

  logger.info("Parsing document", { filePath, type: SUPPORTED_TYPES[ext] });

  let rawText;

  switch (ext) {
    case ".txt":
      rawText = await parseTxt(filePath);
      break;
    case ".docx":
      rawText = await parseDocx(filePath);
      break;
    case ".pdf":
      rawText = await parsePdf(filePath);
      break;
  }

  const cleaned = removeNoise(rawText);
  const normalized = normalize(cleaned);

  logger.info("Document parsed", {
    type: SUPPORTED_TYPES[ext],
    rawLength: rawText.length,
    cleanedLength: normalized.length,
  });

  return {
    content: normalized,
    metadata: {
      source: path.basename(filePath),
      type: SUPPORTED_TYPES[ext],
      size: rawText.length,
      parsedAt: new Date().toISOString(),
    },
  };
};

module.exports = { parseDocument, normalize, removeNoise, SUPPORTED_TYPES };
