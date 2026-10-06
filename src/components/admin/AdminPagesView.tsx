"use client";

import { useState, useTransition } from "react";
import { FileText, Edit2, Save, ExternalLink, Eye, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { renderMarkdownToHtml } from "@/lib/markdown";
import { upsertPageAction } from "@/app/admin/actions/pages";
import Link from "next/link";

interface PageRecord {
  id: string;
  slug: string;
  title: string;
  content: string;
  updatedAt: string | Date;
}

export function AdminPagesView({ initialPages }: { initialPages: PageRecord[] }) {
  const [pages, setPages] = useState(initialPages);
  const [activePage, setActivePage] = useState<PageRecord | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  const handleEdit = (p: PageRecord) => {
    setActivePage(p);
    setTitle(p.title);
    setContent(p.content);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePage) return;

    startTransition(async () => {
      const res = await upsertPageAction({
        slug: activePage.slug,
        title,
        content,
      });

      if (res.success) {
        setPages((prev) =>
          prev.map((p) =>
            p.slug === activePage.slug
              ? { ...p, title, content, updatedAt: new Date() }
              : p
          )
        );
        setToast({ type: "success", title: "Page Saved", message: res.message });
      } else {
        setToast({ type: "error", title: "Save Failed", message: res.message });
      }
    });
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blush pb-5">
        <div>
          <h1 className="text-2xl font-serif text-ink tracking-tight font-medium flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-brand" /> Static Pages & Content CMS
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Admin-editable Markdown pages with live real-time preview (About, FAQ, Policies, Brand Mission).
          </p>
        </div>

        {activePage && (
          <button
            onClick={() => setActivePage(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink px-3 py-1.5 rounded-xl border border-pink-light bg-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Page List
          </button>
        )}
      </div>

      {!activePage ? (
        /* Page List Table */
        <div className="bg-white rounded-2xl border border-pink-light shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-pink-light bg-blush/30 text-ink/70 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Page Title</th>
                  <th className="py-3 px-4">URL Route</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blush">
                {pages.map((p) => (
                  <tr key={p.id} className="hover:bg-blush/20 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-ink">{p.title}</td>
                    <td className="py-3.5 px-4 font-mono text-brand">/{p.slug}</td>
                    <td className="py-3.5 px-4 text-muted">
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        href={`/${p.slug}`}
                        target="_blank"
                        className="inline-block p-1.5 text-muted hover:text-brand rounded-lg border border-pink-light transition-colors"
                        title="View Public Page"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleEdit(p)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-semibold text-brand hover:bg-blush rounded-lg border border-pink-light transition-colors"
                      >
                        <Edit2 className="w-3 h-3" /> Edit in Live Preview
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Split-view Live Markdown Editor */
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-pink-light shadow-xs">
            <div className="flex-1 max-w-md">
              <label className="block text-[11px] font-semibold text-ink mb-1">
                Page Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="text-sm font-semibold"
              />
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/${activePage.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-xs text-brand hover:underline font-medium"
              >
                View Public <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Button type="submit" disabled={isPending} className="text-xs h-10 px-5 flex items-center gap-2">
                <Save className="w-4 h-4" />
                {isPending ? "Saving..." : "Save Page"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Markdown Editor */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-pink-light shadow-xs flex flex-col space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-blush text-xs font-semibold text-ink">
                <span>Markdown Editor</span>
                <span className="text-[11px] text-muted font-normal font-mono">
                  Slug: /{activePage.slug}
                </span>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={22}
                className="w-full text-xs font-mono p-3 rounded-xl border border-pink-light bg-blush/10 focus:outline-none focus:border-brand resize-y leading-relaxed"
                placeholder="Write Markdown here..."
              />
              <div className="text-[10px] text-muted">
                Supports: # H1, ## H2, ### H3, - Bullet lists, **bold**, *italic*, [link](url), &gt; Quotes.
              </div>
            </div>

            {/* Right: Live Preview */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-pink-light shadow-xs flex flex-col space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-blush text-xs font-semibold text-ink">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-brand" /> Live Rendered Preview
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Instant
                </span>
              </div>
              <div className="p-4 rounded-xl border border-pink-light/60 bg-white max-h-145 overflow-y-auto">
                <div
                  className="prose prose-sm max-w-none text-ink text-xs sm:text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(content) }}
                />
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
