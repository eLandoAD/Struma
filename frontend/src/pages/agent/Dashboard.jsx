import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";

const API = "http://localhost:8080/api/analytics";

export default function AgentDashboard() {
  const [tab, setTab] = useState("current");
  const [rows, setRows] = useState([]);
  const [callsPerDay, setCallsPerDay] = useState({});
  const [speed, setSpeed] = useState({
    average: 0,
    median: 0
  });

  useEffect(() => {
    load();
  }, [tab]);

  async function load() {
    const log = await fetch(`${API}/call-log?view=${tab}`);
    setRows(await log.json());

    const calls = await fetch(`${API}/calls-per-day`);
    setCallsPerDay(await calls.json());

    const speedRes = await fetch(`${API}/speed-of-answer`);
    setSpeed(await speedRes.json());
  }

  function exportCsv() {
    window.open(`${API}/export`, "_blank");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="p-8">
        <h1 className="text-3xl font-bold mb-6">Agent Dashboard - Analytics</h1>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border rounded bg-white p-4">
            <h2 className="font-bold mb-2">Speed Of Answer</h2>
            <p>Average: {speed.average}s</p>
            <p>Median: {speed.median}s</p>
          </div>

          <div className="border rounded bg-white p-4">
            <h2 className="font-bold mb-2">Calls Per Day</h2>
            {Object.entries(callsPerDay).map(([date, count]) => (
              <div key={date}>
                {date}: {count}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <button className="px-4 py-2 border rounded bg-white hover:bg-slate-100" onClick={() => setTab("current")}>Current</button>
          <button className="px-4 py-2 border rounded bg-white hover:bg-slate-100" onClick={() => setTab("past")}>Past</button>
          <button className="px-4 py-2 border rounded bg-white hover:bg-slate-100" onClick={() => setTab("missed")}>Missed</button>
          <button className="px-4 py-2 border rounded bg-blue-600 text-white hover:bg-blue-700 ml-auto" onClick={exportCsv}>Export CSV</button>
        </div>

        <table className="w-full border bg-white text-left text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 border">Consultant</th>
              <th className="p-2 border">Source</th>
              <th className="p-2 border">Queued</th>
              <th className="p-2 border">Duration</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="p-2 border">{row.consultant}</td>
                <td className="p-2 border">{row.sourcePage}</td>
                <td className="p-2 border">{row.queuedAt}</td>
                <td className="p-2 border">{row.durationSeconds}s</td>
                <td className="p-2 border">{row.status}</td>
                <td className="p-2 border">{row.endReason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
