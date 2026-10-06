/**
 * Markdown sanitization and rendering utilities for Samaura CMS and Blog.
 * Enforces zero script injection, strips dangerous HTML tags, and ensures clean output.
 */

/**
 * Strips script tags, style tags, iframes, embedded objects, and inline event handlers.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  let clean = html;

  // 1. Strip <script>...</script> completely (case-insensitive, multi-line)
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  // Strip standalone or malformed script tags
  clean = clean.replace(/<script\b[^>]*>/gi, "").replace(/<\/script>/gi, "");

  // 2. Strip <iframe>, <object>, <embed>, <applet>, <base>, <link>, <style>
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  clean = clean.replace(/<\/?(iframe|object|embed|applet|base|link|style|meta|form|input|button)\b[^>]*>/gi, "");

  // 3. Strip dangerous inline event handlers (onload, onerror, onclick, onmouseover, etc.)
  clean = clean.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // 4. Neutralize javascript: or vbscript: or data: in href/src
  clean = clean.replace(/\b(href|src)\s*=\s*["']?\s*(?:javascript|vbscript|data):[^"'>\s]*/gi, '$1="#"');

  return clean;
}

/**
 * Basic markdown-to-HTML parser that parses markdown into safe, semantic HTML.
 * Sanitizes input first to guarantee no script execution.
 */
export function renderMarkdownToHtml(markdown: string): string {
  if (!markdown) return "";

  // Sanitize raw input first
  let text = sanitizeHtml(markdown);

  // Normalize line endings
  text = text.replace(/\r\n/g, "\n");

  const lines = text.split("\n");
  const htmlParts: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      if (inList) {
        htmlParts.push("</ul>");
        inList = false;
      }
      continue;
    }

    // Unordered List item: - or *
    if (/^[-*]\s+/.test(line)) {
      if (!inList) {
        htmlParts.push('<ul class="list-disc pl-5 space-y-1.5 my-3 text-muted">');
        inList = true;
      }
      const itemContent = formatInlineMarkdown(line.replace(/^[-*]\s+/, ""));
      htmlParts.push(`<li>${itemContent}</li>`);
      continue;
    }

    if (inList) {
      htmlParts.push("</ul>");
      inList = false;
    }

    // Headings
    if (line.startsWith("### ")) {
      htmlParts.push(`<h3 class="text-lg font-heading font-bold text-ink mt-6 mb-2">${formatInlineMarkdown(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      htmlParts.push(`<h2 class="text-xl sm:text-2xl font-heading font-bold text-ink mt-8 mb-3">${formatInlineMarkdown(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      htmlParts.push(`<h1 class="text-2xl sm:text-3xl font-heading font-extrabold text-ink mt-8 mb-4">${formatInlineMarkdown(line.slice(2))}</h1>`);
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      htmlParts.push(`<blockquote class="border-l-4 border-brand/40 pl-4 py-1 italic my-4 text-muted bg-blush/30 rounded-r-xl">${formatInlineMarkdown(line.slice(2))}</blockquote>`);
      continue;
    }

    // Horizontal rule
    if (/^---|\*\*\*|___$/.test(line)) {
      htmlParts.push('<hr class="my-6 border-pink-light" />');
      continue;
    }

    // Paragraph
    htmlParts.push(`<p class="text-sm sm:text-base leading-relaxed text-muted mb-4">${formatInlineMarkdown(line)}</p>`);
  }

  if (inList) {
    htmlParts.push("</ul>");
  }

  return sanitizeHtml(htmlParts.join("\n"));
}

/**
 * Formats inline markdown: bold, italic, code, and links.
 */
function formatInlineMarkdown(text: string): string {
  let res = text;

  // Escape raw HTML entities if any remained
  res = res.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Bold: **text** or __text__
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-ink">$1</strong>');
  res = res.replace(/__(.*?)__/g, '<strong class="font-semibold text-ink">$1</strong>');

  // Italic: *text* or _text_
  res = res.replace(/(^|[^*])\*(.*?)\*([^*]|$)/g, '$1<em>$2</em>$3');
  res = res.replace(/(^|[^_])_(.*?)_([^_]|$)/g, '$1<em>$2</em>$3');

  // Inline code: `code`
  res = res.replace(/`([^`]+)`/g, '<code class="bg-blush px-1.5 py-0.5 rounded text-xs font-mono text-brand">$1</code>');

  // Links: [text](url)
  res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
    // Only allow safe protocols
    const cleanHref = href.trim();
    if (/^(https?:|\/|mailto:)/i.test(cleanHref)) {
      return `<a href="${cleanHref}" class="text-brand hover:underline font-medium" rel="noopener noreferrer">${label}</a>`;
    }
    return label;
  });

  return res;
}
