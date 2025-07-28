import wasm from "ffmpeg-wasm-audio/ffmpeg.wasm";
import worker from "out/ffmpeg.wasm.js";

const wasmUrl = new URL(wasm, import.meta.url);
const workerUrl = new URL(worker, import.meta.url);

export async function initFfmpeg(
  input: File[] | { name: string; data: Blob }[],
): Promise<any> {
  const { default: createModule } = await import(workerUrl.href);

  const opts: any = { noExitRuntime: false };
  opts.locateFile = (filename: any) => {
    return filename.endsWith(".js") ? workerUrl.href : wasmUrl.href;
  };
  const exitPromise = new Promise<void>((resolve, reject) => {
    opts.onExit = (code: number) => {
      if (code) {
        reject(new Error(`non-zero exit code: ${code}`));
      }
      resolve();
    };
  });
  const mod = await createModule(opts);
  mod.exitPromise = exitPromise;

  const inputDir = "/input";
  mod.FS.mkdir(inputDir);
  const mount = (input[0] as any)?.data ? { blobs: input } : { files: input };
  mod.FS.mount(mod.WORKERFS, mount, inputDir);

  const outputDir = "/output";
  mod.FS.mkdir(outputDir);
  mod.FS.chdir(outputDir);

  return mod;
}

export async function callMain(mod: any, args: string[]) {
  mod.callMain(args);
  await mod.exitPromise;
}

export function readFile(mod: any, path: string): File {
  const buf = mod.FS.readFile(path);
  const name = path.split("/").at(-1)!;
  return new File([buf], name);
}

export function inputPath(path: string): string {
  const name = path.split("/").at(-1)!;
  return `/input/${name}`;
}

export function outputPath(
  path: string,
  opts: { ext?: string; suffix?: string } = {},
): string {
  let name = path.split("/").at(-1)!;
  if (opts.ext) {
    name = replaceExt(name, opts.ext);
  }
  if (opts.suffix) {
    name = addSuffix(name, opts.suffix);
  }
  return `/output/${name}`;
}

export function replaceExt(name: string, ext: string): string {
  let lastDot = name.lastIndexOf(".");
  if (lastDot === -1) {
    lastDot = name.length - 1;
    ext = "." + ext;
  }
  return name.slice(0, lastDot + 1) + ext;
}

export function addSuffix(name: string, suffix: string): string {
  let stem = name;
  let ext = "";
  const lastDot = name.lastIndexOf(".");
  if (lastDot > -1) {
    stem = name.slice(0, lastDot);
    ext = name.slice(lastDot);
  }
  return `${stem}${suffix}${ext}`;
}
