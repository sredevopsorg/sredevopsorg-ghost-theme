/**
 * Audio assembly for the TTS player's download button.
 *
 * Cloud TTS answers one MP3 per `text:synthesize` call, so a whole article is a
 * sequence of Blobs, each played in order by the island. The download button
 * hands the reader the article as **one** file, and the cheapest correct way to
 * do that is to concatenate the bytes: every chunk comes from the same voice
 * and the same request settings, so the encoder output is one continuous frame
 * stream without ID3 tags. Concatenating frames is exactly what an MP3 player
 * expects, and it costs no decoding or re-encoding work in the browser (an
 * article is a few megabytes).
 *
 * Two limits of that shortcut are worth knowing when something "looks wrong":
 *
 *  - It relies on every chunk having identical encoder settings. They do, as
 *    long as the island uses one voice and one `audioConfig` for all chunks;
 *    mixing voices or encodings mid-article would not be a valid stream.
 *  - There is no duration metadata, so a player learns the length by reading
 *    frames. Seeking still works; the player may show the length a moment after
 *    opening the file.
 *
 * If the platform ever needs a single encode regardless of chunk settings, the
 * replacement is decoding each chunk with Web Audio and writing one WAV — larger
 * and much slower, but independent of the chunks' settings.
 *
 * Kept free of DOM and network access so the assembly is unit tested in Node.
 */

/**
 * Concatenate audio Blobs in order into one Blob of `mimeType`.
 *
 * Parts are read sequentially rather than with `Promise.all`, so a long article
 * never holds every chunk in memory twice.
 */
export async function concatAudioBlobs(parts, mimeType = "audio/mpeg") {
  const buffers = [];
  for (const part of parts ?? []) {
    if (!part) continue;
    buffers.push(new Uint8Array(await part.arrayBuffer()));
  }
  return new Blob(buffers, { type: mimeType });
}
