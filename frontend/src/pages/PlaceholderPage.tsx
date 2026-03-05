type PlaceholderPageProps = {
  title: string;
};

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="rounded-2xl border border-[#EAD6C0] bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-[#4B2E2B]">{title}</h2>
      <p className="mt-2 text-sm text-[#7C5D58]">
        This section is ready in the layout and navigation. Dashboard is fully implemented with static
        mock data.
      </p>
    </div>
  );
}
