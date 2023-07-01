import { ensureXmlDoctype } from "../DomUtils";
import { Dependencies } from "./Dependencies";
import { InvalidityReason, InvalidityReport } from "./InvalidityReporting";
import { Verifiable, XmlRepresentation } from "./_core";





// TODO: Use patorjk ASCII art generator
// Single-File Install





interface InstallInstances {
    all: Set<Install<boolean>>;
    bySource: Map<string, Set<Install<boolean>>>;
    byDestination: Map<string, Set<Install<boolean>>>;
}

/** A [weak map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) of documents to flag instances within that document.
 *
 * This map allows for quick access to all flag instances within a document as well as all flag instances with a given name.
 */
export const InstallInstancesByDocument = new WeakMap<Document, InstallInstances>();

export class Install<TStrict extends boolean = true> extends XmlRepresentation<TStrict> {
    static override readonly tagName = ['file', 'folder'];
    tagName: 'file'|'folder' = 'file'; // Very interchangeable;

    /** File path relative to the archive root to install this file from.
     *
     * Whether a folder is being installed or not will be determined by if the path ends with a slash. It **WILL** cause errors later down the line if the source and destination paths are not the same type.
     */
    fileSource: string;

    /** File path relative to the archive root to install this file from. If no destination is provided, the file will be installed to the same path as the source.
     *
     * Whether a folder is being installed or not will be determined by if the path ends with a slash. It **WILL** cause errors later down the line if the source and destination paths are not the same type.
     */
    fileDestination: string | null;

    /** Whether to always install the file, even if the user has not selected it.
     *
     * @deprecated Has inconsistent behavior between mod managers. Instead, you might consider removing the `dependencies` object instead. Included for completeness.
     */
    alwaysInstall: TStrict extends true ? `${boolean}` : string = 'false';

    /** Whether to always install the file if it is considered "usable"
     *
     * @deprecated Has inconsistent behavior between mod managers. Instead, you might consider duplicating the `dependencies` object to specify when a file should be installed. Included for completeness.
     */
    installIfUsable: TStrict extends true ? `${boolean}` : string = 'false';

    /** The priority of this file install. Higher priority files will be installed first. Must be an integer.
     *
     * Defaults to `0`. If the value is `0`, the value will not be written to the element.
     */
    priority: TStrict extends true ? `${bigint}` : string;


    /** A list of documents this install is a part of */
    documents: Set<Document> = new Set();

    isValid(): this is Install<true> {
        try { BigInt(this.priority); }
        catch { return false; }

        return (
            (this.alwaysInstall === 'true' || this.alwaysInstall === 'false') &&
            (this.installIfUsable === 'true' || this.installIfUsable === 'false')
        );
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, 'isValid' | 'reasonForInvalidity'>[]): InvalidityReport | null {
        tree.push(this);

        try { BigInt(this.priority); }
        catch {
            return { reason: InvalidityReason.InstallPriorityNotInteger, offendingValue: this.priority, tree };
        }

        if (this.alwaysInstall !== 'true' && this.alwaysInstall !== 'false')
            return { reason: InvalidityReason.InstallAlwaysInstallNotBoolean, offendingValue: this.priority, tree };

        if (this.installIfUsable !== 'true' && this.installIfUsable !== 'false')
            return { reason: InvalidityReason.InstallInstallIfUsableNotBoolean, offendingValue: this.priority, tree };

        return null;
    }

    constructor(fileSource: string = '', fileDestination: string | null = null, priority: TStrict extends true ? `${bigint}` : string, document?: Document) {
        super();

        this.fileSource = fileSource;
        this.fileDestination = fileDestination;
        this.priority = priority;

        if (document) this.attachDocument(document);
    }

    /** Generates an XML element from this object.
     */
    asElement(document: Document): Element  {
        if (this.fileSource.endsWith('/') || this.fileSource.endsWith('\\')) {
            if (this.fileDestination && (!this.fileDestination.endsWith('/') && !this.fileDestination.endsWith('\\'))) throw new Error('Source is a folder but destination is not', {cause: this});
            this.tagName = 'folder';
        } else if (this.fileDestination && (this.fileDestination.endsWith('/') || this.fileDestination.endsWith('\\'))) throw new Error('Destination is a folder but source is not', {cause: this});
        else this.tagName = 'file';

        const element = this.getElementForDocument(document);

        element.setAttribute('source', this.fileSource);
        if (this.fileDestination) element.setAttribute('destination', this.fileDestination);

        if (this.priority !== '0') element.setAttribute('priority', this.priority);
        else element.removeAttribute('priority');

        if (this.alwaysInstall !== 'false') element.setAttribute('alwaysInstall', this.alwaysInstall);
        else element.removeAttribute('alwaysInstall');

        if (this.installIfUsable !== 'false') element.setAttribute('installIfUsable', this.installIfUsable);
        else element.removeAttribute('installIfUsable');

        return element;
    }

    static override parse(element: Element): Install<boolean> {
        let source = element.getAttribute('source') ?? '';
        let destination = element.getAttribute('destination') ?? null;

        if (element.tagName === 'folder') {
            if (!source.endsWith('/')) source += '/';
            if (destination && !destination.endsWith('/')) destination += '/';
        }

        const install = new Install<boolean>( source, destination, element.getAttribute('priority') ?? '0' );

        install.alwaysInstall = element.getAttribute('alwaysInstall') ?? 'false';
        install.installIfUsable = element.getAttribute('installIfUsable') ?? 'false';

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
        ensureXmlDoctype(document);

        if (element.tagName === 'file' || element.tagName === 'folder') this.tagName = element.tagName;
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

    decommission(currentDocument?: Document) {
        if (currentDocument) this.removeFromDocument(currentDocument);
        else this.documents.forEach(document => this.removeFromDocument(document));
    }
}












// TODO: Use patorjk ASCII art generator
// Files Wrapper





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
export class InstallPatternFilesWrapper<TStrict extends boolean = true> extends XmlRepresentation<TStrict> {
    static override tagName = 'files';
    readonly tagName = 'files';

    installs: Set<Install<TStrict>> = new Set();

    constructor() {
        super();
    }

    override asElement(document: Document): Element {
        const el = this.getElementForDocument(document);

        for(const install of this.installs.values())
            el.appendChild(install.asElement(document));

        return el;
    }

    override isValid(): this is InstallPatternFilesWrapper<true> {
        for(const install of this.installs.values())
            if (!install.isValid()) return false;

        return true;
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, 'isValid' | 'reasonForInvalidity'>[]): InvalidityReport | null {
        tree.push(this);

        for (const install of this.installs.values()) {
            const reason = install.reasonForInvalidity(...tree);
            if (reason) return reason;
        }

        return null;
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
export class InstallPattern<TStrict extends boolean = true> extends XmlRepresentation<TStrict> {
    static override tagName = 'pattern';
    readonly tagName = 'pattern';

    dependencies: Dependencies<'dependencies', TStrict>|null = null;
    filesWrapper: InstallPatternFilesWrapper = new InstallPatternFilesWrapper();

    constructor() {
        super();
    }

    override asElement(document: Document): Element {
        if (!this.dependencies || this.dependencies.dependencies.size === 0) {
            this.documentMap.get(document)?.remove();
            return this.filesWrapper.asElement(document);
        }

        const el = this.getElementForDocument(document);
        el.appendChild(this.dependencies.asElement(document));
        el.appendChild(this.filesWrapper.asElement(document));

        return el;
    }

    override isValid(): this is InstallPattern<true> {
        return this.filesWrapper.isValid() && (this.dependencies ? this.dependencies.isValid() : true);
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
}
