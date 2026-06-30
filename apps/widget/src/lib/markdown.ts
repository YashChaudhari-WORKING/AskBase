import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";

// Curated language set — keeps the bundle small vs. the full highlight.js build
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import xml from "highlight.js/lib/languages/xml"; // html
import css from "highlight.js/lib/languages/css";
import sql from "highlight.js/lib/languages/sql";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("py", python);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("sql", sql);

const marked = new Marked(
  markedHighlight({
    emptyLangClass: "hljs",
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      try {
        return hljs.highlight(code, { language }).value;
      } catch {
        return code;
      }
    },
  }),
);

marked.setOptions({ gfm: true, breaks: true });

// Render markdown → sanitized HTML string. Links open in a new tab safely.
export function renderMarkdown(text: string): string {
  const raw = marked.parse(text ?? "", { async: false }) as string;
  const clean = DOMPurify.sanitize(raw, {
    ADD_ATTR: ["target", "rel"],
    FORBID_TAGS: ["style", "script", "iframe", "form", "input"],
  });
  return clean;
}

// highlight.js github-ish theme, scoped + sized for the widget. Injected once into the shadow root.
export const MARKDOWN_CSS = `
.ab-md{font-size:14px;line-height:1.55;word-break:break-word}
.ab-md p{margin:2px 0}
.ab-md ul,.ab-md ol{margin:4px 0;padding-left:18px}
.ab-md li{margin:1px 0}
.ab-md a{color:var(--ab-accent);text-decoration:underline;text-underline-offset:2px}
.ab-md strong{font-weight:700}
.ab-md code:not(.hljs){background:rgba(127,127,127,.16);border-radius:5px;padding:1px 5px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.86em}
.ab-md pre{margin:6px 0;border-radius:10px;overflow:hidden;border:1px solid rgba(127,127,127,.18)}
.ab-md pre code.hljs{display:block;overflow-x:auto;padding:11px 13px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;line-height:1.5;background:#0d1117;color:#e6edf3}
.ab-md table{border-collapse:collapse;margin:6px 0;font-size:12.5px;width:100%}
.ab-md th,.ab-md td{border:1px solid rgba(127,127,127,.25);padding:5px 9px;text-align:left}
.ab-md th{background:rgba(127,127,127,.1);font-weight:600}
.ab-md blockquote{margin:6px 0;padding:2px 0 2px 12px;border-left:3px solid var(--ab-accent);opacity:.85}
.ab-md h1,.ab-md h2,.ab-md h3{margin:8px 0 4px;font-weight:700;line-height:1.3}
.ab-md h1{font-size:1.25em}.ab-md h2{font-size:1.15em}.ab-md h3{font-size:1.05em}
.ab-md img{max-width:100%;border-radius:8px}
.ab-md hr{border:none;border-top:1px solid rgba(127,127,127,.2);margin:8px 0}
.hljs-comment,.hljs-quote{color:#8b949e}
.hljs-keyword,.hljs-selector-tag,.hljs-literal,.hljs-type{color:#ff7b72}
.hljs-string,.hljs-attr,.hljs-template-tag{color:#a5d6ff}
.hljs-number,.hljs-built_in,.hljs-class .hljs-title{color:#79c0ff}
.hljs-title,.hljs-function .hljs-title,.hljs-section{color:#d2a8ff}
.hljs-name,.hljs-tag{color:#7ee787}
.hljs-attribute,.hljs-variable{color:#ffa657}
`;
