import { XmlRepresentation } from "../../lib/XmlRepresentation";
import { FomodDocumentConfig } from "../../lib/FomodDocumentConfig";
import type { Option } from "../Option";

/** A parent class to all forms of dependency.
 *
 * @template TStrict Whether or not to use strict typing for this class. Any data parsed from user input should be considered untrusted and thus `false` should be used. Otherwise, `true` should be used.
 *
 * NOTE: Many of the Dependency types cannot be statically validated and thus do not have a `TStrict` parameter.
 */
export abstract class Dependency<TStrict extends boolean = boolean> extends XmlRepresentation<TStrict> {
    // static override parse = parseDependency; // defined in the index file to avoid circular dependencies

    abstract override asElement(document: Document, config?: FomodDocumentConfig | undefined, knownOptions?: Option<boolean>[]): Element;
}
