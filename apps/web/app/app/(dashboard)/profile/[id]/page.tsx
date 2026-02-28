import ProfileByIdContent from "./ProfileByIdContent";

export function generateStaticParams(): { id: string }[] {
  return [{ id: "placeholder" }];
}

export default function ProfileByIdPage() {
  return <ProfileByIdContent />;
}
