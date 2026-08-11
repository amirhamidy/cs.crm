"use client"

import { Paperclip, Trash2 } from "lucide-react"
import type { FileUploaderProps } from "@/types/task"

export default function FileUploader({
    files,
    onChange,
    disabled = false,
}: FileUploaderProps) {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextFiles = Array.from(event.target.files || [])
        onChange([...files, ...nextFiles])
    }

    const removeFile = (index: number) => {
        onChange(files.filter((_, fileIndex) => fileIndex !== index))
    }

    return (
        <div className="space-y-3">
            <label className="block text-sm text-white/70">فایل‌ها</label>
            <label className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-4xl border border-dashed border-white/15 bg-white/5 px-4 text-sm text-white/80 transition hover:border-blue-500/40 hover:bg-blue-500/5">
                <Paperclip size={18} />
                <span>انتخاب فایل</span>
                <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    disabled={disabled}
                    className="hidden"
                />
            </label>

            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((file, index) => (
                        <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-4 py-3"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm text-white">{file.name}</p>
                                <p className="text-xs text-white/50">
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="flex h-10 w-10 items-center justify-center rounded-full text-red-400 transition hover:bg-red-500/10"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
