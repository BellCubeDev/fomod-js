import { describe, expect, test } from "vitest";
import { parseInfoDoc, parseModuleDoc } from "./parseDoc";

describe('Returns Null Trying To Parse Invalid Document', () => {
    test('parseModuleDoc', async () => {
        const doc = new DOMParser().parseFromString('<invalid></invalid>', 'application/xml');
        expect(parseModuleDoc(doc)).toBeNull();
    });

    test('parseInfoDoc', async () => {
        const doc = new DOMParser().parseFromString('<invalid></invalid>', 'application/xml');
        expect(parseInfoDoc(doc)).toBeNull();
    });
});

describe('Returns Null Trying To Parse Empty Document', () => {
    test('parseModuleDoc', async () => {
        const doc = new DOMParser().parseFromString('', 'application/xml');
        expect(parseModuleDoc(doc)).toBeNull();
    });

    test('parseInfoDoc', async () => {
        const doc = new DOMParser().parseFromString('', 'application/xml');
        expect(parseInfoDoc(doc)).toBeNull();
    });
});
