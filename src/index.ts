import { config } from "./config";
import { createApp } from "./server";

const app = createApp();

app.listen(config.port, () => {
  console.log(`prashnavali listening on :${config.port}`);
});
