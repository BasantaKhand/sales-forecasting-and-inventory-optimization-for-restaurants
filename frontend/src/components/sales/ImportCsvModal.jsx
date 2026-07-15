import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { HiArrowUpTray, HiDocumentText } from "react-icons/hi2";
import Modal from "../common/Modal";
import api from "../../services/api";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// Modal to upload a CSV file to the import endpoint.
export default function ImportCsvModal({ open, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  function pickFile(f) {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a .csv file");
      return;
    }
    setError("");
    setFile(f);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0]);
  }

  async function handleImport() {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post("/sales/import-csv", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });
      toast.success(data.message || "Import complete");
      setFile(null);
      onImported?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Import failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleClose() {
    if (uploading) return;
    setFile(null);
    setError("");
    onClose();
  }

  return (
    <Modal open={open} title="Import Sales CSV" onClose={handleClose}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragOver ? "border-accent bg-orange-50" : "border-gray-300 bg-gray-50"
        }`}
      >
        <HiArrowUpTray className="mb-2 text-3xl text-gray-400" />
        <p className="text-sm text-gray-600">
          Drop CSV file here or <span className="text-accent">click to browse</span>
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
      </div>

      {file && (
        <div className="mt-4 flex items-center gap-3 rounded-md border bg-white p-3">
          <HiDocumentText className="text-xl text-accent" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-gray-800">{file.name}</p>
            <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={handleClose}
          disabled={uploading}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleImport}
          disabled={!file || uploading}
          className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {uploading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          {uploading ? "Importing..." : "Import"}
        </button>
      </div>
    </Modal>
  );
}
