const { ingestDocument } = require("../services/ingestion");
const Document = require("../models/Document");
const Chunk = require("../../knowledgebase/models/Chunk");
const AppError = require("../../../common/errors/AppError");

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError("No file uploaded", 400);
    }

    const doc = await ingestDocument(req.file.path, {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    res.status(201).json({
      success: true,
      data: {
        id: doc._id,
        filename: doc.originalName,
        status: doc.status,
        chunkCount: doc.chunkCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getDocuments = async (req, res, next) => {
  try {
    const docs = await Document.find().sort({ createdAt: -1 });
    res.json({ success: true, data: docs });
  } catch (error) {
    next(error);
  }
};

const getDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) throw new AppError("Document not found", 404);

    const chunks = await Chunk.find({ documentId: doc._id })
      .select("text index heading tokens metadata")
      .sort({ index: 1 });

    res.json({ success: true, data: { document: doc, chunks } });
  } catch (error) {
    next(error);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) throw new AppError("Document not found", 404);

    await Chunk.deleteMany({ documentId: doc._id });
    await Document.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Document deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadDocument, getDocuments, getDocument, deleteDocument };
