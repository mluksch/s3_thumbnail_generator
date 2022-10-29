import fs from "fs";
import { resize } from "./resize";

describe("Test resizing", () => {
  it("resizes", async () => {
    const rs = fs.createReadStream("test3.png");
    const ws = fs.createWriteStream("test3thumbsss.png");
    const s = await resize(rs);
    await new Promise<void>((resolve, reject) =>
      ws.write(s, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      })
    );
  });
});
