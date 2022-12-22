import { storiesOf } from "@storybook/react";
import EnterLotto from "../src/components/WriteFunctions/EnterLotto";
import CreateLotto from "../src/components/WriteFunctions/CreateLotto";
import GetWinners from "../src/components/ReadFunctions/GetWinners";

storiesOf("Lotto", module).add("Create or enter lotto.", () => (
  <div style={{ display: "flex", flexWrap: "wrap" }}>
    <CreateLotto />
    <EnterLotto />
    <GetWinners />
  </div>
));
