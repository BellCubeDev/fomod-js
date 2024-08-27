import { XmlNamespaces } from "../DomUtils";
import { TagName } from "./Enums";
import { DefaultFomodDocumentConfig, FomodDocumentConfig } from "./lib/FomodDocumentConfig";
import { ElementObjectMap, XmlRepresentation } from "./lib/XmlRepresentation";

export interface FomodInfoData {
    [key: string]: string|undefined;

    /** MO2 reads and displays this field in the installer dialog. Vortex reads but does not use it. */
    Name?: string;

    /** MO2 reads and displays this field. There are no restrictions on its value. */
    Author?: string;

    /** MO2 reads this field as an integer however never uses it. It assigns it to a variable with a name used elsewhere in the codebase for the Nexus Mods ID, however. */
    Id?: string;

    /** MO2 reads this field and pipes it directly into the `href` attribute of an Anchor (`a`) HTML element */
    Website?: string;

    /** MO2 reads, displays, and potentially stores this field. There are no restrictions on its value.  */
    Version?: string;

}

export const DefaultInfoSchema = 'https://fomod.bellcube.dev/schemas/Info.xsd';

/** Information stored in the Info.xml file of any given FOMOD
 *
 * Explicit types are given for known values, however there are no explicit specifications given for what is allowed or expected in the file.
 */
export class FomodInfo extends XmlRepresentation<boolean> {
    static override readonly tagName = TagName.Fomod;
    readonly tagName = TagName.Fomod;

    constructor(
        public data: FomodInfoData = {}
    ) {
        super();
    }

    isValid(): this is FomodInfo { return true; }
    override reasonForInvalidity() { return null; }
    associateWithDocument(document: Document) { return; }

    override asElement(document: Document, {includeInfoSchema}: FomodDocumentConfig = {}): Element {
        const element = this.getElementForDocument(document);
        this.associateWithDocument(document);

        // Replace all data
        element.replaceChildren();

        for (const [key, value] of Object.entries(this.data)) {
            if (value === undefined) continue;

            const child = document.createElement(key);
            child.textContent = value;

            element.appendChild(child);
        }

        element.setAttributeNS(XmlNamespaces.XMLNS, 'xmlns:xsi', XmlNamespaces.XSI);
        const currentSchema = element.getAttributeNS(XmlNamespaces.XSI, 'noNamespaceSchemaLocation');

        if (includeInfoSchema ?? DefaultFomodDocumentConfig.includeInfoSchema) {
            if (typeof includeInfoSchema === 'string') element.setAttributeNS(XmlNamespaces.XSI, 'noNamespaceSchemaLocation', includeInfoSchema);
            else if (currentSchema === null) element.setAttributeNS(XmlNamespaces.XSI, 'noNamespaceSchemaLocation', DefaultInfoSchema);

        } else
            if (currentSchema === DefaultInfoSchema) element.removeAttributeNS(XmlNamespaces.XSI, 'noNamespaceSchemaLocation');

        return element;
    }

    static override parse(element: Element, config: FomodDocumentConfig = {}): FomodInfo {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const data: FomodInfoData = {};

        for (const child of element.children) {
            if (child.textContent === null) continue;
            data[child.tagName] = child.textContent;
        }

        const obj = new FomodInfo(data);
        obj.assignElement(element);
        return obj;
    }

    override decommission: undefined;
}
