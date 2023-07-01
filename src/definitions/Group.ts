import { getOrCreateElementByTagName } from "../DomUtils";
import { InvalidityReason, InvalidityReport } from "./InvalidityReporting";
import { Option } from "./Option";
import { SortingOrder } from "./Step";
import { ElementObjectMap, Verifiable, XmlRepresentation } from "./_core";

/** Describes how the group should behave when allowing users to select its options */
export enum GroupBehaviorType {
    /** Users may select or deselect any otherwise-selectable option within the group without restriction. */
    SelectAny = 'SelectAny',
    /** Users must select at least one otherwise-selectable option within the group. */
    SelectAtLeastOne = 'SelectAtLeastOne',
    /** Users may select no option or a single, otherwise-selectable option within the group. */
    SelectAtMostOne = 'SelectAtMostOne',
    /** Users must select exactly one otherwise-selectable option within the group; no more, no less. This is the default behavior. */
    SelectExactlyOne = 'SelectExactlyOne',
    /** All options in the group are forcibly selected and cannot be deselected. */
    SelectAll = 'SelectAll'
}

export class Group<TStrict extends boolean = true> extends XmlRepresentation<TStrict> {
    static override readonly tagName = 'group';
    readonly tagName = 'group';

    name: string;
    behaviorType: TStrict extends true ? GroupBehaviorType : string;
    sortingOrder: TStrict extends true ? SortingOrder : string;
    options: Set<Option<TStrict>> = new Set();

    constructor(name: string = '', behaviorType: TStrict extends true ? GroupBehaviorType : string = GroupBehaviorType.SelectExactlyOne, sortingOrder: TStrict extends true ? SortingOrder : string = SortingOrder.Ascending) {
        super();

        this.name = name;
        this.behaviorType = behaviorType;
        this.sortingOrder = sortingOrder;
    }

    asElement(document: Document): Element {
        const element = this.getElementForDocument(document);

        element.setAttribute('name', this.name);
        element.setAttribute('type', this.behaviorType);

        const optionsContainer = getOrCreateElementByTagName(element, 'plugins');

        optionsContainer.setAttribute('order', this.sortingOrder);
        for (const option of this.options) optionsContainer.appendChild(option.asElement(document));

        return element;
    }

    isValid(): this is Group<true> {
        return (
            ( this.behaviorType === 'SelectAny' || this.behaviorType === 'SelectAtLeastOne' || this.behaviorType === 'SelectAtMostOne' || this.behaviorType === 'SelectExactlyOne' || this.behaviorType === 'SelectAll' ) &&
            ( this.sortingOrder === 'Ascending' || this.sortingOrder === 'Descending' || this.sortingOrder === 'Explicit' ) &&
            Array.from(this.options).every(option => option.isValid())
        );
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, 'isValid' | 'reasonForInvalidity'>[]): InvalidityReport | null {
        tree.push(this);

        if (this.behaviorType !== 'SelectAny' && this.behaviorType !== 'SelectAtLeastOne' && this.behaviorType !== 'SelectAtMostOne' && this.behaviorType !== 'SelectExactlyOne' && this.behaviorType !== 'SelectAll')
            return { reason: InvalidityReason.GroupUnknownBehaviorType, offendingValue: this.behaviorType, tree };

        if (this.sortingOrder !== 'Ascending' && this.sortingOrder !== 'Descending' && this.sortingOrder !== 'Explicit')
            return { reason: InvalidityReason.GroupUnknownOptionSortingOrder, offendingValue: this.sortingOrder, tree };

        for (const option of this.options) {
            const reason = option.reasonForInvalidity(...tree);
            if (reason !== null) return reason;
        }

        return null;
    }

    static override parse(element: Element): Group<boolean> {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const name = element.getAttribute('name');
        const behaviorType = element.getAttribute('behaviorType');

        const group = new Group<false>(name ?? '', behaviorType ?? '');
        group.assignElement(element);

        const optionsContainer = element.querySelector('plugins');
        if (optionsContainer === null) return group;

        const sortingOrder = optionsContainer.getAttribute('order');
        if (sortingOrder !== null) group.sortingOrder = sortingOrder;

        for (const optionElement of optionsContainer.querySelectorAll('option')) {
            const option = Option.parse(optionElement);
            if (option !== null) group.options.add(option);
        }

        return group;
    }

    decommission(currentDocument?: Document) {
        this.options.forEach(option => option.decommission(currentDocument));
    }
}
