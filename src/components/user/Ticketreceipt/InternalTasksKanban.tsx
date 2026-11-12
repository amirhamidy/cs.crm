"use client";

import axiosInstance from "@/lib/axiosInstance";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useCurrentEmployee } from "@/hooks/usecurrentemployee";
import InternalTaskActionModal from "./InternalTaskActionModal";
import InternalTaskCard from "./InternalTaskCard";

export type TaskStatus = "todo" | "in_progress" | "done";

export interface InternalTaskAttachment {
  id: number;
  file: string;
  uploaded_at: string;
}

export interface InternalTask {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  created_by: string;
  assigned_to: number[];
  attachments: InternalTaskAttachment[];
  created_at: string;
}

type InternalTasksApiResponse =
  | InternalTask[]
  | {
      results: InternalTask[];
    };

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "todo", label: "انجام نشده" },
  { key: "in_progress", label: "در حال انجام" },
  { key: "done", label: "انجام شده" },
];

export default function InternalTasksKanban() {
  const username = useAuthStore((state) => state.username);
  const { employee, loading: employeeLoading } = useCurrentEmployee();

  const [tasks, setTasks] = useState<InternalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<InternalTask | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);

    try {
      const response = await axiosInstance.get<InternalTasksApiResponse>(
        "/tasks/api/v1/internal-tasks/",
      );

      const data = response.data;

      setTasks(Array.isArray(data) ? data : (data.results ?? []));
    } catch (error) {
      console.error("fetchTasks error:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!employee?.id) {
      return;
    }

    void fetchTasks();
  }, [employee?.id, fetchTasks]);

  const assignedTasks = tasks.filter((task) =>
    employee ? task.assigned_to.includes(employee.id) : false,
  );

  const createdTasks = tasks.filter(
    (task) =>
      task.created_by === username &&
      !(employee && task.assigned_to.includes(employee.id)),
  );

  function handleCardClick(task: InternalTask) {
    setSelectedTask(task);
    setModalOpen(true);
  }

  function handleModalClose() {
    setModalOpen(false);
    setSelectedTask(null);
  }

  async function handleModalSubmit(
    taskId: number,
    newStatus: TaskStatus,
    files: File[],
  ) {
    const previousTask = tasks.find((task) => task.id === taskId);

    if (!previousTask) {
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task,
      ),
    );

    try {
      await axiosInstance.patch(
        `/tasks/api/v1/internal-tasks/${taskId}/update/`,
        { status: newStatus },
      );

      if (files.length > 0) {
        const formData = new FormData();

        for (const file of files) {
          formData.append("file", file);
        }

        await axiosInstance.post(
          `/tasks/api/v1/internal-tasks/${taskId}/attachments/`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );
      }

      await fetchTasks();
      handleModalClose();
    } catch (error) {
      console.error("handleModalSubmit error:", error);

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId ? previousTask : task,
        ),
      );
    }
  }

  if (loading || employeeLoading || !employee || !username) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="space-y-10 p-4" dir="rtl">
      <Section
        title="محول‌شده به من"
        tasks={assignedTasks}
        onCardClick={handleCardClick}
        interactive
      />

      <Section
        title="ساخته‌شده توسط من"
        tasks={createdTasks}
        onCardClick={handleCardClick}
        interactive={false}
      />

      {selectedTask && (
        <InternalTaskActionModal
          open={modalOpen}
          task={selectedTask}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  tasks: InternalTask[];
  onCardClick: (task: InternalTask) => void;
  interactive: boolean;
}

function Section({
  title,
  tasks,
  onCardClick,
  interactive,
}: SectionProps) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-violet-300">{title}</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter(
            (task) => task.status === column.key,
          );

          return (
            <div
              key={column.key}
              className="rounded-4xl bg-white/5 p-4 backdrop-blur-sm"
            >
              <p className="mb-3 text-sm font-medium text-white/60">
                {column.label}
              </p>

              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <InternalTaskCard
                    key={task.id}
                    task={task}
                    interactive={interactive}
                    onClick={() => {
                      if (interactive) {
                        onCardClick(task);
                      }
                    }}
                  />
                ))}

                {columnTasks.length === 0 && (
                  <p className="text-center text-xs text-white/30">خالی</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
