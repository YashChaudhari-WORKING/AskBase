const { parseDocument } = require("./parser");
const { chunkText } = require("../../knowledgebase/services/chunker");
const { embedBatch } = require("../../knowledgebase/services/embedding");
const { enrichBatch } = require("../../knowledgebase/services/enrichment");
const { groqEnrichApiKey } = require("../../../config/env");
const Document = require("../models/Document");
const Chunk = require("../../knowledgebase/models/Chunk");
const logger = require("../../../common/utils/logger");

const ingestDocument = async (filePath, fileInfo, chunkOptions = {}) => {
  const doc = await Document.create({
    filename: fileInfo.filename,
    originalName: fileInfo.originalName,
    mimeType: fileInfo.mimeType,
    size: fileInfo.size,
    status: "processing",
  });

  try {
    logger.info("Starting ingestion", { documentId: doc._id, file: fileInfo.originalName });

    const parsed = await parseDocument(filePath);

    const chunks = chunkText(parsed.content, chunkOptions);

    if (chunks.length === 0) {
      doc.status = "completed";
      doc.chunkCount = 0;
      await doc.save();
      return doc;
    }

    const texts = chunks.map((c) => c.text);
    const embeddings = await embedBatch(texts);

    // enrich chunks with Groq metadata if API key is configured
    let enrichments = null;
    if (groqEnrichApiKey) {
      logger.info("Starting metadata enrichment", { chunks: chunks.length });
      enrichments = await enrichBatch(chunks);
    }

    const chunkDocs = chunks.map((chunk, i) => ({
      documentId: doc._id,
      text: chunk.text,
      embedding: embeddings[i],
      index: chunk.index,
      tokens: chunk.tokens,
      heading: chunk.heading,
      metadata: {
        source: parsed.metadata.source,
        type: parsed.metadata.type,
        ...(enrichments?.[i] || {}),
      },
    }));

    await Chunk.insertMany(chunkDocs);

    doc.status = "completed";
    doc.chunkCount = chunks.length;
    await doc.save();

    logger.info("Ingestion complete", {
      documentId: doc._id,
      chunks: chunks.length,
    });

    return doc;
  } catch (error) {
    doc.status = "failed";
    doc.error = error.message;
    await doc.save();

    logger.error("Ingestion failed", {
      documentId: doc._id,
      error: error.message,
    });

    throw error;
  }
};

module.exports = { ingestDocument };
