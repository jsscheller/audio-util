import * as util from "./util.ts";

/**
 * Trim an audio file.
 *
 * # Examples
 *
 * ```handle
 * audio-util/trim(file = @file("sample.mp3"), start = "00:00:01", end = "00:00:03")
 * ```
 */
export async function trim(
  file: File,
  /** The start time (eg. 02:04:05). */
  start?: string,
  /** The end time (eg. 02:04:05). */
  end?: string,
  /** Instead of specifying an `end`, specify the `duration` (eg. 02:04:05). */
  duration?: string,
): Promise<File> {
  const ffmpeg = await util.initFfmpeg([file]);

  const args = ["-hide_banner"];
  if (start) args.push("-ss", start);
  if (end) {
    args.push("-to", end);
  } else if (duration) {
    args.push("-t", duration);
  }
  args.push("-i", util.inputPath(file.name));

  const outputPath = util.outputPath(file.name, {
    suffix: "-trimmed",
  });
  args.push(outputPath);

  await util.callMain(ffmpeg, args);

  return util.readFile(ffmpeg, outputPath);
}
