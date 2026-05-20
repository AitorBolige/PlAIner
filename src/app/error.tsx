"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h2>Hi ha hagut un error inesperat!</h2>
      <p style={{ marginTop: 12, color: "#555" }}>
        Si el problema persisteix, torna-ho a provar més tard.
      </p>
      {isDev && (
        <pre
          style={{
            background: "#f4f4f4",
            padding: 20,
            borderRadius: 8,
            marginTop: 20,
            overflowX: "auto",
          }}
        >
          {error.message}
          {error.digest ? `\n\ndigest: ${error.digest}` : ""}
        </pre>
      )}
      <button
        onClick={() => reset()}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          background: "black",
          color: "white",
          borderRadius: 8,
          cursor: "pointer",
          border: "none",
        }}
      >
        Tornar a provar
      </button>
    </div>
  );
}
