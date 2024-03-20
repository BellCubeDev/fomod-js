import { ensureXmlDoctype, getOrCreateElementByTagNameSafe } from "../../DomUtils";
import { FlagDependency } from './dependencies/FlagDependency';
import { DependenciesGroup, } from './dependencies/DependenciesGroup';
import { FlagInstance, FlagInstances, FlagInstancesByDocument } from "../lib/FlagInstance";
import { Install, InstallPattern } from "./Install";
import { InvalidityReason, InvalidityReport } from "../lib/InvalidityReporting";
import { ElementObjectMap, Verifiable, XmlRepresentation } from "../lib/XmlRepresentation";
import { AttributeName, OptionType, TagName } from "../Enums";
import { DefaultFomodDocumentConfig, FomodDocumentConfig } from "../lib/FomodDocumentConfig";

/***
 *     $$$$$$\              $$\     $$\                           $$$$$$$\                  $$\
 *    $$  __$$\             $$ |    \__|                          $$  __$$\                 $$ |
 *    $$ /  $$ | $$$$$$\  $$$$$$\   $$\  $$$$$$\  $$$$$$$\        $$ |  $$ | $$$$$$\   $$$$$$$ |$$\   $$\
 *    $$ |  $$ |$$  __$$\ \_$$  _|  $$ |$$  __$$\ $$  __$$\       $$$$$$$\ |$$  __$$\ $$  __$$ |$$ |  $$ |
 *    $$ |  $$ |$$ /  $$ |  $$ |    $$ |$$ /  $$ |$$ |  $$ |      $$  __$$\ $$ /  $$ |$$ /  $$ |$$ |  $$ |
 *    $$ |  $$ |$$ |  $$ |  $$ |$$\ $$ |$$ |  $$ |$$ |  $$ |      $$ |  $$ |$$ |  $$ |$$ |  $$ |$$ |  $$ |
 *     $$$$$$  |$$$$$$$  |  \$$$$  |$$ |\$$$$$$  |$$ |  $$ |      $$$$$$$  |\$$$$$$  |\$$$$$$$ |\$$$$$$$ |
 *     \______/ $$  ____/    \____/ \__| \______/ \__|  \__|      \_______/  \______/  \_______| \____$$ |
 *              $$ |                                                                            $$\   $$ |
 *              $$ |                                                                            \$$$$$$  |
 *              \__|                                                                             \______/
 */

/** A single option (or "plugin") for a Fomod. These are typically presented as checkboxes or radio buttons. */
export class Option<TStrict extends boolean> extends XmlRepresentation<TStrict> {
    static override readonly tagName = TagName.Plugin;
    readonly tagName = TagName.Plugin;

    constructor(
        public name: string = '',
        public description: string = '',
        public image: string|null = null,
        public typeDescriptor: TypeDescriptor<TStrict> = new TypeDescriptor(),
        public flagsToSet: Set<FlagSetter> = new Set(),
        public installsToSet: InstallPattern<TStrict> = new InstallPattern(),
    ) {
        super();
    }

