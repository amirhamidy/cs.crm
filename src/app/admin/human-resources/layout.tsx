import HrTabs from "@/components/admin/human_resources/HrHub";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <HrTabs />
            {children}
        </div>
    );
}
