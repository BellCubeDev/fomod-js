import { ensureXmlDoctype, } from "../../DomUtils";
import { DependenciesGroup } from "./dependencies/DependenciesGroup";
import { InvalidityReason, InvalidityReport } from "../lib/InvalidityReporting";
import { ElementObjectMap, Verifiable, XmlRepresentation } from "../lib/XmlRepresentation";
import { AttributeName, BooleanString, TagName } from "../Enums";
import { FomodDocumentConfig } from "../lib/FomodDocumentConfig";
import type { Option } from "./Option";
import type { MaybeStrictBoolString, MaybeStrictIntString } from "../../TypeUtils";





/***
 *     $$$$$$\  $$\                     $$\                   $$$$$$$$\ $$\ $$\
 *    $$  __$$\ \__|                    $$ |                  $$  _____|\__|$$ |
 *    $$ /  \__|$$\ $$$$$$$\   $$$$$$\  $$ | $$$$$$\          $$ |      $$\ $$ | $$$$$$\
 *    \$$$$$$\  $$ |$$  __$$\ $$  __$$\ $$ |$$  __$$\ $$$$$$\ $$$$$\    $$ |$$ |$$  __$$\
 *     \____$$\ $$ |$$ |  $$ |$$ /  $$ |$$ |$$$$$$$$ |\______|$$  __|   $$ |$$ |$$$$$$$$ |
 *    $$\   $$ |$$ |$$ |  $$ |$$ |  $$ |$$ |$$   ____|        $$ |      $$ |$$ |$$   ____|
 *    \$$$$$$  |$$ |$$ |  $$ |\$$$$$$$ |$$ |\$$$$$$$\         $$ |      $$ |$$ |\$$$$$$$\
 *     \______/ \__|\__|  \__| \____$$ |\__| \_______|        \__|      \__|\__| \_______|
 *                            $$\   $$ |
 *                            \$$$$$$  |
 *                             \______/
 *    $$$$$$\                       $$\               $$\ $$\
 *    \_$$  _|                      $$ |              $$ |$$ |
 *      $$ |  $$$$$$$\   $$$$$$$\ $$$$$$\    $$$$$$\  $$ |$$ |
 *      $$ |  $$  __$$\ $$  _____|\_$$  _|   \____$$\ $$ |$$ |
 *      $$ |  $$ |  $$ |\$$$$$$\    $$ |     $$$$$$$ |$$ |$$ |
 *      $$ |  $$ |  $$ | \____$$\   $$ |$$\ $$  __$$ |$$ |$$ |
 *    $$$$$$\ $$ |  $$ |$$$$$$$  |  \$$$$  |\$$$$$$$ |$$ |$$ |
 *    \______|\__|  \__|\_______/    \____/  \_______|\__|\__|
 *
 *
 *
 */




export interface InstallInstances {
    all: Set<Install<boolean>>;
    bySource: Map<string, Set<Install<boolean>>>;
    byDestination: Map<string, Set<Install<boolean>>>;
}

/** A [weak map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) of documents to flag instances within that document.
 *
 * This map allows for quick access to all flag instances within a document as well as all flag instances with a given name.
 */
export const InstallInstancesByDocument = new WeakMap<Document, InstallInstances>();

type InstallTagName = TagName.File|TagName.Folder;

export class Install<TStrict extends boolean> extends XmlRepresentation<TStrict> {
    static override readonly tagName = [TagName.File, TagName.Folder] as [TagName.File, TagName.Folder];
    tagName: InstallTagName = TagName.File; // Very interchangeable;


    /** A list of documents this install is a part of */
    documents: Set<Document> = new Set();

    isValid(): this is Install<true> {
        try { BigInt(this.priority); }
        catch { return false; }

        return (
            Object.values(BooleanString).includes(this.alwaysInstall as any) &&
            Object.values(BooleanString).includes(this.installIfUsable as any)
        );
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, 'isValid' | 'reasonForInvalidity'>[]): InvalidityReport | null {
        tree.push(this);

        try { BigInt(this.priority); }
        catch {
            return { reason: InvalidityReason.InstallPriorityNotInteger, offendingValue: this.priority, tree };
        }

        if (!Object.values(BooleanString).includes(this.alwaysInstall as any))
            return { reason: InvalidityReason.InstallAlwaysInstallNotBoolean, offendingValue: this.priority, tree };

        if (!Object.values(BooleanString).includes(this.installIfUsable as any))
            return { reason: InvalidityReason.InstallInstallIfUsableNotBoolean, offendingValue: this.priority, tree };

        return null;
    }

