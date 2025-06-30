// Artifact functionality is disabled for this constraint parser project

export function Artifact() {
  return (
    <div className="p-4 text-center text-gray-500">
      Artifacts are disabled in this constraint parser project.
    </div>
  );
}

export type ArtifactKind = 'text' | 'code' | 'image' | 'sheet';
export default Artifact;
