import PageStateCard from "../components/common/PageStateCard";

export default function PlaceholderPage({ page }) {
  return (
    <PageStateCard
      eyebrow="Page Placeholder"
      title={page.navLabel}
      description="This route is registered in the new page system, but it does not have a dataset-backed implementation yet."
    />
  );
}
