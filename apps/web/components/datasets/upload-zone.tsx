"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"

interface Props {
    onFileAccepted: (file: File) => void
}

export function UploadZone({
    onFileAccepted,
}: Props) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0]

        if (file) {
            onFileAccepted(file)
        }
    }, [onFileAccepted])

    const {
        getRootProps,
        getInputProps,
        isDragActive,
    } = useDropzone({
        onDrop,
        accept: {
            "text/csv": [".csv"],
            "application/vnd.ms-excel": [".xls"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                [".xlsx"],
        },
    })

    return (
        <div
            {...getRootProps()}
            className="border-2 border-dashed rounded-xl p-20 text-center cursor-pointer"
        >
            <input {...getInputProps()} />

            {isDragActive ? (
                <p>Drop file here...</p>
            ) : (
                <p>
                    Drag & drop CSV or Excel file here
                </p>
            )}
        </div>
    )
}