const logger = require("../../../common/utils/logger");
const env = require("../../../config/env");

const getDefaults = () => ({
  maxTokens: env.chunkMaxTokens,
  minTokens: env.chunkMinTokens,
  overlap: env.chunkOverlap,
});

const estimateTokens = (text) => Math.ceil(text.split(/\s+/).length * 1.3);

const splitByHeadings = (text) => {
  const headingPattern = /^(#{1,6}\s.+|(?:[A-Z][a-z]* ){0,5}[A-Z][a-z]*:?\s*)$/gm;
  const sections = [];
  let lastIndex = 0;
  let lastHeading = "";
  let match;

  while ((match = headingPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const content = text.slice(lastIndex, match.index).trim();
      if (content) {
        sections.push({ heading: lastHeading, content });
      }
    }
    lastHeading = match[1].replace(/^#+\s*/, "").trim();
    lastIndex = match.index + match[0].length;
  }

  const remaining = text.slice(lastIndex).trim();
  if (remaining) {
    sections.push({ heading: lastHeading, content: remaining });
  }

  if (sections.length === 0) {
    sections.push({ heading: "", content: text.trim() });
  }

  return sections;
};

const splitByParagraphs = (text) => {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
};

const splitWithOverlap = (text, options) => {
  const { maxTokens, overlap } = options;
  const words = text.split(/\s+/);
  const chunks = [];
  const wordsPerChunk = Math.floor(maxTokens / 1.3);
  const overlapWords = Math.floor(overlap / 1.3);

  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + wordsPerChunk, words.length);
    const chunk = words.slice(start, end).join(" ");
    chunks.push(chunk);

    if (end >= words.length) break;
    start = end - overlapWords;
  }

  return chunks;
};

const chunkText = (text, options = {}) => {
  const opts = { ...getDefaults(), ...options };

  logger.info("Starting chunking", {
    textLength: text.length,
    estimatedTokens: estimateTokens(text),
  });

  const sections = splitByHeadings(text);
  const chunks = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const sectionTokens = estimateTokens(section.content);

    if (sectionTokens <= opts.maxTokens) {
      if (sectionTokens >= opts.minTokens) {
        chunks.push({
          text: section.heading
            ? `${section.heading}\n\n${section.content}`
            : section.content,
          index: chunkIndex++,
          heading: section.heading,
          tokens: sectionTokens,
        });
      }
      continue;
    }

    const paragraphs = splitByParagraphs(section.content);
    let buffer = "";
    let bufferTokens = 0;

    for (const paragraph of paragraphs) {
      const paraTokens = estimateTokens(paragraph);

      if (paraTokens > opts.maxTokens) {
        if (buffer.trim()) {
          chunks.push({
            text: section.heading
              ? `${section.heading}\n\n${buffer.trim()}`
              : buffer.trim(),
            index: chunkIndex++,
            heading: section.heading,
            tokens: bufferTokens,
          });
          buffer = "";
          bufferTokens = 0;
        }

        const subChunks = splitWithOverlap(paragraph, opts);
        for (const sub of subChunks) {
          chunks.push({
            text: section.heading
              ? `${section.heading}\n\n${sub}`
              : sub,
            index: chunkIndex++,
            heading: section.heading,
            tokens: estimateTokens(sub),
          });
        }
        continue;
      }

      if (bufferTokens + paraTokens > opts.maxTokens) {
        if (buffer.trim()) {
          chunks.push({
            text: section.heading
              ? `${section.heading}\n\n${buffer.trim()}`
              : buffer.trim(),
            index: chunkIndex++,
            heading: section.heading,
            tokens: bufferTokens,
          });
        }
        buffer = paragraph;
        bufferTokens = paraTokens;
      } else {
        buffer += (buffer ? "\n\n" : "") + paragraph;
        bufferTokens += paraTokens;
      }
    }

    if (buffer.trim() && bufferTokens >= opts.minTokens) {
      chunks.push({
        text: section.heading
          ? `${section.heading}\n\n${buffer.trim()}`
          : buffer.trim(),
        index: chunkIndex++,
        heading: section.heading,
        tokens: bufferTokens,
      });
    }
  }

  logger.info("Chunking complete", {
    totalChunks: chunks.length,
    avgTokens: chunks.length
      ? Math.round(chunks.reduce((sum, c) => sum + c.tokens, 0) / chunks.length)
      : 0,
  });

  return chunks;
};

module.exports = { chunkText, splitByHeadings, splitByParagraphs, estimateTokens };
