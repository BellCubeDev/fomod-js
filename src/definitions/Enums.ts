/** A valid tag for an XML-Based Fomod installer */
export enum TagName {
    Fomod = 'fomod',
    Config = 'config',
        ModuleName = 'moduleName',
        ModuleImage = 'moduleImage',
        ModuleDependencies = 'moduleDependencies',
            Dependencies = 'dependencies',
                // Dependencies = 'dependencies',
                FileDependency = 'fileDependency',
                FlagDependency = 'flagDependency',
                GameDependency = 'gameDependency',
                FOMMDependency = 'fommDependency',
                FOSEDependency = 'foseDependency',
        RequiredInstallFiles = 'requiredInstallFiles',
            File = 'file',
            Folder = 'folder',
        InstallSteps = 'installSteps',
            InstallStep = 'installStep',
                Visible = 'visible',
                    // Dependencies = 'dependencies',
                        // Dependencies = 'dependencies',
                        // FileDependency = 'fileDependency',
                        // FlagDependency = 'flagDependency',
                        // GameDependency = 'gameDependency',
                        // FOMMDependency = 'fommDependency',
                        // FOSEDependency = 'foseDependency',
                OptionalFileGroups = 'optionalFileGroups',
                    Group = 'group',
                        Plugins = 'plugins',
                            Plugin = 'plugin',
                                Description = 'description',
                                Image = 'image',
                                ConditionFlags = 'conditionFlags',
                                    Flag = 'flag',
                                Files = 'files',
                                    //File = 'file',
                                    //Folder = 'folder',
                                TypeDescriptor = 'typeDescriptor',
                                    Type = 'type',
                                    DependencyType = 'dependencyType',
                                        DefaultType = 'defaultType',
                                        Patterns = 'patterns',
                                            Pattern = 'pattern',
                                                // Dependencies = 'dependencies',
                                                    // Dependencies = 'dependencies',
                                                    // FileDependency = 'fileDependency',
                                                    // FlagDependency = 'flagDependency',
                                                    // GameDependency = 'gameDependency',
                                                    // FOMMDependency = 'fommDependency',
                                                    // FOSEDependency = 'foseDependency',
                                                //Type = 'type',
        ConditionalFileInstalls = 'conditionalFileInstalls',
            // Patterns = 'patterns',
                // Pattern = 'pattern',
                    // Dependencies = 'dependencies',
                        // Dependencies = 'dependencies',
                        // FileDependency = 'fileDependency',
                        // FlagDependency = 'flagDependency',
                        // GameDependency = 'gameDependency',
                        // FOMMDependency = 'fommDependency',
                        // FOSEDependency = 'foseDependency',
}

/** A valid attribute for an XML-Based Fomod installer */
export enum AttributeName {
    // moduleName
    Color = 'colour',
    Colour = 'colour',

    // moduleImage, image
    Path = 'path',

    // moduleImage
    Position = 'position',
    Height = 'height',
    ShowFade = 'showFade',
    ShowImage = 'showImage',

    // moduleDependencies, dependencies, visible
    Operator = 'operator',

    // file, folder
    Source = 'source',
    Destination = 'destination',
    Priority = 'priority',
    AlwaysInstall = 'alwaysInstall',
    InstallIfUsable = 'installIfUsable',

    // installSteps, optionalFileGroups, plugins
    Order = 'order',

    // installStep, group, plugin, flag, type, defaultType
    Name = 'name',

    // group
    Type = 'type',

    // fileDependency
    File = 'file',
    State = 'state',

    // flagDependency
    Flag = 'flag',
    Value = 'value',

    // gameDependency, fommDependency, foseDependency
    Version = 'version',
}


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

/** Describes how the group should behave when allowing users to select its options */
export enum SortingOrder {
    /** Items are ordered alphabetically starting with A and ending with Z. This is the default behavior. */
    Ascending = 'Ascending',
    /** Items are ordered alphabetically starting with Z and ending with A. */
    Descending = 'Descending',
    /** Items are ordered precisely as they appear in the XML (and, consequently, the Set within JS) */
    Explicit = 'Explicit',
}

/** A state which this FileDependency expects the file to be in to be satisfied */
export enum FileDependencyState {
    /** The file must not exist on the user's system */
    Missing = 'Missing',
    /** The file must be on the user's system but NOT loaded by the game */
    Inactive = 'Inactive',
    /** The file must be on the user's system and loaded by the game */
    Active = 'Active',
}

/** An operator which determines the behavior of the dependency group */
export enum DependencyGroupOperator {
    /** The dependency group is satisfied if *any* of its children are satisfied */
    Or = 'Or',
    /** The dependency group is only satisfied if **all** of its children are satisfied */
    And = 'And',
}

export enum ModuleNamePosition {
    /** Positions the title on the left side of the form header. */
    Left = 'Left',
    /** Positions the title on the right side of the form header. */
    Right = 'Right',
    /** Positions the title on the right side of the image in the form header. */
    RightOfImage = 'RightOfImage',
}

export enum BooleanString {
    true = 'true',
    false = 'false',
}
