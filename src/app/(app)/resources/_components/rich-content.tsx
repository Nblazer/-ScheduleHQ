import * as React from "react";

// A light-weight renderer for Resource pages.
// Rules:
//   - Blank-line separated blocks become paragraphs.
//   - A paragraph that is ONLY a YouTube URL becomes an embedded video.
//   - URLs inside text paragraphs are linkified.
//   - Line breaks inside a paragraph are preserved.
// Intentionally not markdown — fewer foot-guns, no extra dep.

type Block =
  | { type: "youtube"; id: string; url: string }
  | { type: "text"; content: string };

const YT_RE =
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/;

function extractYoutubeId(text: string): string | null {
  const m = YT_RE.exec(text.trim());
  return m ? m[1] : null;
}

function parseBlocks(raw: string): Block[] {
  const out: Block[] = [];
  const paragraphs = raw.split(/\n\s*\n/);
  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed) continue;
    // If the entire paragraph is a single URL/line, and that URL is YouTube, embed it.
    if (!/\s/.test(trimmed) || trimmed.split(/\s+/).every((x) => /^https?:\/\//.test(x))) {
      const id = extractYoutubeId(trimmed);
      if (id) {
        out.push({ type: "youtube", id, url: trimmed });
        continue;
      }
    }
    out.push({ type: "text", content: trimmed });
  }
  return out;
}

const URL_RE = /(https?:\/\/[^\s)]+)/g;

function Linkify({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  URL_RE.lastIndex = 0;
  while ((match = URL_RE.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const url = match[0];
    parts.push(
      <a
        key={`${match.index}-${url}`}
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className="text-primary hover:underline break-all"
      >
        {url}
      </a>,
    );
    last = URL_RE.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export function RichContent({ text }: { text: string }) {
  if (!text.trim()) {
    return (
      <p className="text-muted-foreground italic">
        This page is empty. Click Edit to add content.
      </p>
    );
  }
  const blocks = parseBlocks(text);
  return (
    <div className="space-y-5 leading-relaxed">
      {blocks.map((b, i) => {
        if (b.type === "youtube") {
          return (
            <div
              key={i}
              className="relative w-full aspect-video rounded-xl overflow-hidden border border-border bg-black"
            >
              <iframe
                src={`https://www.youtube.com/embed/${b.id}`}
                title="Embedded video"
                loading="lazy"
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap">
            {b.content.split("\n").map((line, li) => (
              <React.Fragment key={li}>
                {li > 0 ? <br /> : null}
                <Linkify text={line} />
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
