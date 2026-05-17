import { redirect } from "next/navigation";

// L'app activa és plainer-mvp.html (flux amb mapes, RouteModal i transport).
export default function SearchPage() {
  redirect("/plainer-mvp.html");
}
