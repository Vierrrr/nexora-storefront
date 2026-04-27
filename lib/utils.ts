export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateStr));
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-50 text-yellow-700 ring-yellow-200";
    case "validated":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "picking":
      return "bg-indigo-50 text-indigo-700 ring-indigo-200";
    case "packed":
      return "bg-purple-50 text-purple-700 ring-purple-200";
    case "shipped":
      return "bg-orange-50 text-orange-700 ring-orange-200";
    case "delivered":
      return "bg-green-50 text-green-700 ring-green-200";
    case "cancelled":
      return "bg-red-50 text-red-700 ring-red-200";
    case "return requested":
      return "bg-pink-50 text-pink-700 ring-pink-200";
    case "return approved":
      return "bg-teal-50 text-teal-700 ring-teal-200";
    default:
      return "bg-gray-50 text-gray-700 ring-gray-200";
  }
}
