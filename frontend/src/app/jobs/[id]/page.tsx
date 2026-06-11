"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

interface JobDetail {
  id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  salary?: string;
  tags: string[];
  createdAt: string;
  employer: { name: string; avatar?: string };
  _count: { applications: number };
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [coverLetter, setCoverLetter] = useState("");
  const [showApply, setShowApply] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const { data } = await api.get(`/jobs/${id}`);
      return data as JobDetail;
    },
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/jobs/${id}/apply`, { coverLetter });
      return data;
    },
    onSuccess: () => {
      toast.success("Application submitted!");
      setShowApply(false);
      setCoverLetter("");
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to apply";
      toast.error(message);
    },
  });

  const handleApplyClick = () => {
    if (!token) {
      toast.error("Please log in to apply");
      router.push("/login");
      return;
    }
    if (user?.role !== "CANDIDATE") {
      toast.error("Only candidates can apply");
      return;
    }
    setShowApply(true);
  };

  if (isLoading) {
    return <div className="text-center text-gray-500 py-20">Loading...</div>;
  }

  if (!job) {
    return <div className="text-center text-gray-500 py-20">Job not found</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          ← Back to jobs
        </button>

        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                {job.title}
              </h1>
              <p className="text-sm text-gray-500">
                {job.employer.name} · {job.location}
              </p>
            </div>
            {job.salary && (
              <p className="text-lg font-semibold text-gray-900 whitespace-nowrap">
                {job.salary}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 capitalize">
              {job.type}
            </span>
            {job.tags?.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="prose prose-sm max-w-none mb-8">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">
              Job Description
            </h2>
            <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
              {job.description}
            </p>
          </div>

          {!showApply ? (
            <button
              onClick={handleApplyClick}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Apply for this position
            </button>
          ) : (
            <div className="border-t border-gray-200 pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover letter (optional)
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={5}
                placeholder="Tell the employer why you're a great fit..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => applyMutation.mutate()}
                  disabled={applyMutation.isPending}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {applyMutation.isPending
                    ? "Submitting..."
                    : "Submit application"}
                </button>
                <button
                  onClick={() => setShowApply(false)}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
