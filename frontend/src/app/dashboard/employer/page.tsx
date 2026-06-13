"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/hooks/useRequireAuth";

interface Job {
  id: string;
  title: string;
  location: string;
  type: string;
  status: "DRAFT" | "ACTIVE" | "CLOSED";
  createdAt: string;
  _count: { applications: number };
}

interface Applicant {
  id: string;
  status: "APPLIED" | "REVIEWED" | "SHORTLISTED" | "REJECTED" | "HIRED";
  coverLetter?: string;
  createdAt: string;
  candidate: { id: string; name: string; email: string; bio?: string };
}

const STATUS_STYLES: Record<string, string> = {
  APPLIED: "bg-gray-100 text-gray-700",
  REVIEWED: "bg-blue-100 text-blue-700",
  SHORTLISTED: "bg-amber-100 text-amber-700",
  HIRED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const JOB_STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  ACTIVE: "bg-green-100 text-green-700",
  CLOSED: "bg-red-100 text-red-700",
};

export default function EmployerDashboard() {
  const { hydrated } = useRequireAuth("EMPLOYER");
  const queryClient = useQueryClient();
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["my-jobs"],
    queryFn: async () => {
      const { data } = await api.get("/jobs/my");
      return data as Job[];
    },
    enabled: hydrated,
  });

  // publish or close a job
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch(`/jobs/${id}`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-jobs"] });
      toast.success("Job updated");
    },
    onError: () => toast.error("Failed to update job"),
  });

  if (!hydrated || isLoading) {
    return <div className="text-center text-gray-500 py-20">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Your jobs</h1>
            <p className="text-sm text-gray-500">
              Manage postings and applicants
            </p>
          </div>
          <Link
            href="/dashboard/employer/post"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            + Post a job
          </Link>
        </div>

        {!jobs || jobs.length === 0 ? (
          <div className="text-center text-gray-500 py-20 bg-white border border-gray-200 rounded-xl">
            <p className="text-lg font-medium text-gray-700 mb-1">
              No jobs yet
            </p>
            <p className="text-sm mb-4">Post your first job to start hiring.</p>
            <Link
              href="/dashboard/employer/post"
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              Post a job
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-semibold text-gray-900">
                          {job.title}
                        </h2>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${JOB_STATUS_STYLES[job.status]}`}
                        >
                          {job.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {job.location} · {job.type} · {job._count.applications}{" "}
                        applicant{job._count.applications === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {job.status === "DRAFT" && (
                      <button
                        onClick={() =>
                          statusMutation.mutate({
                            id: job.id,
                            status: "ACTIVE",
                          })
                        }
                        className="text-sm px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        Publish
                      </button>
                    )}
                    {job.status === "ACTIVE" && (
                      <button
                        onClick={() =>
                          statusMutation.mutate({
                            id: job.id,
                            status: "CLOSED",
                          })
                        }
                        className="text-sm px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                      >
                        Close
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setExpandedJob(expandedJob === job.id ? null : job.id)
                      }
                      className="text-sm px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      {expandedJob === job.id
                        ? "Hide applicants"
                        : "View applicants"}
                    </button>
                  </div>
                </div>

                {expandedJob === job.id && <ApplicantsList jobId={job.id} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Applicants sub-component ──────────────────────────────
function ApplicantsList({ jobId }: { jobId: string }) {
  const queryClient = useQueryClient();

  const { data: applicants, isLoading } = useQuery({
    queryKey: ["applicants", jobId],
    queryFn: async () => {
      const { data } = await api.get(`/jobs/${jobId}/applications`);
      return data as Applicant[];
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch(`/applications/${id}`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicants", jobId] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  if (isLoading) {
    return (
      <div className="border-t border-gray-200 p-6 text-sm text-gray-500">
        Loading applicants...
      </div>
    );
  }

  if (!applicants || applicants.length === 0) {
    return (
      <div className="border-t border-gray-200 p-6 text-sm text-gray-500">
        No applicants yet.
      </div>
    );
  }

  const statuses = ["APPLIED", "REVIEWED", "SHORTLISTED", "HIRED", "REJECTED"];

  return (
    <div className="border-t border-gray-200 bg-gray-50 p-6 space-y-3">
      {applicants.map((app) => (
        <div
          key={app.id}
          className="bg-white border border-gray-200 rounded-lg p-4"
        >
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <p className="font-medium text-gray-900">{app.candidate.name}</p>
              <p className="text-sm text-gray-500">{app.candidate.email}</p>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[app.status]}`}
            >
              {app.status}
            </span>
          </div>

          {app.coverLetter && (
            <p className="text-sm text-gray-600 mb-3 bg-gray-50 rounded p-3">
              {app.coverLetter}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => statusMutation.mutate({ id: app.id, status: s })}
                disabled={app.status === s}
                className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                  app.status === s
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 cursor-default"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
