import { runInit } from "./commands/init";
import { runNew } from "./commands/new";
import { runSkills } from "./commands/skills";
import { runStep } from "./commands/step";

type Command = "init" | "new" | "step" | "skills";

interface ParsedArgs {
  command: Command;
  positional: string[];
  flags: { yes?: boolean };
}

const SUBCOMMANDS: ReadonlySet<Command> = new Set(["init", "new", "step", "skills"]);

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  const flags: ParsedArgs["flags"] = {};
  const positional: string[] = [];
  let command: Command = "init";

  for (const arg of args) {
    if (arg === "--yes" || arg === "-y") flags.yes = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (!arg.startsWith("-")) positional.push(arg);
  }

  // First positional MAY be a subcommand.
  if (positional[0] && SUBCOMMANDS.has(positional[0] as Command)) {
    command = positional.shift() as Command;
  }

  return { command, positional, flags };
}

function printHelp() {
  console.log(`create-handzon — scaffold and grow Handzon tutorial projects

USAGE
  create-handzon [project-name]        Scaffold a new project (default)
  create-handzon new                   Add a tutorial to the current project
  create-handzon step                  Add a step to an existing tutorial
  create-handzon skills                Install Handzon authoring skills into your AI agent

FLAGS
  --yes, -y     Skip prompts (use defaults)
  --help, -h    Show this help

EXAMPLES
  npx create-handzon my-codelab
  cd my-codelab && pnpm handzon:new
  npx create-handzon skills
`);
}

async function main() {
  const parsed = parseArgs(process.argv);
  switch (parsed.command) {
    case "init":
      await runInit({ targetName: parsed.positional[0], yes: parsed.flags.yes });
      break;
    case "new":
      await runNew({ yes: parsed.flags.yes });
      break;
    case "step":
      await runStep({ yes: parsed.flags.yes });
      break;
    case "skills":
      await runSkills({ yes: parsed.flags.yes });
      break;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
