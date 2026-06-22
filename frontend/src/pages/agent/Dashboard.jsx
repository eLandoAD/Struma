import { useEffect, useState } from "react";

const API = "http://localhost:8080/api/analytics";

export default function AgentDashboard() {

  const [tab, setTab] = useState("current");

  const [rows, setRows] = useState([]);

  const [callsPerDay, setCallsPerDay] =
    useState({});

  const [speed, setSpeed] =
    useState({
      average: 0,
      median: 0
    });

  useEffect(() => {

    load();

  }, [tab]);

  async function load() {

    const log =
      await fetch(
        `${API}/call-log?view=${tab}`
      );

    setRows(
      await log.json()
    );

    const calls =
      await fetch(
        `${API}/calls-per-day`
      );

    setCallsPerDay(
      await calls.json()
    );

    const speedRes =
      await fetch(
        `${API}/speed-of-answer`
      );

    setSpeed(
      await speedRes.json()
    );
  }

  function exportCsv() {

    window.open(
      `${API}/export`,
      "_blank"
    );
  }

  return (
    <div className="p-8">

      <h1 className="text-3xl font-bold mb-6">
        Analytics
      </h1>

      <div className="grid grid-cols-2 gap-4 mb-6">

        <div className="border rounded p-4">
          <h2 className="font-bold">
            Speed Of Answer
          </h2>

          <p>
            Average:
            {" "}
            {speed.average}
            s
          </p>

          <p>
            Median:
            {" "}
            {speed.median}
            s
          </p>
        </div>

        <div className="border rounded p-4">
          <h2 className="font-bold">
            Calls Per Day
          </h2>

          {
            Object.entries(
              callsPerDay
            ).map(
              ([date,count]) => (
                <div key={date}>
                  {date}: {count}
                </div>
              )
            )
          }
        </div>

      </div>

      <div className="flex gap-3 mb-4">

        <button
          onClick={() => setTab("current")}
        >
          Current
        </button>

        <button
          onClick={() => setTab("past")}
        >
          Past
        </button>

        <button
          onClick={() => setTab("missed")}
        >
          Missed
        </button>

        <button
          onClick={exportCsv}
        >
          Export CSV
        </button>

      </div>

      <table className="w-full border">

        <thead>

          <tr>

            <th>Consultant</th>

            <th>Source</th>

            <th>Queued</th>

            <th>Duration</th>

            <th>Status</th>

            <th>Reason</th>

          </tr>

        </thead>

        <tbody>

          {
            rows.map(
              (row,index) => (

                <tr key={index}>

                  <td>
                    {row.consultant}
                  </td>

                  <td>
                    {row.sourcePage}
                  </td>

                  <td>
                    {row.queuedAt}
                  </td>

                  <td>
                    {row.durationSeconds}
                  </td>

                  <td>
                    {row.status}
                  </td>

                  <td>
                    {row.endReason}
                  </td>

                </tr>
              )
            )
          }

        </tbody>

      </table>

    </div>
  );
}