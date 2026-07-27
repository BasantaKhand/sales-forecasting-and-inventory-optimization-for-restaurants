import {
  HiExclamationTriangle,
  HiExclamationCircle,
  HiInformationCircle,
  HiCheckCircle,
} from "react-icons/hi2";
import { timeAgo } from "../../utils/format";

const STYLES = {
  Critical: { border: "border-red-500", badge: "bg-red-100 text-red-700", icon: HiExclamationTriangle, iconColor: "text-red-500" },
  Warning: { border: "border-orange-500", badge: "bg-orange-100 text-orange-700", icon: HiExclamationCircle, iconColor: "text-orange-500" },
  Info: { border: "border-sky-500", badge: "bg-sky-100 text-sky-700", icon: HiInformationCircle, iconColor: "text-sky-500" },
  Resolved: { border: "border-gray-400", badge: "bg-gray-100 text-gray-600", icon: HiCheckCircle, iconColor: "text-gray-400" },
};

export default function AlertCard({ alert, resolved, onDismiss, onViewItem }) {
  const style = STYLES[resolved ? "Resolved" : alert.severity] || STYLES.Info;
  const Icon = style.icon;

  return (
    <div className={`flex items-start gap-4 rounded-xl border-l-4 bg-white p-4 shadow-sm ${style.border}`}>
      <Icon className={`mt-0.5 text-2xl ${style.iconColor}`} />

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}>
            {resolved ? "Resolved" : alert.severity}
          </span>
          <span className="text-xs text-gray-400">{timeAgo(alert.timestamp)}</span>
        </div>
        <p className="mt-1 font-medium text-gray-800">{alert.message}</p>
        {alert.details && <p className="mt-0.5 text-sm text-gray-500">{alert.details}</p>}
      </div>

      <div className="flex shrink-0 gap-2">
        {alert.itemId && (
          <button
            onClick={onViewItem}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
          >
            View Item
          </button>
        )}
        {!resolved && (
          <button
            onClick={onDismiss}
            className="rounded-md bg-gray-100 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
