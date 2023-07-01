import { ensureXmlDoctype, getOrCreateElementByTagName } from "../DomUtils";
import { Dependencies, FlagDependency } from "./Dependencies";
import { FlagInstance, FlagInstancesByDocument } from "./FlagInstance";
import { Install, InstallPattern } from "./Install";
import { InvalidityReason, InvalidityReport } from "./InvalidityReporting";
import { ElementObjectMap, Verifiable, XmlRepresentation } from "./_core";

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
export class Option<TStrict extends boolean = true> extends XmlRepresentation<TStrict> {
    static override readonly tagName = 'plugin';
    readonly tagName = 'plugin';

    name: string;
    description: string;
    image: string|null;

    flagsToSet = new Set<FlagSetter>;

    typeDescriptor: TypeDescriptor<TStrict>;

    constructor(name: string = '', description: string = '', image: string|null = null, typeDescriptor?: TypeDescriptor<TStrict>) {
        super();

        this.name = name;
        this.description = description;
        this.image = image;
        this.typeDescriptor = typeDescriptor ?? new TypeDescriptor();
    }

    asElement(document: Document): Element {
        const element = this.getElementForDocument(document);

        element.setAttribute('name', this.name);

        const description = getOrCreateElementByTagName(element, 'description');
        description.textContent = this.description;
        element.appendChild(description);

        if (this.image === null) element.getElementsByTagName('image')[0]?.remove();
        else {
            const image = getOrCreateElementByTagName(element, 'image');
            image.textContent = this.image;
            element.appendChild(image);
        }

        if (this.flagsToSet.size > 0) {
            const flagsElement = getOrCreateElementByTagName(element, 'conditionFlags');
            for (const flag of this.flagsToSet) flagsElement.appendChild(flag.asElement(document));
            element.appendChild(flagsElement);
        } else { // Create an empty `files` element
            const filesElement = getOrCreateElementByTagName(element, 'files');
            filesElement.replaceChildren();
            element.appendChild(filesElement);
        }

        element.appendChild(this.typeDescriptor.asElement(document));

        return element;
    }

    isValid(): this is Option<true> {
        return this.typeDescriptor.isValid();
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, "isValid" | "reasonForInvalidity">[]): InvalidityReport | null {
        tree.push(this);
        return this.typeDescriptor.reasonForInvalidity(tree, this);
    }


    _existingFlagNameByDocument = new WeakMap<Document, string>();
    getFlagName(document: Document): string {
        const existingFlagName = this._existingFlagNameByDocument.get(document);
        if (existingFlagName !== undefined) return existingFlagName;

        const flagInstances = FlagInstancesByDocument.get(document);
        if (!flagInstances) throw new Error(`FlagInstancesByDocument item not found for provided document`, {cause: {object: this, document}});

        const baseName = 'OPTION_' + this.name.replace(/[^a-zA-Z0-9]/g, '_');
        const existingFlagNames = [...flagInstances.byName.keys() ?? []].map(nameOrOption => typeof nameOrOption === 'string' ? nameOrOption : nameOrOption._existingFlagNameByDocument.get(document));

        const thisObj = this;

        // Declared as const largely so TypeScript accepts the narrowed types
        // Yes, I understand that, because functions are hoisted, we can't ensure the narrowed state, but I don't write code like that.
        // I also can't be bothered to explain that to TypeScript so here we are. Const declaration it is.
        const tryNextName = function tryNextName(suffix: number): string {
            const name = baseName + `--${suffix}`;

            if (!existingFlagNames.includes(name)) {
                thisObj._existingFlagNameByDocument.set(document, name);
                return name;
            }

            return tryNextName(suffix + 1);
        };

        return tryNextName(1);
    }

    static override parse(element: Element): Option<boolean> | null {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const name = element.getAttribute('name');
        if (name === null) return null;

        const description = element.getElementsByTagName('description')[0]?.textContent ?? '';
        const image = element.getElementsByTagName('image')[0]?.textContent ?? null;

        const flagsToSet = new Set<FlagSetter>();
        const conditionFlags = element.getElementsByTagName('conditionFlags')[0];
        if (conditionFlags) {
            for (const flagElement of conditionFlags.getElementsByTagName('flag')) {
                const flag = FlagSetter.parse(flagElement);
                if (flag) flagsToSet.add(flag);
            }
        }

        const typeDescriptorElement = element.getElementsByTagName('typeDescriptor')[0];
        const typeDescriptor = typeDescriptorElement ? TypeDescriptor.parse(typeDescriptorElement) : undefined;

        const installsToSet = new InstallPattern();
        const filesElement = element.getElementsByTagName('files')[0];
        if (filesElement) {
            for (const flagElement of filesElement.getElementsByTagName('file')) {
                const install = Install.parse(flagElement);
                if (install) installsToSet.filesWrapper.installs.add(install);
            }

            for (const flagElement of filesElement.getElementsByTagName('folder')) {
                const install = Install.parse(flagElement);
                if (install) installsToSet.filesWrapper.installs.add(install);
            }
        }

        const option = new Option<false>(name, description, image, typeDescriptor);
        option.flagsToSet = flagsToSet;

        const dependencyOnThis = new FlagDependency(option, true);
        installsToSet.dependencies?.dependencies.add(dependencyOnThis);

        return option;
    }

