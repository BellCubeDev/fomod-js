import { TagName } from "./Enums";
import { ElementObjectMap, XmlRepresentation } from "./lib/_core";

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

export const DefaultInfoSchema = 'https://fomod.bellcube.dev/schemas/info.xsd';

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

    isValid() { return true; }
    override reasonForInvalidity(): null {
        return null;
    }

    override asElement(document: Document, includeSchema: boolean|string = true): Element {
        const element = this.getElementForDocument(document);

        // An empty call removes all children
        element.replaceChildren();

        for (const [key, value] of Object.entries(this.data)) {
            if (value === undefined) continue;

            const child = document.createElement(key);
            child.textContent = value;

            element.appendChild(child);
        }

        element.setAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');

        const currentSchema = element.getAttribute('xsi:noNamespaceSchemaLocation');

        if (includeSchema) {
            if (typeof includeSchema === 'string') element.setAttribute('xsi:noNamespaceSchemaLocation', includeSchema);
            else if (currentSchema === null) element.setAttribute('xsi:noNamespaceSchemaLocation', DefaultInfoSchema);

        } else
            if (currentSchema === DefaultInfoSchema) element.removeAttribute('xsi:noNamespaceSchemaLocation');

        return element;
    }

    static override parse(element: Element): FomodInfo {
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
