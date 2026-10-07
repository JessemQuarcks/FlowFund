"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Update = { id: string; title: string; body: string; date: string };

export function EventUpdates({
  eventId,
  isOwner,
}: {
  eventId: string;
  isOwner: boolean;
}) {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/events/${eventId}/updates`)
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => active && b && setUpdates(b.updates ?? []))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [eventId]);

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.message ?? "Could not post update");
      setUpdates((prev) => [payload.update, ...prev]);
      setTitle("");
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post update");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Post an update</CardTitle>
            <CardDescription>
              Keep your donors informed about your progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={post} className="space-y-4">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="space-y-2">
                <Label htmlFor="update-title">Title</Label>
                <Input
                  id="update-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-body">Update</Label>
                <Textarea
                  id="update-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="min-h-24"
                  maxLength={5000}
                  required
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={submitting || !title.trim() || !body.trim()}
                  variant="gradient"
                >
                  {submitting ? "Posting…" : "Post Update"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Project Updates</CardTitle>
          <CardDescription>Stay informed about our progress</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Loading updates…
            </p>
          ) : updates.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No updates yet.
            </p>
          ) : (
            <div className="space-y-4">
              {updates.map((u) => (
                <div key={u.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between mb-1 gap-4">
                    <h3 className="font-semibold text-primary-600">
                      {u.title}
                    </h3>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(u.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {u.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
