import type {
    BringerStat, DepartmentStat, EmployeeOverallStat, StageRankItem, Summary,
} from "@/hooks/useAnalytics";

export interface Props {
    departments: DepartmentStat[];
    bestEmployees: EmployeeOverallStat[];
    weakestEmployees: EmployeeOverallStat[];
    topBringers: BringerStat[];
    topSoldStages: StageRankItem[];
    topCompletedStages: StageRankItem[];
    topInProgressStages: StageRankItem[];
    topCancelledStages: StageRankItem[];
    summary: Summary;
    loading: boolean;
}
