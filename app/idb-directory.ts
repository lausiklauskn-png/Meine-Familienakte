// Datentresor-Ordner auf Basis von IndexedDB.
// Wird verwendet, wenn der Browser keinen beschreibbaren Dateispeicher (OPFS mit createWritable)
// anbietet – etwa ältere Safari-Versionen auf iPhone/iPad oder eingebettete Seiten.
// Bildet genau die Teile der File-System-Access-API nach, die der Datentresor benutzt.

const DB_NAME = "mmi-browser-dateien";
const STORE = "eintraege";

type StoredEntry = {
  path: string;
  parent: string;
  name: string;
  kind: "file" | "directory";
  blob?: Blob;
  type?: string;
  lastModified?: number;
};

let databasePromise: Promise<IDBDatabase> | null = null;
function database(): Promise<IDBDatabase> {
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore(STORE, { keyPath: "path" });
        store.createIndex("parent", "parent", { unique: false });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return databasePromise;
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getEntry(path: string): Promise<StoredEntry | undefined> {
  const db = await database();
  return promisify(db.transaction(STORE).objectStore(STORE).get(path)) as Promise<StoredEntry | undefined>;
}
async function putEntry(entry: StoredEntry): Promise<void> {
  const db = await database();
  await promisify(db.transaction(STORE, "readwrite").objectStore(STORE).put(entry));
}
async function children(path: string): Promise<StoredEntry[]> {
  const db = await database();
  const list = await promisify(db.transaction(STORE).objectStore(STORE).index("parent").getAll(path)) as StoredEntry[];
  return list.sort((a, b) => a.name.localeCompare(b.name));
}
async function deleteTree(path: string): Promise<void> {
  for (const child of await children(path)) await deleteTree(child.path);
  const db = await database();
  await promisify(db.transaction(STORE, "readwrite").objectStore(STORE).delete(path));
}

const join = (parent: string, name: string) => `${parent}/${name}`;
const notFound = (name: string) => new DOMException(`„${name}“ wurde nicht gefunden.`, "NotFoundError");
const mismatch = (name: string) => new DOMException(`„${name}“ hat einen anderen Typ.`, "TypeMismatchError");
function checkName(name: string) {
  if (!name || name === "." || name === ".." || name.includes("/")) throw new TypeError(`Ungültiger Name: ${name}`);
}

type WriteChunk = Blob | BufferSource | string;
type WriteParams = { type: "write"; position?: number; data: WriteChunk } | { type: "seek"; position: number } | { type: "truncate"; size: number };

class IdbWritable {
  private parts: Blob;
  private position = 0;
  private closed = false;
  private readonly handle: IdbFileHandle;
  constructor(handle: IdbFileHandle, existing: Blob) { this.handle = handle; this.parts = existing; }

  async write(input: WriteChunk | WriteParams) {
    if (this.closed) throw new DOMException("Der Schreibstrom ist bereits geschlossen.", "InvalidStateError");
    if (typeof input === "object" && input !== null && "type" in input && !(input instanceof Blob) && typeof (input as WriteParams).type === "string" && ["write", "seek", "truncate"].includes((input as WriteParams).type)) {
      const params = input as WriteParams;
      if (params.type === "seek") { this.position = params.position; return; }
      if (params.type === "truncate") {
        this.parts = params.size <= this.parts.size ? this.parts.slice(0, params.size) : new Blob([this.parts, new Uint8Array(params.size - this.parts.size)]);
        this.position = Math.min(this.position, params.size);
        return;
      }
      if (params.position !== undefined) this.position = params.position;
      return this.writeData(params.data);
    }
    return this.writeData(input as WriteChunk);
  }

  private writeData(data: WriteChunk) {
    const chunk = data instanceof Blob ? data : new Blob([data as BlobPart]);
    const before = this.parts.slice(0, Math.min(this.position, this.parts.size));
    const gap = this.position > this.parts.size ? new Uint8Array(this.position - this.parts.size) : null;
    const after = this.parts.slice(Math.min(this.parts.size, this.position + chunk.size));
    this.parts = new Blob(gap ? [before, gap, chunk, after] : [before, chunk, after]);
    this.position += chunk.size;
  }

  async seek(position: number) { this.position = position; }
  async truncate(size: number) { await this.write({ type: "truncate", size }); }
  async close() {
    if (this.closed) return;
    this.closed = true;
    await this.handle.store(this.parts);
  }
  async abort() { this.closed = true; }
}

export class IdbFileHandle {
  readonly kind = "file" as const;
  readonly name: string;
  readonly path: string;
  private readonly parent: string;
  constructor(name: string, path: string, parent: string) { this.name = name; this.path = path; this.parent = parent; }
  async getFile(): Promise<File> {
    const entry = await getEntry(this.path);
    if (!entry || entry.kind !== "file") throw notFound(this.name);
    return new File([entry.blob || new Blob()], this.name, { type: entry.type || "", lastModified: entry.lastModified || Date.now() });
  }
  async createWritable(options: { keepExistingData?: boolean } = {}) {
    const entry = await getEntry(this.path);
    return new IdbWritable(this, options.keepExistingData && entry?.blob ? entry.blob : new Blob());
  }
  async store(blob: Blob) {
    const type = blob.type || guessType(this.name);
    await putEntry({ path: this.path, parent: this.parent, name: this.name, kind: "file", blob, type, lastModified: Date.now() });
  }
  async isSameEntry(other: unknown) { return other instanceof IdbFileHandle && other.path === this.path; }
  async queryPermission() { return "granted" as PermissionState; }
  async requestPermission() { return "granted" as PermissionState; }
}

export class IdbDirectoryHandle {
  readonly kind = "directory" as const;
  readonly name: string;
  readonly path: string;
  constructor(name: string, path: string) { this.name = name; this.path = path; }

  async getDirectoryHandle(name: string, options: { create?: boolean } = {}) {
    checkName(name);
    const path = join(this.path, name);
    const entry = await getEntry(path);
    if (entry && entry.kind !== "directory") throw mismatch(name);
    if (!entry) {
      if (!options.create) throw notFound(name);
      await putEntry({ path, parent: this.path, name, kind: "directory", lastModified: Date.now() });
    }
    return new IdbDirectoryHandle(name, path);
  }

  async getFileHandle(name: string, options: { create?: boolean } = {}) {
    checkName(name);
    const path = join(this.path, name);
    const entry = await getEntry(path);
    if (entry && entry.kind !== "file") throw mismatch(name);
    if (!entry) {
      if (!options.create) throw notFound(name);
      await putEntry({ path, parent: this.path, name, kind: "file", blob: new Blob(), type: guessType(name), lastModified: Date.now() });
    }
    return new IdbFileHandle(name, path, this.path);
  }

  async removeEntry(name: string, options: { recursive?: boolean } = {}) {
    const path = join(this.path, name);
    const entry = await getEntry(path);
    if (!entry) throw notFound(name);
    if (entry.kind === "directory" && !options.recursive && (await children(path)).length) {
      throw new DOMException(`Der Ordner „${name}“ ist nicht leer.`, "InvalidModificationError");
    }
    await deleteTree(path);
  }

  private handleFor(entry: StoredEntry): IdbDirectoryHandle | IdbFileHandle {
    return entry.kind === "directory" ? new IdbDirectoryHandle(entry.name, entry.path) : new IdbFileHandle(entry.name, entry.path, entry.parent);
  }
  async *entries(): AsyncIterableIterator<[string, IdbDirectoryHandle | IdbFileHandle]> {
    for (const entry of await children(this.path)) yield [entry.name, this.handleFor(entry)];
  }
  async *values(): AsyncIterableIterator<IdbDirectoryHandle | IdbFileHandle> {
    for (const entry of await children(this.path)) yield this.handleFor(entry);
  }
  async *keys(): AsyncIterableIterator<string> {
    for (const entry of await children(this.path)) yield entry.name;
  }
  [Symbol.asyncIterator]() { return this.entries(); }

  async isSameEntry(other: unknown) { return other instanceof IdbDirectoryHandle && other.path === this.path; }
  async resolve(possible: { path?: string }) {
    if (!possible?.path || !possible.path.startsWith(`${this.path}/`)) return possible?.path === this.path ? [] : null;
    return possible.path.slice(this.path.length + 1).split("/");
  }
  async queryPermission() { return "granted" as PermissionState; }
  async requestPermission() { return "granted" as PermissionState; }
}

function guessType(name: string) {
  const extension = name.split(".").pop()?.toLowerCase() || "";
  return ({ pdf: "application/pdf", json: "application/json", txt: "text/plain", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", csv: "text/csv", html: "text/html" } as Record<string, string>)[extension] || "";
}

/** Wurzelordner des IndexedDB-Datentresors. */
export async function idbRootDirectory(name: string): Promise<FileSystemDirectoryHandle> {
  const path = `/${name}`;
  if (!(await getEntry(path))) await putEntry({ path, parent: "", name, kind: "directory", lastModified: Date.now() });
  return new IdbDirectoryHandle(name, path) as unknown as FileSystemDirectoryHandle;
}

export const idbStorageSupported = () => typeof indexedDB !== "undefined";
