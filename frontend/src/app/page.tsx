"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Job {
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

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["jobs", search, type],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (type) params.append("type", type);
      const { data } = await api.get(`/jobs?${params.toString()}`);
      return data as Job[];
    },
  });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Find your next remote role
          </h1>
          <p className="text-lg text-gray-500 mb-8">
            Curated opportunities from companies hiring now
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs by title or keyword..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All types</option>
              <option value="remote">Remote</option>
              <option value="onsite">Onsite</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>
      </section>

      {/* Job list */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="text-center text-gray-500 py-20">Loading jobs...</div>
        ) : !jobs || jobs.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            <p className="text-lg font-medium text-gray-700 mb-1">
              No jobs found
            </p>
            <p className="text-sm">
              Try adjusting your search or check back later.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {jobs.length} {jobs.length === 1 ? "job" : "jobs"} found
            </p>
            <div className="grid gap-4">
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="block bg-white border border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-sm transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">
                        {job.title}
                      </h2>
                      <p className="text-sm text-gray-500 mb-3">
                        {job.employer.name} · {job.location}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {job.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 capitalize">
                          {job.type}
                        </span>
                        {job.tags?.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {job.salary && (
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {job.salary}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {job._count.applications} applicant
                        {job._count.applications === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
