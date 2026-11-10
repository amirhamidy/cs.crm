"use client";

import AuthGate from "@/components/AuthGate";
import RoadMap from "@/components/hub/RoadMap";

export default function HubPage() {
  return (
    <AuthGate>
      <RoadMap />
    </AuthGate>
  );
}
