import { EntryEditorClient } from "../../../../components/entry-editor-client";

export default async function EntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EntryEditorClient entryId={id} />;
}
