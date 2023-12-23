import { ensureXmlDoctype } from "./DomUtils";
import { Fomod, FomodInfo } from ".";

export function parseModuleDoc(document: Document): Fomod<false> | null {
    ensureXmlDoctype(document);

    let element: Element = document.documentElement;
    if (element.tagName !== Fomod.tagName) element = element.getElementsByTagName(Fomod.tagName)[0]!;
    if (!element) return null;

    return Fomod.parse(element);
}

export function parseInfoDoc(document: Document): FomodInfo | null {
    ensureXmlDoctype(document);

    let element: Element = document.documentElement;
    if (element.tagName !== FomodInfo.tagName) element = element.getElementsByTagName(FomodInfo.tagName)[0]!;
    if (!element) return null;

    return FomodInfo.parse(element);
}
