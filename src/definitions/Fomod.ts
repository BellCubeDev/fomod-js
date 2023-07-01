import { getOrCreateElementByTagName } from "../DomUtils";
import { Dependencies } from "./Dependencies";
import { Install, InstallPattern } from "./Install";
import { InvalidityReason, InvalidityReport } from "./InvalidityReporting";
import { Step } from "./Step";
import { ElementObjectMap, Verifiable, XmlRepresentation } from "./_core";

export interface ModuleImageMetadata<TStrict extends boolean = true> {
    showFade?: TStrict extends true ? `${boolean}` : string;
    showImage?: TStrict extends true ? `${boolean}` : string;
    height?: TStrict extends true ? `${bigint}` : string;
}

export interface ModuleNameMetadata<TStrict extends boolean = true> {
    position?: TStrict extends true ? 'Left'|'Right'|'RightOfImage' : string;

    /** Must be an XML-valid hex string. XML-valid hex strings accept the standard `1234567890ABCDEF` range and the length must be even
     *
     * Should ideally appear as a 6-digit hex string, however this is not enforced by the schema.
    */
    colour?: string;
}

function attrToObject(attributes: Iterable<Attr> | ArrayLike<Attr>): Record<string, string> {
    const arr = Array.from(attributes);
    const entries = arr.map(attr => [attr.name, attr.value]);
    return Object.fromEntries(entries);
}

/** A FOMOD installer in its entirety.
 *
 * @template TStrict Whether or not to use strict typing for this class. Any data parsed from user input should be considered untrusted and thus `false` should be used. Otherwise, `true` should be used.
 */
export class Fomod<TStrict extends boolean = true> extends XmlRepresentation<TStrict> {
    static override readonly tagName = 'config';
    readonly tagName = 'config';

    /** The name of the FOMOD. Must be specified in the installer however can be an empty string. */
    moduleName: string;

    /** Unused metadata for `moduleName`. Included for completeness.
     *
     * @deprecated
     */
    moduleNameMetadata: (TStrict extends true ? Record<never, string> : Record<string, string>) & ModuleNameMetadata<TStrict> = {};

    /** Default image for the FOMOD. Not required and will be removed if an empty string is specified. */
    moduleImage: string|null;

    /** Unused metadata for `moduleImage`. Included for completeness.
     *
     * @deprecated
     */
    moduleImageMetadata: (TStrict extends true ? Record<never, string> : Record<Exclude<string, 'path'>, string>) & ModuleImageMetadata<TStrict> = {};

    /** Dependencies required for this FOMOD to be shown to the user.
     *
     * Mod managers will show the user an error message if attempting to install a FOMOD that does not meet the requirements specified here.
     */
    moduleDependencies: Dependencies<'moduleDependencies', TStrict>;

    steps = new Set<Step<TStrict>>();

    /** Top-level file installs for the FOMOD
     *
     * Covers both the `requiredInstallFiles` and `conditionalFileInstalls` tags.
     */
    installs = new Set<Install<TStrict> | InstallPattern<TStrict>>();

    constructor(moduleName: string = '', moduleImage: string|null = null, moduleDependencies?: Dependencies<'moduleDependencies', TStrict>) {
        super();
        this.moduleName = moduleName;
        this.moduleImage = moduleImage;
        this.moduleDependencies = moduleDependencies ?? new Dependencies<'moduleDependencies', TStrict>('moduleDependencies');
    }

    isValid(): this is Fomod<true> {

        return (
            (!this.moduleNameMetadata.position || this.moduleNameMetadata.position === 'Left' || this.moduleNameMetadata.position === 'Right' || this.moduleNameMetadata.position === 'RightOfImage') &&
            (!this.moduleImageMetadata.showFade || this.moduleImageMetadata.showFade === 'true' || this.moduleImageMetadata.showFade === 'false') &&
            (!this.moduleImageMetadata.showImage || this.moduleImageMetadata.showImage === 'true' || this.moduleImageMetadata.showImage === 'false') &&
            !isNaN(parseInt(this.moduleNameMetadata.colour ?? '2', 16)) &&
            !isNaN(parseInt(this.moduleImageMetadata.height ?? '1')) &&
            (this.moduleDependencies?.isValid() ?? true) &&
            Array.from(this.steps.values()).every(step => step.isValid()) &&
            Array.from(this.installs.values()).every(installOrPatterns => installOrPatterns.isValid())
        );
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, "isValid" | "reasonForInvalidity">[]): InvalidityReport | null {
        tree.push(this);

        if (this.moduleNameMetadata.position && this.moduleNameMetadata.position !== 'Left' && this.moduleNameMetadata.position !== 'Right' && this.moduleNameMetadata.position !== 'RightOfImage') return {
            tree,
            offendingValue: this.moduleNameMetadata.position,
            reason: InvalidityReason.FomodModuleNameMetadataInvalidPosition,
        };

        if (!isNaN(parseInt(this.moduleNameMetadata.colour ?? '2', 16))) return {
            tree,
            offendingValue: this.moduleNameMetadata.colour!,
            reason: InvalidityReason.FomodModuleNameMetadataColorHexNotHexNumber,
        };

        if (this.moduleImageMetadata.showFade && this.moduleImageMetadata.showFade !== 'true' && this.moduleImageMetadata.showFade !== 'false') return {
            tree,
            offendingValue: this.moduleImageMetadata.showFade,
            reason: InvalidityReason.FomodModuleImageMetadataShowFadeNotBool,
        };

        if (this.moduleImageMetadata.showImage && this.moduleImageMetadata.showImage !== 'true' && this.moduleImageMetadata.showImage !== 'false') return {
            tree,
            offendingValue: this.moduleImageMetadata.showImage,
            reason: InvalidityReason.FomodModuleImageMetadataShowImageNotBool,
        };

        // TODO: Require more invalidity reports!
        return null;
    }

