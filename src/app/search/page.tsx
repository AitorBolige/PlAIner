import { redirect } from "next/navigation";

// El planificador actiu és la ruta RSC /plan.
export default function SearchPage() {
  redirect("/plan");
}