    asElement(document: Document, config: FomodDocumentConfig = {}, knownOptions: Option<boolean>[] = []): Element {
        const element = this.getElementForDocument(document);
        this.associateWithDocument(document);

        if (config.generateNewOptionFlagNames ?? DefaultFomodDocumentConfig.generateNewOptionFlagNames) {
            for (const option of knownOptions) {
                option.existingOptionFlagSetterByDocument.get(document)?.decommission();
                option.existingOptionFlagSetterByDocument.delete(document);
            }
            config = Object.assign({}, config, {generateNewOptionFlagNames: false});
        }

        element.setAttribute('name', this.name);

        const description = getOrCreateElementByTagNameSafe(element, TagName.Description);
        description.textContent = this.description;
        element.appendChild(description);

        if (this.image === null) element.getElementsByTagName(TagName.Image)[0]?.remove();
        else {
            const image = getOrCreateElementByTagNameSafe(element, TagName.Image);
            image.setAttribute(AttributeName.Path, this.image);
            element.appendChild(image);
        }

        const selfFlag = this.getOptionFlagSetter(document, config, knownOptions);
        this.flagsToSet.add(selfFlag);

        if (this.flagsToSet.size > 0) {
            const flagsElement = getOrCreateElementByTagNameSafe(element, TagName.ConditionFlags);
            for (const flag of this.flagsToSet) flagsElement.appendChild(flag.asElement(document, config));
            element.appendChild(flagsElement);
        } else {
            element.getElementsByTagName(TagName.ConditionFlags)[0]?.remove();
        }

        this.flagsToSet.delete(selfFlag);

        if (this.installsToSet.filesWrapper.installs.size > 0) {
            const filesElement = getOrCreateElementByTagNameSafe(element, TagName.Files);
            for (const install of this.installsToSet.filesWrapper.installs) filesElement.appendChild(install.asElement(document, config));
            element.appendChild(filesElement);
        }else if (this.flagsToSet.size === 0) { // Create an empty `files` element
            const filesElement = getOrCreateElementByTagNameSafe(element, TagName.Files);
            filesElement.replaceChildren();
            element.appendChild(filesElement);
        } else {
            element.getElementsByTagName(TagName.Files)[0]?.remove();
        }

        element.appendChild(this.typeDescriptor.asElement(document, config));

        return element;
    }

    isValid(): this is Option<true> {
        return this.typeDescriptor.isValid();
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, "isValid" | "reasonForInvalidity">[]): InvalidityReport | null {
        tree.push(this);
        return this.typeDescriptor.reasonForInvalidity(tree, this);
    }

    existingOptionFlagSetterByDocument = new WeakMap<Document, FlagSetter>();

    getOptionFlagSetter(document: Document, config: FomodDocumentConfig = {}, knownOptions: Option<boolean>[] = []): FlagSetter {
        const existing = this.existingOptionFlagSetterByDocument.get(document);
        if (existing) return existing;

        const flagInstances = FlagInstancesByDocument.get(document) ?? {all: new Set(), byName: new Map()} as FlagInstances;

        const baseName = 'OPTION_' + this.name.replace(/[^a-zA-Z0-9]/g, '_');
        let thisIndex: number | undefined = undefined;
        const existingFlagNames = new Set(Array.from(flagInstances.byName.keys()).map(nameOrOption => {
            if (typeof nameOrOption === 'string') return nameOrOption;

            // We only care about the flag of the option if it appears in the installer before we do (saves performance and prevents infinite recursion)
            thisIndex ??= knownOptions.indexOf(this);
            if (thisIndex === -1 || knownOptions.indexOf(nameOrOption) >= thisIndex) return undefined;

            nameOrOption.getOptionFlagSetter(document, config, knownOptions).name;
        }));

        // Declared as const largely so TypeScript accepts the narrowed types
        // Yes, I understand that, because functions are hoisted, we couldn't ensure the narrowed state (i.e. TS's behavior is correct), but I don't write code like that.
        // I also can't be bothered to explain that to TypeScript so here we are. Const declaration it is.
        const tryNextName = function tryNextName(suffix: bigint): FlagSetter {
            const name = baseName + `--${suffix}`;

            if (!existingFlagNames.has(name)) {
                const setter = new FlagSetter(new FlagInstance(name, config.optionSelectedValue ?? DefaultFomodDocumentConfig.optionSelectedValue, true));
                setter.associateWithDocument(document);
                return setter;
            }

            return tryNextName(suffix + 1n);
        };

        const setter = tryNextName(1n);
        this.existingOptionFlagSetterByDocument.set(document, setter);
        return setter;
    }

