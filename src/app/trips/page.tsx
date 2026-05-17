import { redirect } from "next/navigation";

// Els viatges es gestionen dins de plainer-mvp.html (desats via /api/trips).
export default function TripsPage() {
  redirect("/plainer-mvp.html");
}
