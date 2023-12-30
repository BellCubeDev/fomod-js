
export interface FomodDocumentConfig {
    /** [asElement] Whether or to include a third-party schema for Info.xml
     * 
     * If a string is provided, we'll use that string as the schema location. Otherwise, we'll use the library's default.
     * 
     * @default true
    */
    includeInfoSchema?: boolean|string;

    /** [asElement] Whether to move all conditional installs with only a dependency on a single option to the <files> tag of that option
     * 
     * Note that this may cause slight performance issues with Vortex on slower machines.
     * 
     * @default false
    */
    flattenConditionalInstalls?: boolean;

    /** [asElement] Whether to reorganize all conditional installs with no dependencies into the <requiredInstallFiles> tag
     * 
     * @default false
    */
    flattenConditionalInstallsNoDependencies?: boolean;

    /** [asElement] Whether to remove conditional installs with no dependencies and no files (has no effect when `flattenConditionalInstallsNoDependencies` is `true`)
     * 
     * @default true
    */
    removeEmptyConditionalInstalls?: boolean;

    /** [parse/asElement] String used for the flag value of option dependencies
     * 
     * @default 'OPTION_SELECTED'
    */
    optionSelectedValue?: string;
}

export const DefaultFomodAsElementConfig: Required<FomodDocumentConfig> = {
    includeInfoSchema: true,
    flattenConditionalInstalls: false,
    flattenConditionalInstallsNoDependencies: false,
    removeEmptyConditionalInstalls: true,
    optionSelectedValue: 'OPTION_SELECTED',
};