    static override parse(element: Element, config: FomodDocumentConfig = {}): Option<boolean> | null {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const name = element.getAttribute(AttributeName.Name);
        if (name === null) return null;

        const description = element.getElementsByTagName(TagName.Description)[0]?.textContent ?? '';
        const image = element.getElementsByTagName(TagName.Image)[0]?.getAttribute(AttributeName.Path) ?? null;

        const flagsToSet = new Set<FlagSetter>();
        const conditionFlags = element.getElementsByTagName(TagName.ConditionFlags)[0];
        if (conditionFlags) {
            for (const flagElement of conditionFlags.getElementsByTagName(TagName.Flag)) {
                const flag = FlagSetter.parse(flagElement, config);
                if (flag) flagsToSet.add(flag);
            }
        }

        const typeDescriptorElement = element.getElementsByTagName(TagName.TypeDescriptor)[0];
        const typeDescriptor = typeDescriptorElement ? TypeDescriptor.parse(typeDescriptorElement, config) : undefined;

        const installsToSet = new InstallPattern();
        const filesElement = element.getElementsByTagName(TagName.Files)[0];
        if (filesElement) {
            for (const flagElement of filesElement.getElementsByTagName(TagName.File)) {
                const install = Install.parse(flagElement, config);
                if (install) installsToSet.filesWrapper.installs.add(install);
            }

            for (const flagElement of filesElement.getElementsByTagName(TagName.Folder)) {
                const install = Install.parse(flagElement, config);
                if (install) installsToSet.filesWrapper.installs.add(install);
            }
        }

        const option = new Option<false>(name, description, image, typeDescriptor);
        option.assignElement(element);
        option.flagsToSet = flagsToSet;
        option.installsToSet = installsToSet;

        const dependencyOnThis = new FlagDependency(option, true);
        installsToSet.dependencies?.dependencies.add(dependencyOnThis);

        return option;
    }

    override decommission(currentDocument?: Document) {
        this.flagsToSet.forEach(flag => flag.decommission?.(currentDocument));
        this.installsToSet.decommission?.(currentDocument);
        this.typeDescriptor.decommission?.(currentDocument);
    }

    override associateWithDocument(document: Document) {
        this.flagsToSet.forEach(flag => flag.associateWithDocument(document));
        this.installsToSet.associateWithDocument(document);
        this.typeDescriptor.associateWithDocument(document);
    }
}


export class FlagSetter extends XmlRepresentation<true> {
    static override readonly tagName = TagName.Flag;
    readonly tagName = TagName.Flag;


    get name() { return this.flagInstance.name; }
    set name(name: string) { this.flagInstance.name = name; }

    get value() { return this.flagInstance.usedValue; }
    set value(value: string) { this.flagInstance.usedValue = value; }

    constructor(public readonly flagInstance: FlagInstance<false, true>) {
        super();
    }

    asElement(document: Document, config: FomodDocumentConfig = {}): Element {
        const element = this.getElementForDocument(document);
        this.associateWithDocument(document);

        element.setAttribute(AttributeName.Name, this.flagInstance.name);
        element.textContent = this.flagInstance.usedValue;

        return element;
    }

    isValid() { return true; }

    reasonForInvalidity(): null {
        return null;
    }

    static override parse(element: Element, config: FomodDocumentConfig = {}): FlagSetter | null {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const flagName = element.getAttribute(AttributeName.Name);
        if (flagName === null) return null;

        const obj = new FlagSetter(new FlagInstance(flagName, element.textContent ?? '', true));
        obj.assignElement(element);
        return obj;
    }

    override decommission(currentDocument?: Document) {
        this.flagInstance.decommission(currentDocument);
    }

    override associateWithDocument(document: Document) {
        this.flagInstance.associateWithDocument(document);
    }
}