    constructor(
        /** File path relative to the archive root to install this file from.
         *
         * Whether a folder is being installed or not will be determined by if the path ends with a slash. It **WILL** cause errors later down the line if the source and destination paths are not the same type.
         */
        public fileSource: string = '',

        /** File path relative to the archive root to install this file from. If no destination is provided, the file will be installed to the same path as the source.
         *
         * Whether a folder is being installed or not will be determined by if the path ends with a slash. It **WILL** cause errors later down the line if the source and destination paths are not the same type.
         */
        public fileDestination: string | null = null,

        /** The priority of this file install. Higher priority files will be installed first. Must be an integer.
         *
         * Defaults to `0`. If the value is `0`, the value will not be written to the element.
        */
       public priority: MaybeStrictIntString<TStrict> = '0',

        document?: Document,

        /** Whether to always install the file if it is considered "usable"
         *
         * @deprecated Has inconsistent behavior between mod managers. Instead, you might consider duplicating the `dependencies` object to specify when a file should be installed. Included for completeness.
         */
        public installIfUsable: MaybeStrictBoolString<TStrict> = BooleanString.false,

        /** Whether to always install the file, even if the user has not selected it.
         *
         * @deprecated Has inconsistent behavior between mod managers. Instead, you might consider removing the `dependencies` object instead. Included for completeness.
         */
        public alwaysInstall: MaybeStrictBoolString<TStrict> = BooleanString.false,
    ) {
        super();

        if (document) this.attachDocument(document);
    }

    /** Generates an XML element from this object.
     */
    asElement(document: Document, config: FomodDocumentConfig = {}): Element  {
        if (this.fileSource.endsWith('/') || this.fileSource.endsWith('\\')) {
            if (this.fileDestination && (!this.fileDestination.endsWith('/') && !this.fileDestination.endsWith('\\'))) throw new Error('Source is a folder but destination is not', {cause: this});
            this.tagName = TagName.Folder;
        } else if (this.fileDestination && (this.fileDestination.endsWith('/') || this.fileDestination.endsWith('\\'))) throw new Error('Destination is a folder but source is not', {cause: this});
        else this.tagName = TagName.File;

        const element = this.getElementForDocument(document);
        this.associateWithDocument(document);

        element.setAttribute(AttributeName.Source, this.fileSource);
        if (this.fileDestination) element.setAttribute(AttributeName.Destination, this.fileDestination);

        if (this.priority !== '0') element.setAttribute(AttributeName.Priority, this.priority);
        else element.removeAttribute(AttributeName.Priority);

        if (this.alwaysInstall !== BooleanString.false) element.setAttribute(AttributeName.AlwaysInstall, this.alwaysInstall);
        else element.removeAttribute(AttributeName.AlwaysInstall);

        if (this.installIfUsable !== BooleanString.false) element.setAttribute(AttributeName.InstallIfUsable, this.installIfUsable);
        else element.removeAttribute(AttributeName.InstallIfUsable);

        return element;
    }

    static override parse(element: Element, config: FomodDocumentConfig = {}): Install<boolean> {
        let source = element.getAttribute(AttributeName.Source) ?? '';
        let destination = element.getAttribute(AttributeName.Destination) ?? null;

        if (element.tagName === TagName.Folder) {
            if (!source.endsWith('/')) source += '/';
            if (destination && !destination.endsWith('/')) destination += '/';
        }

        const install = new Install<boolean>( source, destination, element.getAttribute(AttributeName.Priority) ?? '0' );
        install.assignElement(element);

        install.alwaysInstall = element.getAttribute(AttributeName.AlwaysInstall) ?? BooleanString.false;
        install.installIfUsable = element.getAttribute(AttributeName.InstallIfUsable) ?? BooleanString.false;

        return install;
    }

    // Overwrite to handle the interchangeable `file` and `folder` tags
    override getElementForDocument(document: Document): Element {
        ensureXmlDoctype(document);

        const existingElement = super.getElementForDocument(document);
        if (existingElement.tagName === this.tagName) return existingElement;

        this.documentMap.delete(document);
        const newElement = this.getElementForDocument(document);

        for (let i = 0 - 1; i < existingElement.attributes.length; i++)
            newElement.setAttributeNode(existingElement.attributes[i]!.cloneNode(true) as Attr);

        newElement.replaceChildren(...existingElement.children);

        existingElement.replaceWith(newElement);

        return newElement;
    }

    // Overwrite to handle the interchangeable `file` and `folder` tags
    override assignElement(element: Element) {
        ensureXmlDoctype(element.ownerDocument);

        if (element.tagName === TagName.File || element.tagName === TagName.Folder) this.tagName = element.tagName;
        super.assignElement(element);
    }

