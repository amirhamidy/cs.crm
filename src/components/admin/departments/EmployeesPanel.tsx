"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Users, User } from "lucide-react";
import { Department } from "./types";

interface Props {
  department: Department;
  onAddEmployee: () => void;
  onDeleteEmployee: (employeeId: string) => void;
}

export default function EmployeesPanel({ department, onAddEmployee, onDeleteEmployee }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" style={{ color: department.accent }} />
          <h3 className="text-sm font-semibold text-white">اعضا</h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${department.accent}20`, color: department.accent }}
          >
            {department.employees.length}
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAddEmployee}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-colors"
          style={{ backgroundColor: `${department.accent}20`, color: department.accent }}
        >
          <Plus className="w-3.5 h-3.5" />
          افزودن عضو
        </motion.button>
      </div>

      {department.employees.length === 0 ? (
        <div className="text-center py-8 text-white/30">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">هنوز عضوی اضافه نشده</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <AnimatePresence>
            {department.employees.map((emp) => (
              <motion.div
                key={emp.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onHoverStart={() => setHoveredId(emp.id)}
                onHoverEnd={() => setHoveredId(null)}
                className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors group relative"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${department.accent}15` }}
                >
                  <User className="w-4 h-4" style={{ color: department.accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{emp.name}</p>
                  <p className="text-xs text-white/40 truncate">{emp.role}</p>
                </div>
                <AnimatePresence>
                  {hoveredId === emp.id && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => onDeleteEmployee(emp.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
