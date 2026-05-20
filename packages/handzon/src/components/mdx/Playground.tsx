import { Sandpack, type SandpackPredefinedTemplate } from "@codesandbox/sandpack-react";

interface Props {
  template?: SandpackPredefinedTemplate;
  files?: Record<string, string | { code: string; hidden?: boolean }>;
  dependencies?: Record<string, string>;
  height?: number;
  showConsole?: boolean;
}

export default function Playground({
  template = "react-ts",
  files,
  dependencies,
  height = 480,
  showConsole = true,
}: Props) {
  return (
    <div className="playground" style={{ height }}>
      <Sandpack
        template={template}
        files={files}
        customSetup={dependencies ? { dependencies } : undefined}
        theme="dark"
        options={{
          showConsole,
          showConsoleButton: true,
          editorHeight: height,
          editorWidthPercentage: 50,
        }}
      />
    </div>
  );
}