/***
 *    $$$$$$$$\
 *    \__$$  __|
 *       $$ |   $$\   $$\  $$$$$$\   $$$$$$\
 *       $$ |   $$ |  $$ |$$  __$$\ $$  __$$\
 *       $$ |   $$ |  $$ |$$ /  $$ |$$$$$$$$ |
 *       $$ |   $$ |  $$ |$$ |  $$ |$$   ____|
 *       $$ |   \$$$$$$$ |$$$$$$$  |\$$$$$$$\
 *       \__|    \____$$ |$$  ____/  \_______|
 *              $$\   $$ |$$ |
 *              \$$$$$$  |$$ |
 *               \______/ \__|
 *    $$$$$$$\                                          $$\             $$\
 *    $$  __$$\                                         \__|            $$ |
 *    $$ |  $$ | $$$$$$\   $$$$$$$\  $$$$$$$\  $$$$$$\  $$\  $$$$$$\  $$$$$$\    $$$$$$\   $$$$$$\
 *    $$ |  $$ |$$  __$$\ $$  _____|$$  _____|$$  __$$\ $$ |$$  __$$\ \_$$  _|  $$  __$$\ $$  __$$\
 *    $$ |  $$ |$$$$$$$$ |\$$$$$$\  $$ /      $$ |  \__|$$ |$$ /  $$ |  $$ |    $$ /  $$ |$$ |  \__|
 *    $$ |  $$ |$$   ____| \____$$\ $$ |      $$ |      $$ |$$ |  $$ |  $$ |$$\ $$ |  $$ |$$ |
 *    $$$$$$$  |\$$$$$$$\ $$$$$$$  |\$$$$$$$\ $$ |      $$ |$$$$$$$  |  \$$$$  |\$$$$$$  |$$ |
 *    \_______/  \_______|\_______/  \_______|\__|      \__|$$  ____/    \____/  \______/ \__|
 *                                                          $$ |
 *                                                          $$ |
 *                                                          \__|
 */


/** Describes the desired `OptionType` for an option
 *
 * Supports setting a default type and an optional list of conditions ('patterns') that can change the type.
 *
 * @see `OptionType`
 */
export class TypeDescriptor<TStrict extends boolean> extends XmlRepresentation<TStrict> {
    static override readonly tagName = TagName.TypeDescriptor;
    readonly tagName = TagName.TypeDescriptor;

    constructor(
        /** The type name descriptor */
        public defaultTypeNameDescriptor: TypeNameDescriptor<TypeDescriptorTagName, TStrict, false> = new TypeNameDescriptor(TagName.DefaultType, OptionType.Optional, false),
        public patterns: TypeDescriptorPattern<TStrict>[] = [],
    ) {
        super();
    }

    asElement(document: Document, config: FomodDocumentConfig = {}): Element {
        const element = this.getElementForDocument(document);
        this.associateWithDocument(document);

        if (this.patterns.length === 0) {
            this.defaultTypeNameDescriptor.tagName = TagName.Type;
            element.appendChild(this.defaultTypeNameDescriptor.asElement(document, config));
            return element;
        }

        this.defaultTypeNameDescriptor.tagName = TagName.DefaultType;

        const patternsContainer = getOrCreateElementByTagNameSafe(element, TagName.Patterns);

        for (const pattern of this.patterns)
            patternsContainer.appendChild(pattern.asElement(document, config));

        return element;
    }

    static override parse(element: Element, config: FomodDocumentConfig = {}): TypeDescriptor<boolean> {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const typeDescriptor = new TypeDescriptor();
        typeDescriptor.assignElement(element);

        const dependencyTypeEl = element.querySelector(`:scope > ${TagName.DependencyType}`);

        if (!dependencyTypeEl) {
            const typeElement = element.querySelector(`:scope > ${TagName.Type}`);
            if (typeElement) typeDescriptor.defaultTypeNameDescriptor = TypeNameDescriptor.parse(typeElement, config);
        } else {
            const defaultTypeNameDescriptorElement = dependencyTypeEl.querySelector(`:scope > ${TagName.DefaultType}`);
            if (defaultTypeNameDescriptorElement) typeDescriptor.defaultTypeNameDescriptor = TypeNameDescriptor.parse(defaultTypeNameDescriptorElement, config);

            for (const patternElement of dependencyTypeEl.querySelectorAll(`:scope > ${TagName.Pattern}`))
                typeDescriptor.patterns.push(TypeDescriptorPattern.parse(patternElement, config));
        }

        return typeDescriptor;
    }

