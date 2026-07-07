import { Download, FileText, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { SurveyFilters, SurveyPdfFile } from "@snz-rodoved/shared";
import { deletePdfFile, downloadPdfFile, listPdfFiles, uploadPdfFile } from "../api/client";

interface PdfArchiveProps {
  filters: SurveyFilters;
  mode: "data" | "manager";
  onOpenManager?: () => void;
}

const pdfNamePattern = /^\d{8}_анкеты\.pdf$/u;

export function PdfArchive({ filters, mode, onOpenManager }: PdfArchiveProps) {
  const [files, setFiles] = useState<SurveyPdfFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const refreshFiles = useCallback(async () => {
    setLoading(true);
    try {
      setFiles(await listPdfFiles(filters));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void refreshFiles();
  }, [refreshFiles]);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    if (!selectedFile) {
      setStatus("Выберите PDF-файл.");
      return;
    }

    if (!pdfNamePattern.test(displayName.trim())) {
      setStatus("Имя должно быть в формате ггггммдд_анкеты.pdf.");
      return;
    }

    setUploading(true);
    try {
      await uploadPdfFile({ displayName: displayName.trim(), file: selectedFile });
      setDisplayName("");
      setSelectedFile(null);
      setFileInputKey((key) => key + 1);
      setStatus("PDF загружен.");
      await refreshFiles();
    } catch {
      setStatus("Не удалось загрузить PDF. Проверьте имя файла и попробуйте снова.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(file: SurveyPdfFile) {
    setBusyId(file.id);
    setStatus(null);
    try {
      await downloadPdfFile(file);
    } catch {
      setStatus("Не удалось скачать PDF.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(file: SurveyPdfFile) {
    const confirmed = window.confirm(
      `Удалить PDF «${file.displayName}»? Внесённые в базу анкеты останутся на месте.`
    );

    if (!confirmed) {
      return;
    }

    setBusyId(file.id);
    setStatus(null);
    try {
      await deletePdfFile(file.id);
      setStatus("PDF удалён.");
      await refreshFiles();
    } catch {
      setStatus("Не удалось удалить PDF.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="pdf-panel" aria-label="PDF-архив">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">PDF-архив</p>
          <h2>{mode === "manager" ? "Сканы бумажных анкет" : "PDF за выбранный период"}</h2>
        </div>
        {mode === "data" && onOpenManager ? (
          <button className="ghost-button" type="button" onClick={onOpenManager}>
            <FileText aria-hidden size={18} />
            Открыть архив
          </button>
        ) : null}
      </div>

      {mode === "manager" ? (
        <form className="pdf-upload-form" onSubmit={handleUpload}>
          <label>
            Имя файла
            <input
              placeholder="20260517_анкеты.pdf"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </label>
          <label>
            PDF-файл
            <input
              accept="application/pdf,.pdf"
              key={fileInputKey}
              type="file"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setSelectedFile(nextFile);
                if (nextFile && !displayName) {
                  setDisplayName(nextFile.name);
                }
              }}
            />
          </label>
          <button className="primary-button" disabled={uploading} type="submit">
            <Upload aria-hidden size={18} />
            {uploading ? "Загрузка..." : "Загрузить PDF"}
          </button>
        </form>
      ) : null}

      {status ? <p className="data-status">{status}</p> : null}

      <div className="pdf-list">
        {loading ? <p className="skeleton">Загрузка PDF...</p> : null}
        {!loading && files.length === 0 ? (
          <p className="table-note">
            {mode === "manager" ? "PDF-файлов пока нет." : "PDF-файлов за выбранный период нет."}
          </p>
        ) : null}
        {files.map((file) => (
          <article className="pdf-file-row" key={file.id}>
            <div>
              <strong>{file.displayName}</strong>
              <span>
                {file.surveyDate} · {formatBytes(file.sizeBytes)}
              </span>
            </div>
            <div className="pdf-file-actions">
              <button
                className="ghost-button"
                disabled={busyId === file.id}
                onClick={() => handleDownload(file)}
                type="button"
              >
                <Download aria-hidden size={18} />
                Скачать
              </button>
              {mode === "manager" ? (
                <button
                  className="ghost-button danger-button"
                  disabled={busyId === file.id}
                  onClick={() => handleDelete(file)}
                  type="button"
                >
                  <Trash2 aria-hidden size={18} />
                  Удалить
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} Б`;
  }

  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} КБ`;
  }

  return `${(kilobytes / 1024).toFixed(1)} МБ`;
}
