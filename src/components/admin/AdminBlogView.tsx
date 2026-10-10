"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { BookOpen, Plus, Edit2, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import {
  upsertPostAction,
  deletePostAction,
  togglePostPublishedAction,
} from "@/app/admin/actions/blog";
import Link from "next/link";

interface BlogPostRecord {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  author: string;
  category: string;
  readTime: string;
  isPublished: boolean;
  publishedAt: string | Date;
}

export function AdminBlogView({ initialPosts }: { initialPosts: BlogPostRecord[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [editingPost, setEditingPost] = useState<Partial<BlogPostRecord> | null>(null);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  const handleToggle = (post: BlogPostRecord) => {
    const nextPublished = !post.isPublished;
    startTransition(async () => {
      const res = await togglePostPublishedAction(post.id, nextPublished);
      if (res.success) {
        setPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, isPublished: nextPublished } : p))
        );
        setToast({ type: "success", title: "Status Updated", message: res.message });
      } else {
        setToast({ type: "error", title: "Failed", message: res.message });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    startTransition(async () => {
      const res = await deletePostAction(id);
      if (res.success) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        setToast({ type: "success", title: "Article Deleted", message: res.message });
      } else {
        setToast({ type: "error", title: "Delete Failed", message: res.message });
      }
    });
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const payload = {
      id: editingPost?.id,
      title: String(formData.get("title")),
      slug: String(formData.get("slug")).toLowerCase().trim(),
      excerpt: String(formData.get("excerpt")),
      content: String(formData.get("content")),
      coverImage: formData.get("coverImage") ? String(formData.get("coverImage")) : null,
      author: String(formData.get("author") || "Samaura Health Desk"),
      category: String(formData.get("category") || "Period Health"),
      readTime: String(formData.get("readTime") || "4 min read"),
      isPublished: formData.get("isPublished") === "true",
    };

    startTransition(async () => {
      const res = await upsertPostAction(payload);
      if (res.success) {
        setToast({ type: "success", title: "Article Saved", message: res.message });
        setEditingPost(null);
        window.location.reload();
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
            <BookOpen className="w-6 h-6 text-brand" /> Period Health Desk Blog
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Author educational hygiene guides, menstrual wellness articles, and manage publication statuses.
          </p>
        </div>

        <Button
          onClick={() =>
            setEditingPost({
              title: "",
              slug: "",
              excerpt: "",
              content: "## Overview\n\nWrite your educational guide here in Markdown format.\n\n### Guidance Tips\n\n- Tip 1\n- Tip 2",
              coverImage: "",
              author: "Samaura Health Desk",
              category: "Period Health",
              readTime: "4 min read",
              isPublished: true,
            })
          }
          className="text-xs h-10 px-4 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Article
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-pink-light shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-pink-light bg-blush/30 text-ink/70 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">Cover</th>
                <th className="py-3 px-4">Title & Slug</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Read Time</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blush">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    No blog posts published yet. Click &quot;New Article&quot; to draft one.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-blush/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="relative w-14 h-10 rounded-lg overflow-hidden bg-blush border border-pink-light">
                        {post.coverImage ? (
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-muted">
                            No img
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-ink">{post.title}</div>
                      <div className="text-[11px] text-muted font-mono">/blog/{post.slug}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-semibold bg-blush text-brand px-2 py-0.5 rounded-full border border-pink-light">
                        {post.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted">{post.readTime}</td>
                    <td className="py-3 px-4 text-muted">
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggle(post)}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
                          post.isPublished
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : "text-amber-700 bg-amber-50 border-amber-200"
                        }`}
                      >
                        {post.isPublished ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="inline-block p-1.5 text-muted hover:text-brand rounded-lg border border-pink-light transition-colors"
                        title="View Live"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => setEditingPost(post)}
                        className="p-1.5 text-muted hover:text-brand rounded-lg border border-pink-light transition-colors"
                        title="Edit Article"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1.5 text-muted hover:text-red-600 rounded-lg border border-pink-light transition-colors"
                        title="Delete Article"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-modal bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] flex flex-col"
          >
            <div className="border-b border-blush pb-3">
              <h3 className="font-heading font-bold text-lg text-ink">
                {editingPost.id ? "Edit Article" : "Compose New Article"}
              </h3>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 text-xs pr-1">
              <div>
                <label className="block font-semibold text-ink mb-1">Article Title</label>
                <Input
                  name="title"
                  defaultValue={editingPost.title || ""}
                  placeholder="e.g. Pure Cotton Menstrual Pads vs Conventional Plastic"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-ink mb-1">URL Slug</label>
                  <Input
                    name="slug"
                    defaultValue={editingPost.slug || ""}
                    placeholder="pure-cotton-pads-guide"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">Category</label>
                  <Input
                    name="category"
                    defaultValue={editingPost.category || "Period Health"}
                    placeholder="e.g. Skin Health or Hygiene"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-ink mb-1">Author Name</label>
                  <Input
                    name="author"
                    defaultValue={editingPost.author || "Samaura Health Desk"}
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink mb-1">Read Time</label>
                  <Input
                    name="readTime"
                    defaultValue={editingPost.readTime || "4 min read"}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Cover Image URL</label>
                <Input
                  name="coverImage"
                  defaultValue={editingPost.coverImage || ""}
                  placeholder="https://... or /blog/cover.webp"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Short Excerpt (Summary)</label>
                <textarea
                  name="excerpt"
                  defaultValue={editingPost.excerpt || ""}
                  rows={2}
                  required
                  placeholder="A short overview displayed in the article cards..."
                  className="w-full text-xs p-3 rounded-xl border border-pink-light focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Article Body (Markdown)</label>
                <textarea
                  name="content"
                  defaultValue={editingPost.content || ""}
                  rows={10}
                  required
                  placeholder="Write in Markdown. Supports headings (##), lists, bold, italics, links..."
                  className="w-full text-xs p-3 font-mono rounded-xl border border-pink-light focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">Publication Status</label>
                <select
                  name="isPublished"
                  defaultValue={editingPost.isPublished !== false ? "true" : "false"}
                  className="w-full text-xs p-2.5 rounded-xl border border-pink-light bg-white focus:outline-none focus:border-brand"
                >
                  <option value="true">Published (Public)</option>
                  <option value="false">Draft (Hidden)</option>
                </select>
              </div>
            </div>

            <div className="border-t border-blush pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink rounded-xl"
              >
                Cancel
              </button>
              <Button type="submit" disabled={isPending} className="text-xs px-5 py-2">
                {isPending ? "Saving..." : "Save Article"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
