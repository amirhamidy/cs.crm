"use client";

import { useState } from "react";
import ProfileHero from "@/components/admin/profile/ProfileHero";
import ProfileQuickStats from "@/components/admin/profile/ProfileQuickStats";
import ProfileEditForm from "@/components/admin/profile/ProfileEditForm";

type Tab = "info" | "activity";

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState<Tab>("info");

    return (
        <div className="h-full flex flex-col gap-4 p-4 md:p-6">
            <ProfileHero />
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 min-h-0">
                <ProfileQuickStats />
                <ProfileEditForm
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />
            </div>
        </div>
    );
}
