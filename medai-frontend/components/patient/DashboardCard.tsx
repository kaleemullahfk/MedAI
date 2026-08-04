interface Props {
  title: string;
  value: string;
}

export default function DashboardCard({
  title,
  value,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-8">
      <p className="text-gray-500">{title}</p>

      <h2 className="text-5xl font-bold mt-5">
        {value}
      </h2>
    </div>
  );
}