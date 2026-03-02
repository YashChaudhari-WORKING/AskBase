const mongoose = require("mongoose");

const chunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
    index: { type: Number, required: true },
    tokens: { type: Number },
    heading: { type: String, default: "" },
    metadata: {
      source: { type: String },
      type: { type: String },
      summary: { type: String },
      keywords: [String],
      hypotheticalQuestions: [String],
    },
  },
  { timestamps: true }
);

chunkSchema.index({ documentId: 1, index: 1 });
chunkSchema.index(
  { text: "text", heading: "text", "metadata.keywords": "text" },
  { weights: { text: 1, heading: 2, "metadata.keywords": 3 }, name: "chunk_text_search" }
);

module.exports = mongoose.model("Chunk", chunkSchema);