    override decommission(currentDocument?: Document) {
        this.flagsToSet.forEach(flag => flag.decommission?.(currentDocument));
    }
}


export class FlagSetter extends XmlRepresentation {
    static override readonly tagName = 'flag';
    readonly tagName = 'flag';

    private readonly flagInstance: FlagInstance<false, true>;

    constructor(flagInstance: FlagInstance<false, true>) {
        super();

        this.flagInstance = flagInstance;
    }

    asElement(document: Document): Element {
        const element = this.getElementForDocument(document);

        element.setAttribute('name', this.flagInstance.name);
        element.textContent = this.flagInstance.usedValue;

        return element;
    }

    isValid() { return true; }

    reasonForInvalidity(): null {
        return null;
    }

    static override parse(element: Element): FlagSetter | null {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const flagName = element.getAttribute('name');
        if (flagName === null) return null;

        const obj = new FlagSetter(new FlagInstance(flagName, element.textContent ?? '', true));
        obj.assignElement(element);
        return obj;
    }

    override decommission(currentDocument?: Document) {
        this.flagInstance.decommission?.(currentDocument);
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


/** Describes how an option should behave in regard to user selection */
export enum OptionType {
    /** The option will not be selected and cannot be selected. */
    NotUsable = 'NotUsable',
    /** Acts the same as `Optional`, except that mod managers may show a warning to the user when selecting this option. This is not universal, though, and the majority of mainstream mod managers at the moment forego this. */
    CouldBeUsable = 'CouldBeUsable',
    /** The option will be selectable. This is the default behavior. */
    Optional = 'Optional',
    /** The option will be selected by default but may be deselected. */
    Recommended = 'Recommended',
    /** The option will be selected by default and cannot be deselected. */
    Required = 'Required',
}

/** Describes the desired `OptionType` for an option
 *
 * Supports setting a default type and an optional list of conditions ('patterns') that can change the type.
 *
 * @see `OptionType`
 */
export class TypeDescriptor<TStrict extends boolean = true> extends XmlRepresentation<TStrict> {
    static override readonly tagName = 'typeDescriptor';
    readonly tagName = 'typeDescriptor';

    /** The type name descriptor */
    defaultTypeNameDescriptor: TypeNameDescriptor<'type'|'defaultType', TStrict, false>;
    patterns: TypeDescriptorPattern<TStrict>[];

    constructor(defaultType?: TypeNameDescriptor<'type'|'defaultType', TStrict, false>, patterns: TypeDescriptorPattern<TStrict>[] = []) {
        super();
        this.defaultTypeNameDescriptor = defaultType ?? new TypeNameDescriptor('defaultType', OptionType.Optional, false);
        this.patterns = patterns;
    }

    asElement(document: Document): Element {
        const element = this.getElementForDocument(document);

        if (this.patterns.length === 0) {
            this.defaultTypeNameDescriptor.tagName = 'type';
            element.appendChild(this.defaultTypeNameDescriptor.asElement(document));
            return element;
        }

        this.defaultTypeNameDescriptor.tagName = 'defaultType';

        const patternsContainer = getOrCreateElementByTagName(element, 'patterns');

        for (const pattern of this.patterns)
            patternsContainer.appendChild(pattern.asElement(document));

        return element;
    }

    static override parse(element: Element): TypeDescriptor<boolean> {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const typeDescriptor = new TypeDescriptor();
        typeDescriptor.assignElement(element);

        const defaultTypeNameDescriptorElement = element.querySelector(':scope > defaultType, :scope > type');
        if (defaultTypeNameDescriptorElement) {
            typeDescriptor.defaultTypeNameDescriptor = TypeNameDescriptor.parse(defaultTypeNameDescriptorElement);
        }

        const patternsContainer = element.querySelector(':scope > patterns');
        if (patternsContainer)
            for (const patternElement of patternsContainer.querySelectorAll(':scope > pattern'))
                typeDescriptor.patterns.push(TypeDescriptorPattern.parse(patternElement));

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
        this.patterns.forEach(pattern => pattern.decommission?.(currentDocument));
    }
}


export class TypeDescriptorPattern<TStrict extends boolean = true> extends XmlRepresentation<TStrict> {
    static override readonly tagName = 'pattern';
    readonly tagName = 'pattern';

    typeNameDescriptor: TypeNameDescriptor<'type', TStrict, true>;
    dependencies: Dependencies<'dependencies', TStrict>;

    constructor(targetType?: TypeNameDescriptor<'type', TStrict, true>, dependencies?: Dependencies<'dependencies', TStrict>) {
        super();
        this.typeNameDescriptor = targetType ?? new TypeNameDescriptor('type', OptionType.Optional, true);
        this.dependencies = dependencies ?? new Dependencies('dependencies');
    }

    asElement(document: Document): Element {
        const element = this.getElementForDocument(document);

        element.appendChild(this.typeNameDescriptor.asElement(document));
        element.appendChild(this.dependencies.asElement(document));

        return element;
    }

    static override parse(element: Element): TypeDescriptorPattern<boolean> {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const typeDescriptorPattern = new TypeDescriptorPattern<false>();
        typeDescriptorPattern.assignElement(element);

        const typeNameDescriptorElement = element.querySelector(':scope > type');
        if (typeNameDescriptorElement) typeDescriptorPattern.typeNameDescriptor = TypeNameDescriptor.parse(typeNameDescriptorElement, true);

        const dependenciesElement = element.querySelector(':scope > dependencies');
        if (dependenciesElement)  typeDescriptorPattern.dependencies = Dependencies.parse<'dependencies'>(dependenciesElement);

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
        this.dependencies.decommission?.(currentDocument);
    }
}

export class TypeNameDescriptor<TTagName extends 'type'|'defaultType', TStrict extends boolean = true, TTagNameIsReadOnly extends boolean = true> extends XmlRepresentation<TStrict> {
    static override readonly tagName = ['type', 'defaultType'];
    tagName: TTagNameIsReadOnly extends true ? TTagName : 'type'|'defaultType';
    tagNameIsReadonly: TTagNameIsReadOnly;

    targetType: TStrict extends true ? OptionType : string;

    constructor(tagName: TTagName, targetType: TStrict extends true ? OptionType : string = OptionType.Optional, tagNameIsReadonly: TTagNameIsReadOnly) {
        super();
        this.tagName = tagName;
        this.tagNameIsReadonly = tagNameIsReadonly;
        this.targetType = targetType;
    }

    asElement(document: Document): Element {
        const element = this.getElementForDocument(document);
        element.setAttribute('name', this.targetType);
        return element;
    }

    static override parse<TTagName extends 'type'|'defaultType' = 'type'|'defaultType', TTagNameIsReadOnly extends boolean = false>(element: Element, tagNameIsReadonly?: TTagNameIsReadOnly): TypeNameDescriptor<TTagName, boolean, TTagNameIsReadOnly> {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const typeDescriptorName = new TypeNameDescriptor<TTagName, boolean, TTagNameIsReadOnly>(element.tagName as TTagName, 'Optional', tagNameIsReadonly as TTagNameIsReadOnly);
        typeDescriptorName.assignElement(element);

        typeDescriptorName.targetType = element.getAttribute('name') ?? 'Optional';
        return typeDescriptorName;
    }

    isValid(): this is TypeNameDescriptor<TTagName, true, TTagNameIsReadOnly> {
        return this.targetType === 'NotUsable' || this.targetType === 'CouldBeUsable' || this.targetType === 'Optional' || this.targetType === 'Recommended' || this.targetType === 'Required';
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, "isValid" | "reasonForInvalidity">[]): InvalidityReport | null {
        tree.push(this);

        if (this.targetType !== 'NotUsable' && this.targetType !== 'CouldBeUsable' && this.targetType !== 'Optional' && this.targetType !== 'Recommended' && this.targetType !== 'Required')
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
        ensureXmlDoctype(document);

        // @ts-ignore: The logic is fine but TypeScript can't figure it out
        if (!this.tagNameIsReadonly && (element.tagName === 'type' || element.tagName === 'defaultType')) this.tagName = element.tagName;
        super.assignElement(element);
    }

    override decommission: undefined;
}
