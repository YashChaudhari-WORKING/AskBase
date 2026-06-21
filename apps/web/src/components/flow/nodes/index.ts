import { StartNode } from "./StartNode";
import { MessageNode } from "./MessageNode";
import { CollectNode } from "./CollectNode";
import { ChoiceNode } from "./ChoiceNode";
import { LeadSaveNode } from "./LeadSaveNode";
import { WebhookNode } from "./WebhookNode";
import { GoogleSheetNode } from "./GoogleSheetNode";
import { EndNode } from "./EndNode";

export const nodeTypes = {
  start: StartNode,
  message: MessageNode,
  collect: CollectNode,
  choice: ChoiceNode,
  lead_save: LeadSaveNode,
  webhook: WebhookNode,
  google_sheet: GoogleSheetNode,
  end: EndNode,
};
