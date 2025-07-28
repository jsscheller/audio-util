import * as util from "./util.ts";

export enum Format {
  Aac = "aac",
  Aiff = "aiff",
  Flac = "flac",
  M4a = "m4a",
  Mmf = "mmf",
  Mp3 = "mp3",
  Ogg = "ogg",
  Opus = "opus",
  Wav = "wav",
  Wma = "wma",
}

export type Codec =
  | AacCodec
  | PcmS16beCodec
  | PcmS24beCodec
  | PcmS32beCodec
  | PcmS16leCodec
  | PcmS24leCodec
  | PcmS32leCodec
  | FlacCodec
  | AlacCodec
  | AdpcmYamahaCodec
  | Libmp3lameCodec
  | LibvorbisCodec
  | LibopusCodec
  | Wmav2Codec;
export enum CodecType {
  Aac = "aac",
  PcmS16be = "pcm_s16be",
  PcmS24be = "pcm_s24be",
  PcmS32be = "pcm_s32be",
  Flac = "flac",
  Alac = "alac",
  AdpcmYamaha = "adpcm_yamaha",
  Libmp3lame = "libmp3lame",
  Libvorbis = "libvorbis",
  Libopus = "libopus",
  PcmS16le = "pcm_s16le",
  PcmS24le = "pcm_s24le",
  PcmS32le = "pcm_s32le",
  Wmav2 = "wmav2",
}

export type AacCodec = {
  type: CodecType.Aac;
  /**
   * Quality level (0.1-2). Default: 0.5. Higher values result in better quality
   * and larger files.
   */
  quality?: number;
};

export type PcmS16beCodec = {
  type: CodecType.PcmS16be;
};

export type PcmS24beCodec = {
  type: CodecType.PcmS24be;
};

export type PcmS32beCodec = {
  type: CodecType.PcmS32be;
};

export type PcmS16leCodec = {
  type: CodecType.PcmS16le;
};

export type PcmS24leCodec = {
  type: CodecType.PcmS24le;
};

export type PcmS32leCodec = {
  type: CodecType.PcmS32le;
};

export type FlacCodec = {
  type: CodecType.Flac;
  /**
   * Compression level (0-12). Default: 5. Higher values result in better
   * compression and slower encoding.
   */
  compression?: number;
};

export type AlacCodec = {
  type: CodecType.Alac;
};

export type AdpcmYamahaCodec = {
  type: CodecType.AdpcmYamaha;
};

export type Libmp3lameCodec = {
  type: CodecType.Libmp3lame;
  /**
   * Quality level (0-9). Default: 4. Lower values result in better quality and
   * larger files.
   */
  quality?: number;
  /**
   * Compression level (0-9). Default: 5. Higher values result in slower
   * encoding.
   */
  compression?: number;
};

export type LibvorbisCodec = {
  type: CodecType.Libvorbis;
  /**
   * Quality level (-1-10). Default: 3. Higher values result in better quality
   * and larger files.
   */
  quality?: number;
};

export type LibopusCodec = {
  type: CodecType.Libopus;
  /** Enable/disable Variable Bit Rate encoding. Default: `On`. */
  vbr?: VariableBitRate;
  /**
   * Compression level (0-10). Default: 10. Higher values result in better
   * compression and slower encoding.
   */
  compression?: number;
  /** Frame duration in ms. Default: 20. Choices: 2.5, 5, 10, 20, 40, 60. */
  frameDuration?: number;
};

export enum VariableBitRate {
  On = "on",
  Off = "off",
  Constrained = "constrained",
}

export type Wmav2Codec = {
  type: CodecType.Wmav2;
  /**
   * Quality level (0-100). Default: 50. Higher values result in better quality
   * and larger files.
   */
  quality?: number;
};

/**
 * Convert between audio formats.
 *
 * # Examples
 *
 * ```handle
 * audio-util/convert(file = @file("sample.mp3"), format = /Aac)
 * ```
 */
export async function convert(
  file: File,
  format: Format,
  codec?: Codec,
  bitrate?: number,
  sampleRate?: number,
): Promise<File> {
  const ffmpeg = await util.initFfmpeg([file]);

  const args = ["-hide_banner", "-i", util.inputPath(file.name)];
  pushFormatArgs({ format, codec, bitrate, sampleRate }, args);

  const outputPath = util.outputPath(file.name, { ext: format });
  args.push(outputPath);

  await util.callMain(ffmpeg, args);

  return util.readFile(ffmpeg, outputPath);
}

function pushFormatArgs(
  opts: {
    format: Format;
    codec?: Codec;
    sampleRate?: number;
    bitrate?: number;
  },
  args: string[],
) {
  const codec = opts.codec ? opts.codec.type : defaultCodec(opts.format);
  args.push("-c:a", codec);

  if (opts.bitrate) {
    args.push("-b:a", `${opts.bitrate}k`);
  }
  if (opts.sampleRate) {
    args.push("-ar", opts.sampleRate.toString());
  }

  const codecOpts = opts.codec as any;
  if (codecOpts) {
    if (codecOpts.quality) {
      args.push("-q:a", codecOpts.quality.toString());
    }
    if (codecOpts.compression) {
      args.push("-compression_level", codecOpts.compression.toString());
    }
    if (codecOpts.vbr) {
      args.push("-vbr", codecOpts.vbr);
    }
    if (codecOpts.frameDuration) {
      args.push("-frame_duration", codecOpts.frameDuration.toString());
    }
  }
}

function defaultCodec(format: Format): string {
  switch (format) {
    case Format.Aac:
      return "aac";
    case Format.Aiff:
      return "pcm_s16be";
    case Format.Flac:
      return "flac";
    case Format.M4a:
      return "aac";
    case Format.Mmf:
      return "adpcm_yamaha";
    case Format.Mp3:
      return "libmp3lame";
    case Format.Ogg:
      return "libvorbis";
    case Format.Opus:
      return "libopus";
    case Format.Wav:
      return "pcm_s16le";
    case Format.Wma:
      return "wmav2";
  }
}
