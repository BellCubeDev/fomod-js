import fs from 'fs/promises';
import url from 'node:url';
import path from 'node:path';

const folder = path.dirname(url.fileURLToPath(import.meta.url));
export const fomods = await fs.readdir(folder, {withFileTypes: true}).then(files => files.filter(f => f.isDirectory() && !f.name.startsWith('_')).map(f => f.name));

const filesCache = new Map<string, string>();
export async function getXml(fomod: string, file: string): Promise<string> {
    const key = `${fomod}/${file}`;
    const cached = filesCache.get(key);
    if (cached !== undefined) {
        return cached;
    }

    const xml = await fs.readFile(path.join(folder, fomod, file), 'utf16le');
    filesCache.set(key, xml);
    return xml;
}

export function getSnapshotFileName(fomod: string, file: string, testId: Lowercase<string>, extraFileType: `.${Lowercase<string>}` | null): string {
    return path.join(folder, fomod, '___snapshots___', file, `${testId}${extraFileType ?? ''}.snap`);
}
