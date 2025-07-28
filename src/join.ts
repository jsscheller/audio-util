import * as util from "./util.ts";

/**
 * Combine audio files of the same format into a single file.
 *
 * Note: the input files must have the same format since this function does not
 * re-encode.
 *
 * # Examples
 *
 * ```handle
 * audio-util/join(files = [@file("sample.mp3"), @file("sample.mp3")])
 * ```
 */
export async function join(files: File[]): Promise<File> {
  if (files.length === 1) {
    return files[0];
  }

  const ffmpeg = await util.initFfmpeg(
    files.map((x, i) => ({ name: `${i}`, data: x })),
  );

  const inTxt = files.map((_, i) => `file '/input/${i}'`).join("\n");
  const inTxtBuf = new TextEncoder().encode(inTxt);
  ffmpeg.FS.writeFile("in.txt", inTxtBuf);

  const ext = files[0].name.split(".").at(-1)!;
  if (!ext) throw new Error("input file is missing file extension");
  const outputPath = util.outputPath(`joined.${ext}`);
  await util.callMain(ffmpeg, [
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    "in.txt",
    "-c",
    "copy",
    outputPath,
  ]);

  return util.readFile(ffmpeg, outputPath);
}
