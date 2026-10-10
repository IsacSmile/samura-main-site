/**
 * Strips initial title heading and/or lead paragraph from CMS markdown content
 * if they duplicate what is already displayed in the hero.
 */
export function filterDuplicateTitleAndLead(
  markdown: string,
  title?: string,
  lead?: string
): string {
  if (!markdown) return "";

  const lines = markdown.replace(/\r\n/g, "\n").trim().split("\n");
  const normalize = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9]/g, "").trim();

  const normTitle = title ? normalize(title) : "";
  const normLead = lead ? normalize(lead) : "";

  let i = 0;
  while (i < lines.length && !lines[i].trim()) {
    i++;
  }

  // 1. Check if first content block is a heading equal to title
  if (i < lines.length && lines[i].trim().startsWith("#")) {
    const headingText = lines[i].trim().replace(/^#+\s*/, "");
    if (normTitle && normalize(headingText) === normTitle) {
      i++;
      while (i < lines.length && !lines[i].trim()) {
        i++;
      }
    }
  }

  // 2. Check if subsequent content paragraph is equal to lead
  if (i < lines.length) {
    const paraLines: string[] = [];
    let j = i;
    while (j < lines.length && lines[j].trim() && !lines[j].trim().startsWith("#")) {
      paraLines.push(lines[j].trim());
      j++;
    }
    const paraText = paraLines.join(" ");
    if (normLead && normalize(paraText) === normLead) {
      i = j;
      while (i < lines.length && !lines[i].trim()) {
        i++;
      }
    }
  }

  return lines.slice(i).join("\n").trim();
}
