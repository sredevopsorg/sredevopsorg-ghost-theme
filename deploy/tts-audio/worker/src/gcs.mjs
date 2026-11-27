/**
 * GCS I/O for generated audio.
 *
 * Uses `@google-cloud/storage` with the service-account key mounted at
 * `GOOGLE_APPLICATION_CREDENTIALS`. The bucket grants `allUsers` objectViewer, so
 * reads never touch this module — only the job writes, and only under `audio/`.
 *
 * `cacheControl` is set per object at upload time: the object name contains the
 * content hash, so it can never change under the same URL and can be cached forever.
 * The lifecycle rule (README) is what eventually removes superseded objects.
 */

/** How long a browser or Cloudflare may hold one object. It is immutable. */
export const CACHE_CONTROL = "public, max-age=31536000, immutable";

let storageClient = null;

/** Lazily construct the client so unit tests never need GCS credentials. */
async function defaultBucket() {
  if (!storageClient) {
    const { Storage } = await import("@google-cloud/storage");
    storageClient = new Storage();
  }
  return storageClient;
}

export class GcsStore {
  /**
   * @param {object} options
   * @param {string} options.bucket        bucket name from the ConfigMap
   * @param {object} [options.client]      injected `@google-cloud/storage` client (tests)
   * @param {Function} [options.log]
   */
  constructor({ bucket, client, log = () => {} }) {
    if (!bucket) throw new Error("GcsStore requires a bucket name");
    this.bucketName = bucket;
    this.client = client ?? null;
    this.log = log;
  }

  async file(path) {
    const storage = this.client ?? (await defaultBucket());
    return storage.bucket(this.bucketName).file(path);
  }

  /**
   * Upload bytes with immutable caching. `resumable: false` because a post is < 10 MB.
   *
   * `downloadName` is what the reader's save dialog names the file. It matters because
   * the theme links the CDN URL directly: browsers ignore a same-page `download`
   * attribute on a cross-origin URL, so `Content-Disposition` is the only way to control
   * the saved name. `inline` for playback plus `filename` for saving gives both.
   */
  async upload(path, buffer, { downloadName } = {}) {
    const target = await this.file(path);
    await target.save(buffer, {
      resumable: false,
      contentType: "audio/mpeg",
      metadata: {
        // Both spellings: the JSON API and the XML API read different fields, and
        // only one of them survives every client version.
        cacheControl: CACHE_CONTROL,
        contentDisposition: downloadName
          ? `inline; filename="${String(downloadName).replace(/[^\w.-]+/g, "-")}"`
          : "inline",
      },
    });
    this.log(`uploaded gs://${this.bucketName}/${path} (${buffer.length} bytes)`);
    return { path, bucket: this.bucketName, bytes: buffer.length };
  }

  /** Does the object exist? Cheaper than a metadata read for the skip check. */
  async exists(path) {
    const [found] = await (await this.file(path)).exists();
    return found;
  }

  /** Delete one object; a missing object is not an error. */
  async remove(path) {
    try {
      await (await this.file(path)).delete({ ignoreNotFound: true });
      return true;
    } catch (err) {
      this.log(`could not delete ${path}: ${err.message}`);
      return false;
    }
  }

  /**
   * Delete every object under a prefix (`audio/<postId>/`).
   *
   * Best effort: a delete webhook must not fail because GCS had a bad minute. The
   * lifecycle rule is the backstop, and an orphaned object costs a few hundred kB.
   */
  async removePrefix(prefix) {
    const storage = this.client ?? (await defaultBucket());
    const bucket = storage.bucket(this.bucketName);
    const [files] = await bucket.getFiles({ prefix, autoPaginate: true });
    if (!files?.length) return 0;
    await Promise.all(files.map((entry) => entry.delete({ ignoreNotFound: true }).catch(() => null)));
    this.log(`deleted ${files.length} object(s) under ${prefix}`);
    return files.length;
  }
}
