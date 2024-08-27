import { ensureXmlDoctype } from "./DomUtils";
import { Fomod, FomodInfo } from ".";
import { FomodDocumentConfig } from "./definitions/lib/FomodDocumentConfig";

export function parseModuleDoc(document: Document, config: FomodDocumentConfig = {}): Fomod<false> | null {
    ensureXmlDoctype(document);

    let element: Element = document.documentElement;
    if (element.tagName !== Fomod.tagName) element = element.getElementsByTagName(Fomod.tagName)[0]!;
    if (!element) return null;

    return Fomod.parse(element, config);
}

export function parseInfoDoc(document: Document, config: FomodDocumentConfig = {}): FomodInfo | null {
    ensureXmlDoctype(document);

    let element: Element = document.documentElement;
    if (element.tagName !== FomodInfo.tagName) element = element.getElementsByTagName(FomodInfo.tagName)[0]!;
    if (!element) return null;

    return FomodInfo.parse(element, config);
}
