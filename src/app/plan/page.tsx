"use client";

import * as React from "react";

import { PlanProvider, usePlan } from "@/components/plan/PlanProvider";
import { BottomTabs } from "@/components/nav/BottomTabs";
import { HomeSearch } from "@/components/plan/HomeSearch";
import { GeneratingScreen } from "@/components/plan/GeneratingScreen";
import { Picker } from "@/components/plan/Picker";

function PlanFlow() {
  const { step } = usePlan();

  if (step === "generating") return <GeneratingScreen />;
  if (step === "picker") return <Picker />;

  return (
    <>
      <HomeSearch />
      <BottomTabs active="search" />
    </>
  );
}

export default function PlanPage() {
  return (
    <PlanProvider>
      <PlanFlow />
    </PlanProvider>
  );
}
