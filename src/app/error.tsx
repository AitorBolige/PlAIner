"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h2>Hi ha hagut un error inesperat!</h2>
      <pre style={{ background: "#f4f4f4", padding: 20, borderRadius: 8, marginTop: 20 }}>
        {error.message}
      </pre>
      <button
        onClick={() => reset()}
        style={{ marginTop: 20, padding: "10px 20px", background: "black", color: "white", borderRadius: 8, cursor: "pointer" }}
      >
        Tornar a provar
      </button>
    </div>
  );
}