    /** Attaches this flag instance to a document */
    attachDocument(document: Document) {
        this.documents.add(document);

        let instancesForDoc = InstallInstancesByDocument.get(document);
        if (!instancesForDoc) {
            instancesForDoc = {
                all: new Set(),
                bySource: new Map(),
                byDestination: new Map(),
            };
            InstallInstancesByDocument.set(document, instancesForDoc);
        }

        instancesForDoc.all.add(this);

        let instancesBySourceSet = instancesForDoc.bySource.get(this.fileSource);
        if (!instancesBySourceSet) {
            instancesBySourceSet = new Set();
            instancesForDoc.bySource.set(this.fileSource, instancesBySourceSet);
        }
        instancesBySourceSet.add(this);

        let instancesByDestinationSet = instancesForDoc.byDestination.get(this.fileDestination ?? this.fileSource);
        if (!instancesByDestinationSet) {
            instancesByDestinationSet = new Set();
            instancesForDoc.byDestination.set(this.fileDestination ?? this.fileSource, instancesByDestinationSet);
        }
        instancesByDestinationSet.add(this);
    }

    /** Removes this flag instance from a document */
    removeFromDocument(document: Document) {
        const instancesForDoc = InstallInstancesByDocument.get(document);
        if (!instancesForDoc) {
            this.documents.delete(document);
            return;
        }

        instancesForDoc.all.delete(this);
        instancesForDoc.bySource.get(this.fileSource)?.delete(this);
        instancesForDoc.byDestination.get(this.fileDestination ?? this.fileSource)?.delete(this);

        this.documents.delete(document);
    }

    associateWithDocument(document: Document) {
        if (!this.documents.has(document)) this.attachDocument(document);
    }

    decommission(currentDocument?: Document) {
        if (currentDocument) this.removeFromDocument(currentDocument);
        else this.documents.forEach(document => this.removeFromDocument(document));
    }
}










/***
 *    $$$$$$$$\ $$\ $$\                           $$\      $$\
 *    $$  _____|\__|$$ |                          $$ | $\  $$ |
 *    $$ |      $$\ $$ | $$$$$$\   $$$$$$$\       $$ |$$$\ $$ | $$$$$$\   $$$$$$\   $$$$$$\   $$$$$$\   $$$$$$\   $$$$$$\
 *    $$$$$\    $$ |$$ |$$  __$$\ $$  _____|      $$ $$ $$\$$ |$$  __$$\  \____$$\ $$  __$$\ $$  __$$\ $$  __$$\ $$  __$$\
 *    $$  __|   $$ |$$ |$$$$$$$$ |\$$$$$$\        $$$$  _$$$$ |$$ |  \__| $$$$$$$ |$$ /  $$ |$$ /  $$ |$$$$$$$$ |$$ |  \__|
 *    $$ |      $$ |$$ |$$   ____| \____$$\       $$$  / \$$$ |$$ |      $$  __$$ |$$ |  $$ |$$ |  $$ |$$   ____|$$ |
 *    $$ |      $$ |$$ |\$$$$$$$\ $$$$$$$  |      $$  /   \$$ |$$ |      \$$$$$$$ |$$$$$$$  |$$$$$$$  |\$$$$$$$\ $$ |
 *    \__|      \__|\__| \_______|\_______/       \__/     \__|\__|       \_______|$$  ____/ $$  ____/  \_______|\__|
 *                                                                                 $$ |      $$ |
 *                                                                                 $$ |      $$ |
 *                                                                                 \__|      \__|
 */









/** A helper class to represent the <files> element. Contains a list of files to be installed by a dependency or option. */
export class InstallPatternFilesWrapper<TStrict extends boolean> extends XmlRepresentation<TStrict> {
    static override tagName = TagName.Files;
    readonly tagName = TagName.Files;

    constructor(
        public installs: Set<Install<TStrict>> = new Set(),
    ) {
        super();
    }

    override asElement(document: Document, config: FomodDocumentConfig = {}): Element {
        const el = this.getElementForDocument(document);
        this.associateWithDocument(document);

        for(const install of this.installs.values())
            el.appendChild(install.asElement(document, config));

        return el;
    }

    override isValid(): this is InstallPatternFilesWrapper<true> {
        for(const install of this.installs.values())
            if (!install.isValid()) return false;

        return true;
    }

    static override parse(element: Element, config: FomodDocumentConfig = {}): InstallPatternFilesWrapper<boolean> {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const installs = new Set<Install<boolean>>();

        for (const child of element.children) {
            const install = Install.parse(child, config);
            installs.add(install);
        }

        const obj = new InstallPatternFilesWrapper(installs);
        obj.assignElement(element);
        return obj;
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, 'isValid' | 'reasonForInvalidity'>[]): InvalidityReport | null {
        tree.push(this);

        for (const install of this.installs.values()) {
            const reason = install.reasonForInvalidity(...tree);
            if (reason) return reason;
        }

        return null;
    }

