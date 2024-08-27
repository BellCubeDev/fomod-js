import { getOrCreateElementByTagNameSafe } from "../../DomUtils";
import { InvalidityReason, InvalidityReport } from "../lib/InvalidityReporting";
import { Option } from "./Option";
import { ElementObjectMap, Verifiable, XmlRepresentation } from "../lib/XmlRepresentation";
import { AttributeName, GroupBehaviorType, SortingOrder, TagName } from "../Enums";
import { DefaultFomodDocumentConfig, FomodDocumentConfig } from "../lib/FomodDocumentConfig";
import { parseOptionFlags } from "../lib/ParseOptionFlags";
import { gatherFlagDependencies } from "../lib/utils";

export class Group<TStrict extends boolean> extends XmlRepresentation<TStrict> {
    static override readonly tagName = TagName.Group;
    readonly tagName = TagName.Group;


    constructor(
        public name: string = '',
        public behaviorType: MaybeStrictString<GroupBehaviorType, TStrict> = GroupBehaviorType.SelectExactlyOne,
        public sortingOrder: MaybeStrictString<SortingOrder, TStrict> = SortingOrder.Ascending,
        public options: Set<Option<TStrict>> = new Set(),
    ) {
        super();
    }

    asElement(document: Document, config: FomodDocumentConfig = {}, knownOptions: Option<boolean>[] = this.gatherOptions()): Element {
        const element = this.getElementForDocument(document);
        this.associateWithDocument(document);

        if (config.generateNewOptionFlagNames ?? DefaultFomodDocumentConfig.generateNewOptionFlagNames) {
            for (const option of knownOptions) {
                option.existingOptionFlagSetterByDocument.get(document)?.decommission();
                option.existingOptionFlagSetterByDocument.delete(document);
            }
            config = Object.assign({}, config, {generateNewOptionFlagNames: false});
        }

        element.setAttribute(AttributeName.Name, this.name);
        element.setAttribute(AttributeName.Type, this.behaviorType);

        const optionsContainer = getOrCreateElementByTagNameSafe(element, TagName.Plugins);

        optionsContainer.setAttribute(AttributeName.Order, this.sortingOrder);
        for (const option of this.options) optionsContainer.appendChild(option.asElement(document, config));

        return element;
    }

    isValid(): this is Group<true> {
        return  Object.values(GroupBehaviorType).includes(this.behaviorType as any) &&
                Object.values(SortingOrder).includes(this.sortingOrder as any) &&
                Array.from(this.options).every(option => option.isValid()
        );
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, 'isValid' | 'reasonForInvalidity'>[]): InvalidityReport | null {
        tree.push(this);

        if (!Object.values(GroupBehaviorType).includes(this.behaviorType as any))
            return { reason: InvalidityReason.GroupUnknownBehaviorType, offendingValue: this.behaviorType, tree };

        if (!Object.values(SortingOrder).includes(this.sortingOrder as any))
            return { reason: InvalidityReason.GroupUnknownOptionSortingOrder, offendingValue: this.sortingOrder, tree };

        for (const option of this.options) {
            const reason = option.reasonForInvalidity(...tree);
            if (reason !== null) return reason;
        }

        return null;
    }

    gatherOptions(): Option<TStrict>[] {
        return Array.from(this.options);
    }

    static override parse(element: Element, config: FomodDocumentConfig = {}): Group<boolean> {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const name = element.getAttribute(AttributeName.Name);
        const behaviorType = element.getAttribute(AttributeName.Type);

        const group = new Group<false>(name ?? '', behaviorType ?? '');
        group.assignElement(element);

        const optionsContainer = element.querySelector(`:scope > ${TagName.Plugins}`);
        if (optionsContainer === null) return group;

        const sortingOrder = optionsContainer.getAttribute(AttributeName.Order);
        if (sortingOrder !== null) group.sortingOrder = sortingOrder;

        let configForOptions = config;
        if (configForOptions.parseOptionFlags) configForOptions = Object.assign({}, configForOptions, {parseOptionFlags: false});

        for (const optionElement of optionsContainer.querySelectorAll(`:scope > ${TagName.Plugin}`)) {
            const option = Option.parse(optionElement, configForOptions);
            if (option !== null) group.options.add(option);
        }

        if (config.parseOptionFlags ?? DefaultFomodDocumentConfig.parseOptionFlags) {
            const dependencies = [];

            const options = group.gatherOptions();
            for (const option of options) {
                for (const pattern of option.typeDescriptor.patterns) {
                    dependencies.push(...gatherFlagDependencies(pattern.dependencies));
                }
            }

            parseOptionFlags(options, element.ownerDocument!, config, dependencies);
        }

        return group;
    }

    decommission(currentDocument?: Document) {
        this.options.forEach(option => option.decommission(currentDocument));
    }

    override associateWithDocument(document: Document) {
        this.options.forEach(option => option.associateWithDocument(document));
    }
}
