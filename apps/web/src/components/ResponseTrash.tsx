import { ArchiveRestore } from "lucide-react";
import { useState } from "react";
import { responseSourceLabels, type SurveyResponse } from "@snz-rodoved/shared";
import { restoreResponse } from "../api/client";

interface ResponseTrashProps {
  responses: SurveyResponse[];
  onRestored: () => void;
}

export function ResponseTrash({ responses, onRestored }: ResponseTrashProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleRestore(response: SurveyResponse) {
    setBusyId(response.id);
    setStatus(null);
    try {
      await restoreResponse(response.id);
      setStatus("Анкета восстановлена.");
      onRestored();
    } catch {
      setStatus("Не удалось восстановить анкету.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <details className="trash-details">
      <summary>
        <ArchiveRestore aria-hidden size={18} />
        Корзина
        <span>{responses.length}</span>
      </summary>
      <div className="trash-content">
        {status ? <p className="data-status" role="status">{status}</p> : null}
        {responses.length === 0 ? (
          <p className="table-note">Удалённых анкет нет.</p>
        ) : (
          <div className="trash-list">
            {responses.map((response) => (
              <div className="trash-row" key={response.id}>
                <div>
                  <strong>{response.surveyDate}</strong>
                  <span>
                    {responseSourceLabels[response.source]}
                    {response.isFake ? " · фейковая" : " · реальная"}
                    {response.deletedAt ? ` · удалена ${formatDateTime(response.deletedAt)}` : ""}
                  </span>
                </div>
                <button
                  className="ghost-button"
                  disabled={busyId !== null}
                  onClick={() => handleRestore(response)}
                  type="button"
                >
                  <ArchiveRestore aria-hidden size={18} />
                  {busyId === response.id ? "Восстановление..." : "Восстановить"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
