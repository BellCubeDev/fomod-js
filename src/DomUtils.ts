import { TagName } from "./definitions";

/** Searches for an existing tag by the provided name. If one does not yet exist, create one instead.
 *
 * @param fromElement The parent element
 * @param tagName The tag name to search for, restricted to members of the TagName enum
 * @returns The first element by the provided tagname or a new one if it did not yet exist.
 */
export function getOrCreateElementByTagNameSafe(fromElement: Element, tagName: TagName): Element {
    return getOrCreateElementByTagName(fromElement, tagName);
}

/** Searches for an existing tag by the provided name. If one does not yet exist, create one instead.
 *
 * @param fromElement The parent element
 * @param tagName The tag name to search for
 * @returns The first element by the provided tagname or a new one if it did not yet exist.
 */
export function getOrCreateElementByTagName(fromElement: Element, tagName: string): Element {
    const existingElement = fromElement.getElementsByTagName(tagName)[0];
    if (existingElement) return existingElement;

    const newElement = fromElement.ownerDocument.createElement(tagName);
    return fromElement.appendChild(newElement);
}

export function ensureXmlDoctype(doc: Document): void {
    switch (doc.contentType) {
        case 'application/xml':
        case 'text/xml':
        case 'application/xhtml+xml':
        case 'image/svg+xml':
            break;

        default:
            throw new TypeError('Provided document is not an XML document');
    }
}

export const BlankModuleConfig = '<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" />';
export const BlankInfoDoc = '<fomod xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" />';

export enum XmlNamespaces {
    XMLNS = 'http://www.w3.org/2000/xmlns/',
    XSI = 'http://www.w3.org/2001/XMLSchema-instance',
}

export function attrToObject(attributes: Iterable<Attr> | ArrayLike<Attr>): Record<string, string> {
    const arr = Array.from(attributes);
    const entries = arr.map(attr => [attr.name, attr.value]);
    return Object.fromEntries(entries);
}
