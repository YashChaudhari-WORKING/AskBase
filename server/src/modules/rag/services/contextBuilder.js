const buildContext = (chunks) => {
  if (chunks.length === 0) {
    return { context: "", sources: [] };
  }

  const sources = [];
  const contextParts = [];

  chunks.forEach((chunk, i) => {
    const sourceLabel = chunk.heading || `Section ${chunk.index + 1}`;
    const sourceId = i + 1;

    sources.push({
      id: sourceId,
      label: sourceLabel,
      documentId: chunk.documentId,
      chunkIndex: chunk.index,
      relevanceScore: chunk.relevanceScore,
    });

    contextParts.push(`[Source ${sourceId} - ${sourceLabel}]\n${chunk.text}`);
  });

  const context = contextParts.join("\n\n---\n\n");

  return { context, sources };
};

module.exports = { buildContext };
