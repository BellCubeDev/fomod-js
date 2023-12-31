import { XmlNamespaces, attrToObject, getOrCreateElementByTagNameSafe } from "../../DomUtils";
import { DependenciesGroup, Dependency, FlagDependency } from "./dependencies";
import { Install, InstallPattern } from "./Install";
import { InvalidityReason, InvalidityReport } from "../lib/InvalidityReporting";
import { Step } from "./Step";
import { ElementObjectMap, Verifiable, XmlRepresentation } from "../lib/XmlRepresentation";
import { AttributeName, BooleanString, ModuleNamePosition, SortingOrder, TagName } from "../Enums";
import { Option } from "./Option";
import { gatherDependedUponOptions, gatherFlagDependencies } from "../lib/utils";
import { DefaultFomodDocumentConfig, FomodDocumentConfig } from "../lib/FomodDocumentConfig";
import { parseOptionFlags } from "../lib/ParseOptionFlags";

export interface ModuleImageMetadata<TStrict extends boolean> {
    showFade?: TStrict extends true ? `${boolean}` : string;
    showImage?: TStrict extends true ? `${boolean}` : string;
    height?: TStrict extends true ? `${bigint}` | '' : string;
}

export interface ModuleNameMetadata<TStrict extends boolean> {
    position?: TStrict extends true ? ModuleNamePosition : string;

    /** Must be an XML-valid hex string. XML-valid hex strings accept the standard `1234567890ABCDEF` range and the length must be even
     *
     * Should ideally appear as a 6-digit hex string, however this is not enforced by the schema.
    */
    colour?: string;
}

/** A FOMOD installer in its entirety.
 *
 * @template TStrict Whether or not to use strict typing for this class. Any data parsed from user input should be considered untrusted and thus `false` should be used. Otherwise, `true` should be used.
 */
export class Fomod<TStrict extends boolean> extends XmlRepresentation<TStrict> {
    static override readonly tagName = TagName.Config;
    readonly tagName = TagName.Config;




    constructor(
        /** The name of the FOMOD. Must be specified in the installer however can be an empty string.
         *
         * Note that Info.xml also has its own name.
        */
        public moduleName: string = '',
        public moduleImage: string | null = null,
        /** Dependencies required for this FOMOD to be shown to the user.
         *
         * Mod managers will show the user an error message if attempting to install a FOMOD that does not meet the requirements specified here.
         */
        public moduleDependencies: DependenciesGroup<TagName.ModuleDependencies, TStrict> = new DependenciesGroup<TagName.ModuleDependencies, TStrict>(TagName.ModuleDependencies),
        /** Top-level file installs for the FOMOD
         *
         * Covers both the `requiredInstallFiles` and `conditionalFileInstalls` tags.
         */
        public installs: Set<Install<TStrict> | InstallPattern<TStrict>> = new Set(),

        public sortingOrder: TStrict extends true ? SortingOrder : string = SortingOrder.Ascending,

        public steps: Set<Step<TStrict>> = new Set(),

        /** Unused metadata for `moduleName`. Included for completeness.
         *
         * @deprecated
         */
        public moduleNameMetadata: (TStrict extends true ? Record<never, string> : Record<string, string>) & ModuleNameMetadata<TStrict> = {},

        /** Unused metadata for `moduleImage`. Included for completeness.
         *
         * @deprecated
         */
        public moduleImageMetadata: (TStrict extends true ? Record<never, string> : Record<Exclude<string, 'path'>, string>) & ModuleImageMetadata<TStrict> = {},

    ) {
        super();
    }

