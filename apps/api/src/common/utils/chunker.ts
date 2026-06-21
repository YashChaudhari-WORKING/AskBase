const TARGET_TOKENS = 400;
const OVERLAP_TOKENS = 60;
const AVG_CHARS_PER_TOKEN = 4;

function approximateTokens(text: string): number {
  return Math.ceil(text.length / AVG_CHARS_PER_TOKEN);
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

export interface TextChunk {
  content: string;
  tokenCount: number;
}

export function chunkTextSentenceAware(text: string): TextChunk[] {
  const sentences = splitSentences(text);
  const result: TextChunk[] = [];
  let current: string[] = [];
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sentenceTokens = approximateTokens(sentence);

    if (currentTokens + sentenceTokens > TARGET_TOKENS && current.length > 0) {
      const content = current.join(" ");
      result.push({ content, tokenCount: approximateTokens(content) });

      // Build overlap from tail of current chunk
      let overlapTokens = 0;
      const overlap: string[] = [];
      for (let i = current.length - 1; i >= 0; i--) {
        const t = approximateTokens(current[i]);
        if (overlapTokens + t > OVERLAP_TOKENS) break;
        overlap.unshift(current[i]);
        overlapTokens += t;
      }

      current = [...overlap, sentence];
      currentTokens = overlapTokens + sentenceTokens;
    } else {
      current.push(sentence);
      currentTokens += sentenceTokens;
    }
  }

  if (current.length > 0) {
    const content = current.join(" ");
    result.push({ content, tokenCount: approximateTokens(content) });
  }

  return result.filter(c => c.content.trim().length > 20);
}