    associateWithDocument(document: Document) {
        this.installs.forEach(i => i.associateWithDocument(document));
    }

    decommission(currentDocument?: Document ) {
        this.installs.forEach(install => install.decommission(currentDocument));
    }

}

















/***
 *    $$$$$$\                       $$\               $$\ $$\
 *    \_$$  _|                      $$ |              $$ |$$ |
 *      $$ |  $$$$$$$\   $$$$$$$\ $$$$$$\    $$$$$$\  $$ |$$ |
 *      $$ |  $$  __$$\ $$  _____|\_$$  _|   \____$$\ $$ |$$ |
 *      $$ |  $$ |  $$ |\$$$$$$\    $$ |     $$$$$$$ |$$ |$$ |
 *      $$ |  $$ |  $$ | \____$$\   $$ |$$\ $$  __$$ |$$ |$$ |
 *    $$$$$$\ $$ |  $$ |$$$$$$$  |  \$$$$  |\$$$$$$$ |$$ |$$ |
 *    \______|\__|  \__|\_______/    \____/  \_______|\__|\__|
 *
 *
 *
 *    $$$$$$$\              $$\       $$\
 *    $$  __$$\             $$ |      $$ |
 *    $$ |  $$ | $$$$$$\  $$$$$$\   $$$$$$\    $$$$$$\   $$$$$$\  $$$$$$$\
 *    $$$$$$$  | \____$$\ \_$$  _|  \_$$  _|  $$  __$$\ $$  __$$\ $$  __$$\
 *    $$  ____/  $$$$$$$ |  $$ |      $$ |    $$$$$$$$ |$$ |  \__|$$ |  $$ |
 *    $$ |      $$  __$$ |  $$ |$$\   $$ |$$\ $$   ____|$$ |      $$ |  $$ |
 *    $$ |      \$$$$$$$ |  \$$$$  |  \$$$$  |\$$$$$$$\ $$ |      $$ |  $$ |
 *    \__|       \_______|   \____/    \____/  \_______|\__|      \__|  \__|
 *
 *
 *
 */


/** A helper class to represent the <pattern> element. Contains a list of files to install and a list of dependencies that must first be fulfilled. */
export class InstallPattern<TStrict extends boolean> extends XmlRepresentation<TStrict> {
    static override tagName = TagName.Pattern;
    readonly tagName = TagName.Pattern;

    constructor(
        public dependencies: DependenciesGroup<TagName.Dependencies, TStrict> = new DependenciesGroup<TagName.Dependencies, TStrict>(TagName.Dependencies),
        public filesWrapper: InstallPatternFilesWrapper<TStrict> = new InstallPatternFilesWrapper(),
    ) {
        super();
    }

    override asElement(document: Document, config: FomodDocumentConfig = {}, knownOptions: Option<boolean>[] = []): Element {
        const el = this.getElementForDocument(document);
        this.associateWithDocument(document);

        el.appendChild(this.dependencies.asElement(document, config, knownOptions));
        el.appendChild(this.filesWrapper.asElement(document, config));

        return el;
    }

    override isValid(): this is InstallPattern<true> {
        return this.filesWrapper.isValid() && (this.dependencies ? this.dependencies.isValid() : true);
    }

    static override parse(element: Element, config: FomodDocumentConfig = {}): InstallPattern<boolean> {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const dependenciesElement = element.querySelector(`:scope > ${TagName.Dependencies}`);
        const dependencies = dependenciesElement ? DependenciesGroup.parse<TagName.Dependencies>(dependenciesElement) : undefined;

        const filesElement = element.querySelector(`:scope > ${TagName.Files}`);
        const filesWrapper = filesElement ? InstallPatternFilesWrapper.parse(filesElement, config) : undefined;

        const obj = new InstallPattern(dependencies, filesWrapper);
        obj.assignElement(element);
        return obj;
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, 'isValid' | 'reasonForInvalidity'>[]): InvalidityReport | null {
        tree.push(this);

        for (const install of this.filesWrapper.installs.values()) {
            const reason = install.reasonForInvalidity(...tree);
            if (reason) return reason;
        }

        if (this.dependencies && !this.dependencies.isValid()) {
            const reason = this.dependencies.reasonForInvalidity(...tree);

            if (reason) return reason;
        }

        return null;
    }

    decommission(currentDocument?: Document ) {
        this.filesWrapper.decommission(currentDocument);
        this.dependencies?.decommission(currentDocument);
    }

    associateWithDocument(document: Document) {
        this.filesWrapper.installs.forEach(i => i.associateWithDocument(document));
        this.dependencies?.associateWithDocument(document);
    }
}
