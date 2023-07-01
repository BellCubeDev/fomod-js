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

export const BlankModuleConfig = '<config />';
export const BlankInfoDoc = '<fomod />';
