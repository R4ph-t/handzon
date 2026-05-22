import {
  SandpackCodeEditor,
  SandpackConsole,
  SandpackLayout,
  type SandpackPredefinedTemplate,
  SandpackPreview,
  SandpackProvider,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { Sparkles } from "lucide-react";
import { dispatchAssist, useAiTool } from "../../lib/ai/assist";

interface Props {
  template?: SandpackPredefinedTemplate;
  files?: Record<string, string | { code: string; hidden?: boolean }>;
  dependencies?: Record<string, string>;
  height?: number;
  showConsole?: boolean;
  /**
   * Whether to render the "Ask AI to fix" button in the toolbar.
   * Driven by `aiConfig.tools.suggestPlaygroundEdit` on the host
   * page; the button still hides itself client-side when the tutor
   * isn't enabled.
   */
  askAiToFix?: boolean;
}

/**
 * Toolbar button rendered inside SandpackProvider so useSandpack
 * can read the *current* file contents (post-edit) at click time.
 */
function AskAiButton() {
  const toolEnabled = useAiTool("suggestPlaygroundEdit");
  const { sandpack } = useSandpack();
  if (!toolEnabled) return null;

  function onClick() {
    const files: Record<string, string> = {};
    for (const [path, entry] of Object.entries(sandpack.files)) {
      // Hidden files are author scaffolding (e.g. config) the learner
      // didn't touch — exclude them so the prompt focuses on what
      // they're actually editing.
      if (entry.hidden) continue;
      files[path] = entry.code;
    }
    dispatchAssist({ kind: "playgroundFix", files });
  }

  return (
    <button type="button" className="hz-helpme hz-playground-ask" onClick={onClick}>
      <Sparkles size={14} aria-hidden="true" />
      <span>Ask AI to fix</span>
    </button>
  );
}

export default function Playground({
  template = "react-ts",
  files,
  dependencies,
  height = 480,
  showConsole = true,
  askAiToFix = true,
}: Props) {
  return (
    <div className="playground" style={{ height }}>
      <SandpackProvider
        template={template}
        files={files}
        customSetup={dependencies ? { dependencies } : undefined}
        theme="dark"
      >
        <SandpackLayout>
          <SandpackCodeEditor style={{ height }} />
          <SandpackPreview style={{ height }} showOpenInCodeSandbox={false} />
        </SandpackLayout>
        {showConsole && <SandpackConsole />}
        {askAiToFix && (
          <div className="playground-toolbar">
            <AskAiButton />
          </div>
        )}
      </SandpackProvider>
    </div>
  );
}