    isValid(): this is Fomod<true> {

        return (
            (!this.moduleNameMetadata.position || Object.values(ModuleNamePosition).includes(this.moduleNameMetadata.position as any)) &&
            (!this.moduleImageMetadata.showFade || Object.values(BooleanString).includes(this.moduleImageMetadata.showFade as any)) &&
            (!this.moduleImageMetadata.showImage || Object.values(BooleanString).includes(this.moduleImageMetadata.showImage as any)) &&
            !isNaN(parseInt(this.moduleNameMetadata.colour ?? '2', 16)) &&
            !isNaN(parseInt(this.moduleImageMetadata.height ?? '1')) &&
            (this.moduleDependencies?.isValid() ?? true) &&
            Array.from(this.steps.values()).every(step => step.isValid()) &&
            Array.from(this.installs.values()).every(installOrPatterns => installOrPatterns.isValid())
        );
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, "isValid" | "reasonForInvalidity">[]): InvalidityReport | null {
        tree.push(this);

        if (this.moduleNameMetadata.position && !Object.values(ModuleNamePosition).includes(this.moduleNameMetadata.position as any)) return {
            tree,
            offendingValue: this.moduleNameMetadata.position,
            reason: InvalidityReason.FomodModuleNameMetadataInvalidPosition,
        };

        if (isNaN(parseInt(this.moduleNameMetadata.colour ?? '2', 16))) return {
            tree,
            offendingValue: this.moduleNameMetadata.colour!,
            reason: InvalidityReason.FomodModuleNameMetadataColorHexNotHexNumber,
        };

        if (this.moduleImageMetadata.showFade && !Object.values(BooleanString).includes(this.moduleImageMetadata.showFade as any)) return {
            tree,
            offendingValue: this.moduleImageMetadata.showFade,
            reason: InvalidityReason.FomodModuleImageMetadataShowFadeNotBool,
        };

        if (this.moduleImageMetadata.showImage && !Object.values(BooleanString).includes(this.moduleImageMetadata.showImage as any)) return {
            tree,
            offendingValue: this.moduleImageMetadata.showImage,
            reason: InvalidityReason.FomodModuleImageMetadataShowImageNotBool,
        };

        for (const step of this.steps) {
            const reason = step.reasonForInvalidity(...tree);
            if (reason) return reason;
        }

        for (const installOrPattern of this.installs) {
            const reason = installOrPattern.reasonForInvalidity(...tree);
            if (reason) return reason;
        }

        return null;
    }

    asElement(document: Document, config: FomodDocumentConfig = {}): Element {
        const element = this.getElementForDocument(document);

        // Schemas are mandatory for ModuleConfig.xml
        element.setAttributeNS(XmlNamespaces.XMLNS, 'xmlns:xsi', XmlNamespaces.XSI);
        element.setAttributeNS(XmlNamespaces.XSI, 'xsi:noNamespaceSchemaLocation', 'http://qconsulting.ca/fo3/ModConfig5.0.xsd');

        const moduleNameElement = getOrCreateElementByTagNameSafe(element, TagName.ModuleName);
        moduleNameElement.textContent = this.moduleName;
        for (const [key, value] of Object.entries(this.moduleNameMetadata) as [string, string | undefined][]) {
            if (!value) continue;

            if (key !== AttributeName.Color) moduleNameElement.setAttribute(key, value);

            else { // `xs:hexBinary` values are required to have an even number of digits. This enforces that so long as the color value is a valid hex number.
                let colorString = value;
                if (!isNaN(parseInt(colorString, 16)) && colorString.length % 2 !== 0) colorString = `0${colorString}`;
                moduleNameElement.setAttribute(key, colorString);
            }
        }

        const moduleImageElement = getOrCreateElementByTagNameSafe(element, TagName.ModuleImage);
        if (this.moduleImage === null) moduleImageElement.remove();
        else {
            for (const [key, value] of Object.entries(this.moduleImageMetadata)) moduleImageElement.setAttribute(key, value);
            moduleImageElement.setAttribute(AttributeName.Path, this.moduleImage);
        }

        if (this.moduleDependencies.dependencies.size > 0) element.appendChild(this.moduleDependencies.asElement(document, config));
        else this.moduleDependencies.getElementForDocument(document).remove();

        const requiredInstallContainer = getOrCreateElementByTagNameSafe(element, TagName.RequiredInstallFiles);
        const conditionalInstallContainerRoot = getOrCreateElementByTagNameSafe(element, TagName.ConditionalFileInstalls);
        const conditionalInstallContainer = getOrCreateElementByTagNameSafe(conditionalInstallContainerRoot, TagName.Patterns);

        for (const installOrPattern of this.installs) {
            if (installOrPattern instanceof Install) {
                requiredInstallContainer.appendChild(installOrPattern.asElement(document, config));
                continue;
            }


            const el = installOrPattern.asElement(document, config);


            if (config.flattenConditionalInstalls ?? DefaultFomodDocumentConfig.flattenConditionalInstalls) {
                const optionDependencies = gatherDependedUponOptions(installOrPattern.dependencies);
                if (optionDependencies.size === 1) {
                    const option = optionDependencies.values().next().value as Option<boolean>;
                    for (const install of installOrPattern.filesWrapper.installs) option.installsToSet.filesWrapper.installs.add(install);

                    el.remove();
                    continue;
                }
            }


            if (installOrPattern.dependencies.dependencies.size === 0) {
                if ((config.removeEmptyConditionalInstalls ?? DefaultFomodDocumentConfig.removeEmptyConditionalInstalls) && installOrPattern.filesWrapper.installs.size === 0) {
                    el.remove();
                    continue;
                } else if (config.flattenConditionalInstallsNoDependencies ?? DefaultFomodDocumentConfig.flattenConditionalInstallsNoDependencies) {
                    installOrPattern.filesWrapper.installs.forEach(install => requiredInstallContainer.appendChild(install.asElement(document, config)));

                    el.remove();
                    continue;
                }
            }

            conditionalInstallContainer.appendChild(el);
        }

        if (requiredInstallContainer.children.length === 0) requiredInstallContainer.remove();
        else element.appendChild(requiredInstallContainer);

        const stepContainer = getOrCreateElementByTagNameSafe(element, TagName.InstallSteps);
        for (const step of this.steps) stepContainer.appendChild(step.asElement(document, config));

        if (stepContainer.children.length === 0) stepContainer.remove();
        else {
            stepContainer.setAttribute(AttributeName.Order, this.sortingOrder);
            element.appendChild(stepContainer);
        }

        if (conditionalInstallContainer.children.length === 0) conditionalInstallContainerRoot.remove();
        else element.appendChild(conditionalInstallContainerRoot);

        return element;
    }