    isValid(): this is TypeDescriptor<true> {
        return this.defaultTypeNameDescriptor.isValid() && this.patterns.every(p => p.isValid());
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, "isValid" | "reasonForInvalidity">[]): InvalidityReport | null {
        tree.push(this);

        const defaultTypeNameDescriptorInvalidityReason = this.defaultTypeNameDescriptor.reasonForInvalidity(...tree);
        if (defaultTypeNameDescriptorInvalidityReason) return defaultTypeNameDescriptorInvalidityReason;

        const patternInvalidityReason = this.patterns.map(pattern => pattern.reasonForInvalidity(...tree)).find(reason => reason !== null);
        if (patternInvalidityReason) return patternInvalidityReason;

        return null;
    }

    override decommission(currentDocument?: Document) {
        this.defaultTypeNameDescriptor.decommission?.(currentDocument);
        this.patterns.forEach(pattern => pattern.decommission?.(currentDocument));
    }

    override associateWithDocument(document: Document) {
        this.defaultTypeNameDescriptor.associateWithDocument(document);
        this.patterns.forEach(pattern => pattern.associateWithDocument(document));
    }
}

export class TypeDescriptorPattern<TStrict extends boolean> extends XmlRepresentation<TStrict> {
    static override readonly tagName = TagName.Pattern;
    readonly tagName = TagName.Pattern;

    constructor(
        public typeNameDescriptor: TypeNameDescriptor<TagName.Type, TStrict, true> = new TypeNameDescriptor(TagName.Type, OptionType.Optional, true),
        public dependencies: DependenciesGroup<TagName.Dependencies, TStrict> = new DependenciesGroup(TagName.Dependencies),
    ) {
        super();
    }

    asElement(document: Document, config: FomodDocumentConfig = {}): Element {
        const element = this.getElementForDocument(document);
        this.associateWithDocument(document);

        element.appendChild(this.typeNameDescriptor.asElement(document, config));
        element.appendChild(this.dependencies.asElement(document, config));

        return element;
    }

    static override parse(element: Element, config: FomodDocumentConfig = {}): TypeDescriptorPattern<boolean> {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const typeDescriptorPattern = new TypeDescriptorPattern<false>();
        typeDescriptorPattern.assignElement(element);

        const typeNameDescriptorElement = element.querySelector(`:scope > ${TagName.Type}`);
        if (typeNameDescriptorElement) typeDescriptorPattern.typeNameDescriptor = TypeNameDescriptor.parse(typeNameDescriptorElement, config, true);

        const dependenciesElement = element.querySelector(`:scope > ${TagName.Dependencies}`);
        if (dependenciesElement)  typeDescriptorPattern.dependencies = DependenciesGroup.parse<TagName.Dependencies>(dependenciesElement);

        return typeDescriptorPattern;
    }

    isValid(): this is Option<true> {
        return this.typeNameDescriptor.isValid() && this.dependencies.isValid();
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, "isValid" | "reasonForInvalidity">[]): InvalidityReport | null {
        tree.push(this);

        const typeNameDescriptorInvalidityReason = this.typeNameDescriptor.reasonForInvalidity(...tree);
        if (typeNameDescriptorInvalidityReason) return typeNameDescriptorInvalidityReason;

        const dependenciesInvalidityReason = this.dependencies.reasonForInvalidity(...tree);
        if (dependenciesInvalidityReason) return dependenciesInvalidityReason;

        return null;
    }

    override decommission(currentDocument?: Document) {
        this.typeNameDescriptor.decommission?.(currentDocument);
        this.dependencies.decommission?.(currentDocument);
    }

