import ProcessesView from "../ProcessesView";

export default async function ProcessTabPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProcessesView id={id} />;
}
