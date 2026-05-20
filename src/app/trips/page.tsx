import { redirect } from "next/navigation";

// Els viatges es gestionen dins de plainer-mvp.html (desats via /api/trips).
// Land on the trips tab directly so /trips works as a deep-link.
export default function TripsPage() {
  redirect("/plainer-mvp.html?tab=trips");
}
