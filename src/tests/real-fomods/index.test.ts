import { describe, expect, test } from "vitest";
import { parseInfoDoc, parseModuleDoc } from "../../parseDoc";
import { BlankInfoDoc, BlankModuleConfig } from "../../DomUtils";
import { fomods, getXml } from "./getXml";

// NOTE
// If getting nulls on parse, check that the XML files are encoded in UTF-16 LE
// not doing so can lead a man to insanity

describe("Basic Parse", () => {
    for (const fomod of fomods) {
        describe(fomod, () => {
            test('ModuleConfig.xml', async () => {
                const xml = await getXml(fomod, 'ModuleConfig.xml');
                const document = new DOMParser().parseFromString(xml, 'text/xml');
                const parsed = parseModuleDoc(document);
                expect(parsed).not.toBeNull();
                expect(parsed).toMatchSnapshot();
            });

            test('Info.xml', async () => {
                const xml = await getXml(fomod, 'Info.xml');
                const document = new DOMParser().parseFromString(xml, 'text/xml');
                const parsed = parseInfoDoc(document);
                //console.log({xml, document, parsed});
                expect(parsed).not.toBeNull();
                expect(parsed).toMatchSnapshot();
            });
        });
    }
});

describe("Serialize (In-Place)", () => {
    for (const fomod of fomods) {
        describe(fomod, () => {
            test('ModuleConfig.xml', async () => {
                const xml = await getXml(fomod, 'ModuleConfig.xml');
                const document = new DOMParser().parseFromString(xml, 'text/xml');
                const parsed = parseModuleDoc(document);

                expect(parsed).not.toBeNull();
                if (!parsed) return;

                const serialized = parsed.asElement(document).outerHTML;
                expect(serialized).toMatchSnapshot();
            });

            test('Info.xml', async () => {
                const xml = await getXml(fomod, 'Info.xml');
                const document = new DOMParser().parseFromString(xml, 'text/xml');
                const parsed = parseInfoDoc(document);

                expect(parsed).not.toBeNull();
                if (!parsed) return;

                const serialized = parsed.asElement(document).outerHTML;

                expect(serialized).toMatchSnapshot();
            });
        });
    }
});

describe("Serialize (New Document)", () => {
    for (const fomod of fomods) {
        describe(fomod, () => {
            test('ModuleConfig.xml', async () => {
                const xml = await getXml(fomod, 'ModuleConfig.xml');
                const document = new DOMParser().parseFromString(xml, 'text/xml');
                const parsed = parseModuleDoc(document);

                expect(parsed).not.toBeNull();
                if (!parsed) return;

                const newDocument = new DOMParser().parseFromString(BlankModuleConfig, 'text/xml');
                newDocument.replaceChild(parsed.asElement(newDocument), newDocument.documentElement);
                const serialized = new XMLSerializer().serializeToString(newDocument);

                expect(serialized).toMatchSnapshot();
            });

            test('Info.xml', async () => {
                const xml = await getXml(fomod, 'Info.xml');
                const document = new DOMParser().parseFromString(xml, 'text/xml');
                const parsed = parseInfoDoc(document);

                expect(parsed).not.toBeNull();
                if (!parsed) return;

                const newDocument = new DOMParser().parseFromString(BlankInfoDoc, 'text/xml');
                newDocument.replaceChild(parsed.asElement(newDocument), newDocument.documentElement);
                const serialized = new XMLSerializer().serializeToString(newDocument);

                expect(serialized).toMatchSnapshot();
            });
        });
    }
});

describe("Serialize (New Document, Then In-Place)", () => {
    for (const fomod of fomods) {
        describe(fomod, () => {
            test('ModuleConfig.xml', async () => {
                const xml = await getXml(fomod, 'ModuleConfig.xml');
                const document = new DOMParser().parseFromString(xml, 'text/xml');
                const parsed = parseModuleDoc(document);

                expect(parsed).not.toBeNull();
                if (!parsed) return;

                const newDocument = new DOMParser().parseFromString(BlankModuleConfig, 'text/xml');
                newDocument.replaceChild(parsed.asElement(newDocument), newDocument.documentElement);
                const serialized = new XMLSerializer().serializeToString(newDocument);

                expect(serialized).toMatchSnapshot();

                newDocument.replaceChild(parsed.asElement(newDocument), newDocument.documentElement);
                const serialized2 = new XMLSerializer().serializeToString(newDocument);
                expect(serialized2).toBe(serialized);
            });

            test('Info.xml', async () => {
                const xml = await getXml(fomod, 'Info.xml');
                const document = new DOMParser().parseFromString(xml, 'text/xml');
                const parsed = parseInfoDoc(document);

                expect(parsed).not.toBeNull();
                if (!parsed) return;

                const newDocument = new DOMParser().parseFromString(BlankInfoDoc, 'text/xml');
                newDocument.replaceChild(parsed.asElement(newDocument), newDocument.documentElement);
                const serialized = new XMLSerializer().serializeToString(newDocument);

                expect(serialized).toMatchSnapshot();

                newDocument.replaceChild(parsed.asElement(newDocument), newDocument.documentElement);
                const serialized2 = new XMLSerializer().serializeToString(newDocument);
                expect(serialized2).toBe(serialized);
            });
        });
    }
});
