import { DefaultInfoSchema, FomodInfo, FomodInfoData, XmlNamespaces } from "../../src";
import { parseTag, testValidity } from "../testUtils";

const sampleData: FomodInfoData = {
    Author: 'BellCube',
    Id: '12345',
    Name: 'Cool Mod!',
    Version: '1.0.0',
    Website: 'https://bellcube.dev'
};

test('Can handle an undefined value', () => {
    const data = Object.assign({}, sampleData);
    data.Author = undefined;

    const info = new FomodInfo();
    testValidity(info);
    expect(info.isValid()).toBe(true);
});

test('Will include schema by default', () => {
    const info = new FomodInfo(sampleData);
    const doc = parseTag`<p/>`.ownerDocument;

    const asElement = info.asElement(doc);
    console.log(asElement.outerHTML);
    expect(asElement.getAttributeNS(XmlNamespaces.XSI, 'noNamespaceSchemaLocation')).toBe(DefaultInfoSchema);
});

test('Will include schema if asked', () => {
    const info = new FomodInfo(sampleData);
    const doc = parseTag`<p/>`.ownerDocument;

    const asElement = info.asElement(doc, true);
    console.log(asElement.outerHTML);
    expect(asElement.getAttributeNS(XmlNamespaces.XSI, 'noNamespaceSchemaLocation')).toBe(DefaultInfoSchema);
});

test('Will not include schema if asked', () => {
    const info = new FomodInfo(sampleData);
    const doc = parseTag`<p/>`.ownerDocument;

    const asElement = info.asElement(doc, false);
    expect(asElement.getAttributeNS(XmlNamespaces.XSI, 'noNamespaceSchemaLocation')).toBeNull();
});

test('Will remove the schema if it\'s the default and we asked for no schema', () => {
    const el = parseTag`<fomod xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="${DefaultInfoSchema}"/>`;
    const info = FomodInfo.parse(el);

    expect(el.getAttributeNS(XmlNamespaces.XSI, 'noNamespaceSchemaLocation')).toBe(DefaultInfoSchema);

    expect(info.asElement(el.ownerDocument, false).getAttributeNS(XmlNamespaces.XSI, 'noNamespaceSchemaLocation')).toBeNull();
});

test('Will not overwrite an existing schema if not given a schema', () => {
    const schema = 'https://example.com';
    const el = parseTag`<fomod xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="${schema}"/>`;
    const info = FomodInfo.parse(el);

    expect(el.getAttributeNS(XmlNamespaces.XSI, 'noNamespaceSchemaLocation')).toBe(schema);

    expect(info.asElement(el.ownerDocument, true).getAttributeNS(XmlNamespaces.XSI, 'noNamespaceSchemaLocation')).toBe(schema);
    expect(info.asElement(el.ownerDocument, DefaultInfoSchema).getAttributeNS(XmlNamespaces.XSI, 'noNamespaceSchemaLocation')).toBe(DefaultInfoSchema);
});

test('Will include an arbitrary schema', () => {
    const info = new FomodInfo(sampleData);
    const doc = parseTag`<p/>`.ownerDocument;

    const schema = 'https://example.com';
    const asElement = info.asElement(doc, schema);
    expect(asElement.getAttributeNS(XmlNamespaces.XSI, 'noNamespaceSchemaLocation')).toBe(schema);
});