    gatherOptions(): Option<TStrict>[] {
        const options: Option<TStrict>[] = [];

        for (const step of this.steps) options.push(...step.gatherOptions());

        return options;
    }

    static override parse(element: Element, config: FomodDocumentConfig = {}): Fomod<boolean> {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const moduleNameElement = element.querySelector(`:scope > ${TagName.ModuleName}`);
        const ModuleImageElement = element.querySelector(`:scope > ${TagName.ModuleImage}`);
        const moduleName = moduleNameElement?.textContent ?? '';
        const moduleImage = ModuleImageElement?.getAttribute(AttributeName.Path) ?? null;

        const fomod = new Fomod<false>(moduleName, moduleImage);
        fomod.assignElement(element);

        fomod.moduleNameMetadata = attrToObject(moduleNameElement?.attributes ?? []);
        fomod.moduleImageMetadata = attrToObject(ModuleImageElement?.attributes ?? []);

        fomod.moduleImageMetadata.path = '';

        const moduleDependencies = element.querySelector(`:scope > ${TagName.ModuleDependencies}`);
        if (moduleDependencies) fomod.moduleDependencies = DependenciesGroup.parse(moduleDependencies, config);

        for (const install of element.querySelectorAll(`:scope > ${TagName.RequiredInstallFiles} > :is(${TagName.File}, ${TagName.Folder})`)) {
            const parsed = Install.parse(install, config);
            if (parsed) fomod.installs.add(parsed);
        }

        fomod.sortingOrder = element.querySelector(`:scope > ${TagName.InstallStep}`)?.getAttribute(AttributeName.Order) ?? SortingOrder.Ascending;

        for (const install of element.querySelectorAll(`:scope > ${TagName.ConditionalFileInstalls} > ${TagName.Patterns} > ${TagName.Pattern}`)) {
            const parsed = InstallPattern.parse(install, config);
            if (parsed) fomod.installs.add(parsed);
        }

        let configForSteps = config;
        if (configForSteps.parseOptionFlags) configForSteps = Object.assign({}, configForSteps, {parseOptionFlags: false});

        for (const step of element.querySelectorAll(`:scope > ${TagName.InstallSteps} > ${TagName.InstallStep}`)) {
            const parsed = Step.parse(step, configForSteps);
            if (parsed) fomod.steps.add(parsed);
        }

        if (config.parseOptionFlags ?? DefaultFomodDocumentConfig.parseOptionFlags) {
            const dependencies = Array.from(gatherFlagDependencies(fomod.moduleDependencies));
            for (const install of fomod.installs) if (install instanceof InstallPattern) dependencies.push(...gatherFlagDependencies(install.dependencies));

            for (const step of fomod.steps)
                dependencies.push(...gatherFlagDependencies(step.visibilityDeps));

            const options = fomod.gatherOptions();
            for (const option of options) {
                for (const pattern of option.typeDescriptor.patterns) {
                    dependencies.push(...gatherFlagDependencies(pattern.dependencies));
                }
            }

            parseOptionFlags(options, element.ownerDocument!, config, dependencies);
        }

        return fomod;
    }

    decommission(currentDocument?: Document) {
        this.steps.forEach(step => step.decommission?.(currentDocument!));
        this.installs.forEach(install => install.decommission?.(currentDocument!));
    }
}
