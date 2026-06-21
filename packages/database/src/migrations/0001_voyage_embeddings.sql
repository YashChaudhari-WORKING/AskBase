-- Migration: Switch embeddings from OpenAI text-embedding-3-small (1536d) to Voyage voyage-3 (1024d)
-- Run this BEFORE deploying the new application code.
-- After running: re-upload all documents to regenerate embeddings.

-- 1. Clear chunk data (embeddings are incompatible with the new model)
TRUNCATE TABLE chunks;

-- 2. Reset documents so they can be re-ingested
UPDATE documents SET status = 'processing', chunk_count = 0;

-- 3. Drop old HNSW index before altering column type
DROP INDEX IF EXISTS chunks_embedding_idx;

-- 4. Change vector dimension from 1536 to 1024
ALTER TABLE chunks ALTER COLUMN embedding TYPE vector(1024);

-- 5. Recreate HNSW index with new dimension
CREATE INDEX chunks_embedding_idx ON chunks USING hnsw (embedding vector_cosine_ops);

-- 6. Convert learned_responses embedding from TEXT to vector(1024)
ALTER TABLE learned_responses DROP COLUMN IF EXISTS embedding;
ALTER TABLE learned_responses ADD COLUMN embedding vector(1024);

-- 7. Add HNSW index on learned_responses for fast similarity search
CREATE INDEX learned_responses_embedding_idx ON learned_responses USING hnsw (embedding vector_cosine_ops);
