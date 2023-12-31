import { getOrCreateElementByTagNameSafe } from "../../DomUtils";
import { Group } from "./Group";
import { InvalidityReason, InvalidityReport } from "../lib/InvalidityReporting";
import { ElementObjectMap, Verifiable, XmlRepresentation } from "../lib/XmlRepresentation";
import { AttributeName, SortingOrder, TagName } from "../Enums";
import { DefaultFomodAsElementConfig, FomodDocumentConfig } from "../lib/FomodDocumentConfig";
import { Option } from "./Option";
import { parseOptionFlags } from "../lib/ParseOptionFlags";
import { gatherFlagDependencies } from "../lib/utils";
import { DependenciesGroup } from "./dependencies";

export class Step<TStrict extends boolean> extends XmlRepresentation<TStrict> {
    static override readonly tagName = TagName.InstallStep;
    readonly tagName = TagName.InstallStep;


    constructor(
        public name: string = '',
        public sortingOrder: TStrict extends true ? SortingOrder : string = SortingOrder.Ascending,
        public groups: Set<Group<TStrict>> = new Set(),
        public visibilityDeps: DependenciesGroup<TagName.Visible, TStrict> = new DependenciesGroup(TagName.Visible),
    ) {
        super();
    }

    asElement(document: Document, config: FomodDocumentConfig = {}): Element {
        const element = this.getElementForDocument(document);

        element.setAttribute(AttributeName.Name, this.name);

        const dependenciesContainer = getOrCreateElementByTagNameSafe(element, TagName.Visible);
        if (this.visibilityDeps.dependencies.size > 0) dependenciesContainer.appendChild(this.visibilityDeps.asElement(document, config));
        else dependenciesContainer.remove();

        const groupsContainer = getOrCreateElementByTagNameSafe(element, TagName.OptionalFileGroups);

        groupsContainer.setAttribute(AttributeName.Order, this.sortingOrder);
        for (const group of this.groups)  groupsContainer.appendChild(group.asElement(document, config));

        return element;
    }

    isValid(): this is Step<true> {
        return (
            Object.values(SortingOrder).includes(this.sortingOrder as any) &&
            Array.from(this.groups).every(group => group.isValid())
        );
    }

    reasonForInvalidity(...tree: Omit<Verifiable<false>, 'isValid' | 'reasonForInvalidity'>[]): InvalidityReport | null {
        tree.push(this);

        if (!Object.values(SortingOrder).includes(this.sortingOrder as any))
            return { reason: InvalidityReason.StepUnknownGroupSortingOrder, offendingValue: this.sortingOrder, tree };

        for (const group of this.groups) {
            const reason = group.reasonForInvalidity(...tree, this);
            if (reason !== null) return reason;
        }

        return null;
    }

    gatherOptions(): Option<TStrict>[] {
        const options: Option<TStrict>[] = [];

        for (const group of this.groups) options.push(...group.gatherOptions());

        return options;
    }

    static override parse(element: Element, config: FomodDocumentConfig = {}): Step<boolean> {
        const existing = ElementObjectMap.get(element);
        if (existing && existing instanceof this) return existing;

        const name = element.getAttribute(AttributeName.Name);

        const step = new Step<false>(name ?? '');
        step.assignElement(element);

        const dependenciesContainer = element.querySelector(`:scope > ${TagName.Visible}`);
        if (dependenciesContainer !== null) step.visibilityDeps = DependenciesGroup.parse<TagName.Visible>(dependenciesContainer, config);

        const groupsContainer = element.querySelector(`:scope > ${TagName.OptionalFileGroups}`);
        if (groupsContainer === null) return step;

        const sortingOrder = groupsContainer.getAttribute(AttributeName.Order);
        if (sortingOrder !== null) step.sortingOrder = sortingOrder;

        let configForGroups = config;
        if (configForGroups.parseOptionFlags) configForGroups = Object.assign({}, configForGroups, {parseOptionFlags: false});

        for (const groupElement of groupsContainer.querySelectorAll(TagName.Group)) {
            const group = Group.parse(groupElement, configForGroups);
            if (group !== null) step.groups.add(group);
        }

        if (config.parseOptionFlags ?? DefaultFomodAsElementConfig.parseOptionFlags) {
            const dependencies = Array.from(gatherFlagDependencies(step.visibilityDeps));

            const options = step.gatherOptions();
            for (const option of options) {
                for (const pattern of option.typeDescriptor.patterns) {
                    dependencies.push(...gatherFlagDependencies(pattern.dependencies));
                }
            }

            parseOptionFlags(options, element.ownerDocument!, config, dependencies);
        }

        return step;
    }

    override decommission(currentDocument?: Document | undefined) {
        for (const group of this.groups) group.decommission(currentDocument);
    }
}
