import { Verifiable } from "./XmlRepresentation";

/** A list of reasons why a Fomod might be invalid
 *
 * If you are using this to provide an explanation for end users, it is up to you to provide human-readable translations.
 */
export enum InvalidityReason {

    // Fomod

    FomodModuleNameMetadataInvalidPosition = 'fomod.module_name_metadata.position',
    FomodModuleNameMetadataColorHexNotHexNumber = 'fomod.module_name_metadata.color_hex.not_hex_number',
    FomodModuleNameMetadataColorHexNotEvenNumberOfHexDigits = 'fomod.module_name_metadata.color_hex.odd_digit_count',

    FomodModuleImageMetadataShowFadeNotBool = 'fomod.module_image_metadata.show_fade.not_boolean',
    FomodModuleImageMetadataShowImageNotBool = 'fomod.module_image_metadata.show_image.not_boolean',


    // Dependencies
    DependenciesUnknownOperator = 'dependencies.operator.unknown',
    DependencyFileInvalidState = 'dependencies.file.state.unknown',


    // Steps
    StepUnknownGroupSortingOrder = 'step.sorting_order.unknown',


    // Groups
    GroupUnknownBehaviorType = 'group.behavior_type.unknown',
    GroupUnknownOptionSortingOrder = 'group.sorting_order.unknown',


    // Options
    OptionTypeDescriptorUnknownOptionType = 'option.type_descriptor.option_type.unknown',


    // Installs
    InstallPriorityNotInteger = 'install.priority.not_integer',
    InstallAlwaysInstallNotBoolean = 'install.always_install.not_boolean',
    InstallInstallIfUsableNotBoolean = 'install.install_if_usable.not_boolean',
}

/** A report detailing what part of a Fomod is invalid */
export interface InvalidityReport {
    /** The reason the item is invalid */
    reason: InvalidityReason;

    /** The value causing the item to be invalid */
    offendingValue: string;

    /** The tree leading up to the most immediate invalid item */
    tree: Omit<Verifiable<false>, 'isValid' | 'reasonForInvalidity'>[];
}
