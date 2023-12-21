import { ensureXmlDoctype } from "../DomUtils";
import { InvalidityReason, InvalidityReport } from "./InvalidityReporting";

/** The foundation of a class that can be validated against a schema.
 *
 * This model is important because it allows for the parsing of unsafe documents while providing maximum type safety for generated documents.
 */
export abstract class Verifiable<TStrict extends boolean = true> {
    /** Checks if this item is compliant with the schema. Can be used both for type narrowing and input validation. */
    abstract isValid(): this is Verifiable<true>;

    /** Query the reason why the given item is invalid. Returns `null` if the object is valid.
     *
     * This method tends to be very, very, very slow. If you are only interested in whether or not the object is valid, please use `isValid()` instead.
     *
     * Depending on how often you expect the object to be invalid, it may be faster to use `isValid()` as a fail-fast check before calling this method.
     */
    abstract reasonForInvalidity(...tree: Omit<Verifiable<false>, 'isValid' | 'reasonForInvalidity'>[]): InvalidityReport | null;
}

export const ElementObjectMap = new WeakMap<Element, XmlRepresentation<boolean>>();

/** A representation of an XML element for use with various Fomod classes. helps to facilitate in-place editing of Fomod documents.
 *
 */
export abstract class XmlRepresentation<TStrict extends boolean = true> extends Verifiable<TStrict> {
    static readonly tagName: string|string[];
    abstract readonly tagName: string;

    /** A [weak map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) of documents to this representation's associated element within that document.
     *
     * Without this map, in-place editing would be significantly more difficult.
     */
    documentMap: WeakMap<Document, Element> = new WeakMap();

    /** Assigns an element for a document.
     *
     * @throws If the tag name of the element does not match the tag name of this class.
     * @throws If an element has already been assigned for this document
     * @throws If the element has already been assigned to a different instance of any Fomod class.
     */
    assignElement(element: Element) {
        const document = element.ownerDocument;

        ensureXmlDoctype(element.ownerDocument);

        if (element.tagName !== this.tagName && element.tagName !== this.tagName.toUpperCase()) throw new Error(`Cannot assign an element with tag name "${element.tagName}" to a class with tag name "${this.tagName}".`);

        if (this.documentMap.has(document)) throw new Error('Cannot assign an element to a document more than once.');

        if (ElementObjectMap.has(element)) throw new Error('Cannot assign an element that has already been assigned to a different instance of a Fomod class.');

        this.documentMap.set(document, element);
        ElementObjectMap.set(element, this);
    }

    /** Returns the element assigned to the document. Will create a new one if it does not exist. */
    getElementForDocument(document: Document): Element {
        ensureXmlDoctype(document);

        const existing = this.documentMap.get(document);
        if (existing) return existing;

        const newElement = document.createElement(this.tagName);
        this.documentMap.set(document, newElement);

        return newElement;
    }

    abstract decommission?(currentDocument?: Document): unknown;

    /** Generates an XML element from this object. */
    abstract asElement(document: Document): Element;

    static parse(element: Element): XmlRepresentation<boolean> | null {
        throw new Error('This static method must be implemented by the child class!');
    }
}
