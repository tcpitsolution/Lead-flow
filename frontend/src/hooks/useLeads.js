import { useCallback, useEffect, useState } from "react";
import { api } from "../api";

export default function useLeads() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = useCallback(async () => {
    setError("");
    try {
      const q = new URLSearchParams({ page, limit: 10 });
      if (search.trim()) q.set("search", search.trim());
      if (status) q.set("status", status);

      const [list, summary] = await Promise.all([
        api(`/leads?${q}`),
        api("/leads/stats/summary"),
      ]);
      setLeads(list.items);
      setPages(list.pages);
      setStats(summary.stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  // search type karte waqt har akshar par API na lage
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  // ye teeno error upar bhejte hain, taaki Add Lead ka form khud dikha sake
  const addLead = async (data) => {
    await api("/leads", { method: "POST", body: data });
    await load();
  };
  const updateLead = async (id, data) => {
    await api(`/leads/${id}`, { method: "PUT", body: data });
    await load();
  };
  const removeLead = async (id) => {
    await api(`/leads/${id}`, { method: "DELETE" });
    await load();
  };

  return {
    leads,
    stats,
    loading,
    error,
    search,
    setSearch: (v) => {
      setSearch(v);
      setPage(1);
    },
    status,
    setStatus: (v) => {
      setStatus(v);
      setPage(1);
    },
    page,
    setPage,
    pages,
    addLead,
    updateLead,
    removeLead,
    refresh: load,
  };
}
