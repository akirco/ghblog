import { TextAttributes, type KeyEvent } from "@opentui/core";
import { useKeyboard, useRenderer } from "@opentui/react";
import { Outlet, useLocation, useNavigate } from "react-router";

function App() {
  const renderer = useRenderer();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle keyboard navigation
  useKeyboard((event: KeyEvent) => {
    if (event.name === "1") navigate("/");
    if (event.name === "2") navigate("/about");
    if (event.name === "3") navigate("/settings");
    if (event.name === "q") renderer.destroy();
  });

  return (
    <box
      flexDirection="column"
      flexGrow={1}
      backgroundColor={"rgba(30, 30, 30, .2)"}
    >
      {/* Header */}
      <box
        flexDirection="row"
        justifyContent="space-between"
        paddingLeft={1}
        paddingRight={1}
        borderStyle="single"
        border={["bottom"]}
      >
        <text attributes={TextAttributes.BOLD}>React Router Demo</text>
        <text attributes={TextAttributes.DIM}>
          Current: {location.pathname}
        </text>
      </box>

      {/* Main content area */}
      <box flexGrow={1} padding={1}>
        <Outlet />
      </box>

      {/* Footer navigation */}
      <box
        flexDirection="row"
        justifyContent="center"
        gap={2}
        paddingTop={1}
        paddingBottom={1}
        borderStyle="single"
        border={["top"]}
      >
        <text
          attributes={
            location.pathname === "/"
              ? TextAttributes.BOLD | TextAttributes.UNDERLINE
              : TextAttributes.NONE
          }
        >
          [1] Home
        </text>
        <text
          attributes={
            location.pathname === "/about"
              ? TextAttributes.BOLD | TextAttributes.UNDERLINE
              : TextAttributes.NONE
          }
        >
          [2] About
        </text>
        <text
          attributes={
            location.pathname === "/settings"
              ? TextAttributes.BOLD | TextAttributes.UNDERLINE
              : TextAttributes.NONE
          }
        >
          [3] Settings
        </text>
        <text attributes={TextAttributes.DIM}>[q] Quit</text>
      </box>
    </box>
  );
}

export default App;
