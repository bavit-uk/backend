import { every10Second } from "./Every10Second";
import { anotherCron } from "./AnotherCron";
import { ebayMessageSync } from "./EbayMessageSync";

export function initCron() {
  every10Second();
  anotherCron();
  ebayMessageSync();
}
