"use client";

import {
    ReportError,
    ReportLoading,
    ReportStack,
    useCaseReport,
} from "./CaseReportParts";

interface CaseReportViewProps {
    caseId: number;
}

export default function CaseReportView({ caseId }: CaseReportViewProps) {
    const { report, error, loading } = useCaseReport(caseId);

    if (loading) return <ReportLoading />;
    if (error) return <ReportError message={error} />;
    if (!report) return null;

    return <ReportStack report={report} />;
}
