import { TagName, Verifiable, XmlRepresentation } from "../../../src";
import { parseTag } from "../../testUtils";

class MockXMLRepresentation extends XmlRepresentation<true> {
    static override readonly tagName = 'mock' as TagName;
    readonly tagName = 'mock' as TagName;

    asElement(document: Document): Element {
        throw new Error("Method not implemented.");
    }

    decommission(currentDocument?: Document | undefined): unknown {
        throw new Error("Method not implemented.");
    }

    isValid(): this is XmlRepresentation<true> {
        throw new Error("Method not implemented.");
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, "isValid" | "reasonForInvalidity">[]): import("../../../src").InvalidityReport | null {
        throw new Error("Method not implemented.");
    }
}


test('assignElement() throws when given an HTML element', () => {
    const mock = new MockXMLRepresentation();
    const htmlElement = document.createElement('mock');
    expect(() => mock.assignElement(htmlElement)).toThrow('Provided document is not an XML document');
});

test('assignElement() does not throw when given an XML element', () => {
    const xmlElement = parseTag`<mock />`;
    const mock = new MockXMLRepresentation();
    expect(() => mock.assignElement(xmlElement)).not.toThrow();
});

test('assignElement() throws when given an element with a different tag name', () => {
    const xmlElement = parseTag`<badTagName />`;
    const mock = new MockXMLRepresentation();
    expect(() => mock.assignElement(xmlElement)).toThrow(`Cannot assign an element with tag name "badTagName" to a class with tag name "mock".`);
});

test('The static parse() method throws if not implemented', () => {
    const xmlElement = parseTag`<mock />`;
    expect(() => MockXMLRepresentation.parse(xmlElement)).toThrow('This static method must be implemented by the child class!');
});

describe('After Assigning An Element', () => {
    const mock = new MockXMLRepresentation();
    const xmlElement = parseTag`<mock />`;
    mock.assignElement(xmlElement);

    test('Assigning the element a second time throws', () => {
        expect(() => mock.assignElement(xmlElement)).toThrow('Cannot assign an XmlRepresentation to an element from a given document more than once.');
    });

    test('getElementForDocument() returns the correct element', () => {
        expect(mock.getElementForDocument(xmlElement.ownerDocument)).toBe(xmlElement);
    });

    test('Assigning the element to a different XMLRepresentation throws', () => {
        const mock2 = new MockXMLRepresentation();
        expect(() => mock2.assignElement(xmlElement)).toThrow('Cannot assign an element that has already been assigned to a different instance of a Fomod class.');
    });

    test('Getting the element for a different document returns a new/different element', () => {
        const xmlElement2 = parseTag`<mock />`;
        expect(mock.getElementForDocument(xmlElement2.ownerDocument)).not.toBe(xmlElement);
    });
});
