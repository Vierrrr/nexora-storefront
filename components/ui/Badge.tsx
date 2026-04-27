import { getStatusColor } from "@/lib/utils";

interface BadgeProps {
  status: string;
  size?: "sm" | "md";
}

export default function Badge({ status, size = "md" }: BadgeProps) {
  const colorClass = getStatusColor(status);
  return (
    <span
      className={`inline-flex items-center font-medium ring-1 ring-inset rounded-full ${colorClass} ${
        size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1"
      }`}
    >
      {status}
    </span>
  );
}
