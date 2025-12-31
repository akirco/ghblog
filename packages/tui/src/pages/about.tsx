import { TextAttributes } from "@opentui/core";

function About() {
  return (
    <box flexDirection="column" flexGrow={1}>
      <text fg="cyan" attributes={TextAttributes.BOLD} marginBottom={1}>
        About
      </text>
      <text>
        This is a terminal application built with OpenTUI and React Router.
      </text>
    </box>
  );
}

export default About;
