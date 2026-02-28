import SpaceDetailContent from "./SpaceDetailContent";

export function generateStaticParams(): { id: string }[] {
  return [{ id: "placeholder" }];
}

export default function SpaceDetailPage() {
  return <SpaceDetailContent />;
}
