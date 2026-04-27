import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { OnboardingWizard } from "@/app/onboarding/OnboardingWizard";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");
  return <OnboardingWizard />;
}

