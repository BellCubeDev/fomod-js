import { getOrCreateElementByTagName } from "../DomUtils";
import { Group } from "./Group";
import { InvalidityReason, InvalidityReport } from "./InvalidityReporting";
import { ElementObjectMap, Verifiable, XmlRepresentation } from "./_core";

/** Describes how the group should behave when allowing users to select its options */
export enum SortingOrder {
    /** Items are ordered alphabetically starting with A and ending with Z. This is the default behavior. */
    Ascending = 'Ascending',
    /** Items are ordered alphabetically starting with Z and ending with A. */
    Descending = 'Descending',
    /** Items are ordered precisely as they appear in the XML (and, consequently, the Set within JS) */
    Explicit = 'Explicit'
}

export class Step<TStrict extends boolean = true> extends XmlRepresentation<TStrict> {
    static override readonly tagName = 'installStep';
    readonly tagName = 'installStep';

    name: string;
    sortingOrder: TStrict extends true ? SortingOrder : string;
    groups: Set<Group<TStrict>> = new Set();

    constructor(name: string = '', sortingOrder: TStrict extends true ? SortingOrder : string = SortingOrder.Ascending) {
        super();

        this.name = name;
        this.sortingOrder = sortingOrder;
    }

    asElement(document: Document): Element {
        const element = this.getElementForDocument(document);

        element.setAttribute('name', this.name);

        const groupsContainer = getOrCreateElementByTagName(element, 'optionalFileGroups');

        groupsContainer.setAttribute('order', this.sortingOrder);
        for (const group of this.groups)  groupsContainer.appendChild(group.asElement(document));

        return element;
    }

    isValid(): this is Step<true> {
        return (
            (this.sortingOrder === 'Ascending' || this.sortingOrder === 'Descending' || this.sortingOrder === 'Explicit') &&
            Array.from(this.groups).every(group => group.isValid())
        );
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, 'isValid' | 'reasonForInvalidity'>[]): InvalidityReport | null {
        tree.push(this);

        if (this.sortingOrder !== 'Ascending' && this.sortingOrder !== 'Descending' && this.sortingOrder !== 'Explicit')
            return { reason: InvalidityReason.StepUnknownGroupSortingOrder, offendingValue: this.sortingOrder, tree };

        for (const group of this.groups) {
            const reason = group.reasonForInvalidity(...tree, this);
            if (reason !== null) return reason;
        }

        return null;
    }

    static override parse(element: Element): Step<boolean> {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const name = element.getAttribute('name');

        const step = new Step<false>(name ?? '');
        step.assignElement(element);

        const groupsContainer = element.querySelector('optionalFileGroups');
        if (groupsContainer === null) return step;

        const sortingOrder = groupsContainer.getAttribute('order');
        if (sortingOrder !== null) step.sortingOrder = sortingOrder;

        for (const groupElement of groupsContainer.querySelectorAll('group')) {
            const group = Group.parse(groupElement);
            if (group !== null) step.groups.add(group);
        }

        return step;
    }

    override decommission(currentDocument?: Document | undefined) {
        for (const group of this.groups) group.decommission(currentDocument);
    }
}
