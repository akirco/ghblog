import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import cac from "cac";
import { RouterProvider } from "react-router";
import { router } from "./router";

function App() {
  return <RouterProvider router={router} />;
}

async function run() {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
  });
  createRoot(renderer).render(<App />);
}

if (Bun.main) {
  const cli = cac("imd");
  cli.usage("imd - Interactive Markdown Viewer in Terminal");
  cli.version("0.0.1");
  cli.help();

  const parsed = cli.parse();

  if (!parsed.options.help && !parsed.options.version) {
    run();
  }
}
