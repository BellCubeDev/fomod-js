import { Option } from './Option';

interface FlagInstances {
    all: Set<FlagInstance<boolean, boolean>>;
    byName: Map<string|Option, Set<FlagInstance<boolean, boolean>>>;
}

/** A [weak map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) of documents to flag instances within that document.
 *
 * This map allows for quick access to all flag instances within a document as well as all flag instances with a given name.
 */
export const FlagInstancesByDocument = new WeakMap<Document, FlagInstances>();

export class FlagInstance<TIsOption extends boolean, TWrite extends (TIsOption extends true ? false : boolean)> {
    private _name: TIsOption extends true ? Option : string;

    /** The name of the flag this instance refers to
     *
     * Automatically updates the flag instance map when changed.
    */
    get name() { return this._name; }
    set name(value: TIsOption extends true ? Option : string) {
        if (this.name === value) {
            this._name = value;
            return;
        }

        this.documents.forEach(document => {
            const instances = FlagInstancesByDocument.get(document);
            if (!instances) return;

            instances.byName.get(this.name)?.delete(this);

            let instancesByName = instances.byName.get(value);
            if (!instancesByName) {
                instancesByName = new Set();
                instances.byName.set(value, instancesByName);
            }

            instancesByName.add(this);
        });

        this._name = value;
    }


    /** The value being checked/set by this instance
     *
     * When the flag represents a traditional key-value, this will be a string. When the flag represents an option's select state, this will be a boolean.
    */
    usedValue: TIsOption extends true ? boolean : string;

    /** Whether this instance is reading or writing the flag value
     *
     * When the flag represents an option's select state, this mist be `false` (since you cannot set the value of an option's select state)
    */
    write: TWrite;

    /** A list of documents this flag is a part of */
    documents: Set<Document> = new Set();

    constructor(name: TIsOption extends true ? never : string, usedValue: string, write: TWrite, document?: Document)
    constructor(name: TIsOption extends true ? Option : never, usedValue: boolean, write: TWrite, document?: Document)
    constructor(name: TIsOption extends true ? Option : string, usedValue: TIsOption extends true? boolean : string, write: TWrite, document?: Document) {
        if (typeof name === 'string' && typeof usedValue !== 'string') throw new Error(`FlagInstance's 'usedValue' property must be a string when name is a string`);
        else if (name instanceof Option && typeof usedValue !== 'boolean') throw new Error(`FlagInstance's 'usedValue' property must be a boolean when name is an Option`);

        this._name = name;
        this.usedValue = usedValue as TIsOption extends true ? boolean : string;
        this.write = write;

        if (document) this.attachDocument(document);
    }

    /** Attaches this flag instance to a document */
    attachDocument(document: Document) {
        this.documents.add(document);

        let instancesForDoc = FlagInstancesByDocument.get(document);
        if (!instancesForDoc) {
            instancesForDoc = {
                all: new Set(),
                byName: new Map(),
            };
            FlagInstancesByDocument.set(document, instancesForDoc);
        }

        instancesForDoc.all.add(this);

        let instancesByNameSet = instancesForDoc.byName.get(this.name);
        if (!instancesByNameSet) {
            instancesByNameSet = new Set();
            instancesForDoc.byName.set(this.name, instancesByNameSet);
        }

        instancesByNameSet.add(this);
    }

    /** Removes this flag instance from a document */
    removeFromDocument(document: Document) {
        const instancesForDoc = FlagInstancesByDocument.get(document);
        if (!instancesForDoc) {
            this.documents.delete(document);
            return;
        }

        instancesForDoc.all.delete(this);
        instancesForDoc.byName.get(this.name)?.delete(this);

        this.documents.delete(document);
    }

    /** Cleans up the document map */
    delete() {
        this.documents.forEach(document => this.removeFromDocument(document));
    }

    decommission(currentDocument?: Document) {
        currentDocument ? this.removeFromDocument(currentDocument) : this.delete();
    }
}