    asElement(document: Document): Element {
        const element = this.getElementForDocument(document);


        // Schemas are mandatory for ModuleConfig.xml

        //element.setAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
        //element.setAttribute('xsi:noNamespaceSchemaLocation', 'http://qconsulting.ca/fo3/ModConfig5.0.xsd');
        element.setAttributeNS('http://www.w3.org/2001/XMLSchema-instance', 'xsi:noNamespaceSchemaLocation', 'http://qconsulting.ca/fo3/ModConfig5.0.xsd');


        const moduleNameElement = getOrCreateElementByTagName(element, 'moduleName');
        moduleNameElement.textContent = this.moduleName;
        for (const [key, value] of Object.entries(this.moduleNameMetadata) as [string, string|undefined][]) {
            if (!value) continue;

            if (key !== 'colour') moduleNameElement.setAttribute(key, value);

            else { // `xs:hexBinary` values are required to have an even number of digits. This enforces that so long as the color value is a valid hex number.
                let colorString = value;
                if (!isNaN(parseInt(colorString, 16)) && colorString.length % 2 !== 0) colorString = `0${colorString}`;
                moduleNameElement.setAttribute(key, colorString);
            }
        }

        if (this.moduleImage !== null) {
            const moduleImageElement = getOrCreateElementByTagName(element, 'moduleImage');
            for (const [key, value] of Object.entries(this.moduleImageMetadata)) moduleImageElement.setAttribute(key, value);
            moduleImageElement.setAttribute('path', this.moduleImage);
        }

        if (this.moduleDependencies) element.appendChild(this.moduleDependencies.asElement(document));

        const requiredInstallContainer = getOrCreateElementByTagName(element, 'requiredInstallFiles');
        const conditionalInstallContainerRoot = getOrCreateElementByTagName(element, 'conditionalFileInstalls');
        const conditionalInstallContainer = getOrCreateElementByTagName(conditionalInstallContainerRoot, 'patterns');

        for (const installOrPattern of this.installs) {
            if (installOrPattern instanceof Install) requiredInstallContainer.appendChild(installOrPattern.asElement(document));
            else conditionalInstallContainer.appendChild(installOrPattern.asElement(document));
        }

        if (requiredInstallContainer.children.length > 0) element.appendChild(requiredInstallContainer);
        else requiredInstallContainer.remove();

        if (this.steps.size > 0) {
            const stepContainer = getOrCreateElementByTagName(element, 'installSteps');
            for (const step of this.steps) stepContainer.appendChild(step.asElement(document));

            element.appendChild(stepContainer);
        }

        if (conditionalInstallContainer.children.length > 0) element.appendChild(conditionalInstallContainerRoot);
        else conditionalInstallContainerRoot.remove();

        return element;
    }

    static override parse(element: Element): Fomod<boolean> {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const moduleName = element.querySelector('moduleName')?.textContent ?? '';
        const moduleImage = element.querySelector('moduleImage')?.getAttribute('path') ?? '';

        const fomod = new Fomod<false>(moduleName, moduleImage);
        fomod.assignElement(element);

        fomod.moduleNameMetadata = attrToObject(element.querySelector('moduleName')?.attributes ?? []);
        fomod.moduleImageMetadata = attrToObject(element.querySelector('moduleImage')?.attributes ?? []);

        fomod.moduleImageMetadata.path = '';

        const moduleDependencies = element.querySelector('moduleDependencies');
        if (moduleDependencies) fomod.moduleDependencies = Dependencies.parse(moduleDependencies);

        for (const install of element.querySelectorAll('requiredInstallFiles > install')) {
            const parsed = Install.parse(install);
            if (parsed) fomod.installs.add(parsed);
        }

        for (const install of element.querySelectorAll('conditionalFileInstalls > install')) {
            const parsed = Install.parse(install);
            if (parsed) fomod.installs.add(parsed);
        }

        for (const step of element.querySelectorAll('installSteps > step')) {
            const parsed = Step.parse(step);
            if (parsed) fomod.steps.add(parsed);
        }

        return fomod;
    }

    decommission(currentDocument?: Document) {
        this.steps.forEach(step => step.decommission?.(currentDocument!));
        this.installs.forEach(install => install.decommission?.(currentDocument!));
    }
}