    override associateWithDocument(document: Document) {
        this.typeNameDescriptor.associateWithDocument(document);
        this.dependencies.associateWithDocument(document);
    }
}

type TypeDescriptorTagName = TagName.Type|TagName.DefaultType;

export class TypeNameDescriptor<TTagName extends TypeDescriptorTagName, TStrict extends boolean, TTagNameIsReadOnly extends boolean = true> extends XmlRepresentation<TStrict> {
    static override readonly tagName = [TagName.Type, TagName.DefaultType] as [TagName.Type, TagName.DefaultType];

    get tagName() { return this._tagName; }
    set tagName(tagName: TTagNameIsReadOnly extends true ? TTagName : TypeDescriptorTagName) {
        if (!this.tagNameIsReadonly) this._tagName = tagName;
        else throw new Error(`Attempted to set read-only property 'tagName' on a TypeNameDescriptor instance`);
    }

    constructor(
        private _tagName: TTagNameIsReadOnly extends true ? TTagName : TypeDescriptorTagName,
        public targetType: TStrict extends true ? OptionType : string = OptionType.Optional,
        public tagNameIsReadonly: TTagNameIsReadOnly
    ) {
        super();
    }

    asElement(document: Document, config: FomodDocumentConfig = {}): Element {
        const element = this.getElementForDocument(document);
        this.associateWithDocument(document);

        element.setAttribute(AttributeName.Name, this.targetType);
        return element;
    }

    static override parse<TTagName extends TypeDescriptorTagName = TypeDescriptorTagName, TTagNameIsReadOnly extends boolean = false>(element: Element, config: FomodDocumentConfig = {}, tagNameIsReadonly?: TTagNameIsReadOnly): TypeNameDescriptor<TTagName, boolean, TTagNameIsReadOnly> {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const typeDescriptorName = new TypeNameDescriptor<TTagName, boolean, TTagNameIsReadOnly>(element.tagName as TTagName, 'Optional', tagNameIsReadonly as TTagNameIsReadOnly);
        typeDescriptorName.assignElement(element);

        typeDescriptorName.targetType = element.getAttribute(AttributeName.Name) ?? OptionType.Optional;
        return typeDescriptorName;
    }

    isValid(): this is TypeNameDescriptor<TTagName, true, TTagNameIsReadOnly> {
        return Object.values(OptionType).includes(this.targetType as any);
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, "isValid" | "reasonForInvalidity">[]): InvalidityReport | null {
        tree.push(this);

        if (!Object.values(OptionType).includes(this.targetType as any))
            return {offendingValue: this.targetType, tree, reason: InvalidityReason.OptionTypeDescriptorUnknownOptionType};

        return null;
    }

    // Overwrite to handle the interchangeable `file` and `folder` tags
    override getElementForDocument(document: Document): Element {
        ensureXmlDoctype(document);

        const existingElement = super.getElementForDocument(document);
        if (existingElement.tagName === this.tagName) return existingElement;

        this.documentMap.delete(document);
        const newElement = this.getElementForDocument(document);

        for (let i = 0; i < existingElement.attributes.length; i++)
            newElement.setAttributeNode(existingElement.attributes[i]!.cloneNode(true) as Attr);

        newElement.replaceChildren(...existingElement.children);

        existingElement.replaceWith(newElement);

        return newElement;
    }

    // Overwrite to handle the interchangeable `file` and `folder` tags
    override assignElement(element: Element) {
        ensureXmlDoctype(element.ownerDocument);

        // @ts-ignore: The logic is fine but TypeScript can't figure it out
        if (!this.tagNameIsReadonly && (element.tagName === TagName.Type || element.tagName === TagName.DefaultType)) this.tagName = element.tagName;
        super.assignElement(element);
    }

    override decommission(currentDocument?: Document) {
        //
    }

    override associateWithDocument(document: Document) {
        //
    }
}
