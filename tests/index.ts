import { test } from "uvu";
import * as audioUtil from "../src/index.ts";

test("join", async function () {
  const input = await download("sample.mp3");
  await audioUtil.join([input, input]);
});

test("convert mp3 to aac", async function () {
  const input = await download("sample.mp3");
  await audioUtil.convert(input, audioUtil.Format.Aac);
});

test("trim", async function () {
  const input = await download("sample.mp3");
  await audioUtil.trim(input, "00:00:01", "00:00:03");
});

async function download(asset: string): Promise<File> {
  const blob = await fetch(`/assets/${asset}`).then((x) => x.blob());
  return new File([blob], asset, { type: blob.type });
}

test.run();
