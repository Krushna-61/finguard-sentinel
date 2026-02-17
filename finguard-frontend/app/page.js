"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import toast, { Toaster } from "react-hot-toast";

export default function Page() {
  const [dark, setDark] = useState(true);
  const [risk, setRisk] = useState(65);
  const [hallucination, setHallucination] = useState(false);
  const [pii, setPii] = useState(0);
  const [section, setSection] = useState("dashboard");
  const [driftData, setDriftData] = useState([
    { name: "T1", drift: 0.03 },
    { name: "T2", drift: 0.05 },
    { name: "T3", drift: 0.06 },
    { name: "T4", drift: 0.04 },
  ]);

  /* ------------------ GOVERNANCE LOGIC ------------------ */

  const clampRisk = (value) => {
    return Math.max(0, Math.min(100, value));
  };

  const simulateDrift = () => {
    const newDrift = Number((Math.random() * 0.08).toFixed(3));

    setDriftData((prev) => [
      ...prev.slice(1),
      { name: `T${prev.length + 1}`, drift: newDrift },
    ]);

    setRisk((prev) => clampRisk(prev + 5));
    toast("Drift anomaly detected");
  };

  const triggerHallucination = () => {
    setHallucination(true);
    setRisk((prev) => clampRisk(prev + 15));
    toast.error("Hallucination detected");
  };

  const simulatePII = () => {
    setPii((prev) => prev + 1);
    setRisk((prev) => clampRisk(prev + 10));
    toast.error("PII Exposure detected");
  };

  const complianceStatus =
    risk < 70 ? "Stable" : risk < 90 ? "Elevated" : "Critical";

  /* ------------------ THEME COLORS ------------------ */

  const bgMain = dark ? "#0f172a" : "#f4f6f9";
  const cardBg = dark ? "#1e293b" : "#ffffff";
  const textColor = dark ? "#ffffff" : "#111111";
  const sidebarBg = dark ? "#0b1320" : "#ffffff";

  const buttonStyle = (color) => ({
    padding: "10px 18px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    color: "#fff",
    background: color,
    marginRight: 12,
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: bgMain }}>
      <Toaster />

      {/* ------------------ SIDEBAR ------------------ */}
      <div
        style={{
          width: "220px",
          background: sidebarBg,
          color: textColor,
          padding: "20px",
          borderRight: dark ? "none" : "1px solid #ddd",
        }}
      >
        <h2 style={{ marginBottom: 30 }}>FinGuard</h2>

        <div
          style={{ marginBottom: 15, cursor: "pointer" }}
          onClick={() => setSection("dashboard")}
        >
          Dashboard
        </div>

        <div
          style={{ marginBottom: 15, cursor: "pointer" }}
          onClick={() => setSection("monitoring")}
        >
          Monitoring
        </div>

        <div
          style={{ marginBottom: 15, cursor: "pointer" }}
          onClick={() => setSection("reports")}
        >
          Reports
        </div>

        <button
          style={{
            marginTop: 20,
            padding: 10,
            width: "100%",
            background: "#2563eb",
            border: "none",
            color: "#fff",
            borderRadius: 6,
            cursor: "pointer",
          }}
          onClick={() => setDark(!dark)}
        >
          Toggle Theme
        </button>
      </div>

      {/* ------------------ MAIN ------------------ */}
      <div style={{ flex: 1, padding: 30, color: textColor }}>
        <h1>AI Governance Control Room</h1>

        {/* DASHBOARD */}
        {section === "dashboard" && (
          <>
            {/* Risk Card */}
            <div
              style={{
                background: cardBg,
                padding: 20,
                borderRadius: 10,
                marginTop: 20,
                border:
                  complianceStatus === "Critical"
                    ? "2px solid red"
                    : complianceStatus === "Elevated"
                      ? "2px solid orange"
                      : "none",
              }}
            >
              <h3>Enterprise Risk Index</h3>
              <h1
                style={{
                  color:
                    complianceStatus === "Critical"
                      ? "red"
                      : complianceStatus === "Elevated"
                        ? "orange"
                        : textColor,
                }}
              >
                {risk}
              </h1>
              <p>Status: {complianceStatus}</p>
            </div>

            {/* Drift Graph */}
            <div
              style={{
                background: cardBg,
                marginTop: 20,
                padding: 20,
                borderRadius: 10,
                height: 300,
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={driftData}>
                  <CartesianGrid stroke={dark ? "#334155" : "#ddd"} />
                  <XAxis dataKey="name" stroke={textColor} />
                  <YAxis stroke={textColor} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="drift"
                    stroke="#3b82f6"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Controls */}
            <div style={{ marginTop: 20 }}>
              <button onClick={simulateDrift} style={buttonStyle("#2563eb")}>
                Simulate Drift
              </button>

              <button
                onClick={triggerHallucination}
                style={buttonStyle("#d97706")}
              >
                Trigger Hallucination
              </button>

              <button onClick={simulatePII} style={buttonStyle("#dc2626")}>
                Simulate PII Leak
              </button>
            </div>
          </>
        )}

        {/* MONITORING */}
        {section === "monitoring" && (
          <div style={{ marginTop: 30 }}>
            <h3>Live Risk Monitoring</h3>
            <p>Current Risk Score: {risk}</p>
            <p>Hallucination Status: {hallucination ? "Detected" : "None"}</p>
            <p>PII Incidents: {pii}</p>
            <p>Latest Drift Score: {driftData[driftData.length - 1].drift}</p>
          </div>
        )}

        {/* REPORTS */}
        {section === "reports" && (
          <div style={{ marginTop: 30 }}>
            <h3>Governance Snapshot Report</h3>
            <p>Risk Index: {risk}</p>
            <p>Compliance Level: {complianceStatus}</p>
            <p>Total PII Incidents: {pii}</p>
            <p>Hallucination Events: {hallucination ? 1 : 0}</p>
          </div>
        )}
      </div>
    </div>
  );
}
