import DataTable from "../common/DataTable";
import { formatDate, formatNumber } from "../../utils/format";

// Tabular view of the predicted values with confidence bounds.
export default function ForecastTable({ result }) {
  const rows = (result.dates || []).map((d, i) => ({
    id: d,
    date: d,
    predicted: result.predictions[i],
    lower: result.lower_bound[i],
    upper: result.upper_bound[i],
    model: result.model_used,
  }));

  const columns = [
    { key: "date", label: "Date", render: (r) => formatDate(r.date) },
    { key: "predicted", label: "Predicted", render: (r) => formatNumber(r.predicted) },
    { key: "lower", label: "Lower Bound", render: (r) => formatNumber(r.lower) },
    { key: "upper", label: "Upper Bound", render: (r) => formatNumber(r.upper) },
    { key: "model", label: "Model", render: (r) => r.model?.toUpperCase() },
  ];

  return (
    <div>
      <h3 className="mb-3 font-semibold text-gray-800">Predicted Values</h3>
      <DataTable columns={columns} data={rows} emptyMessage="No predictions" />
    </div>
  );
}
