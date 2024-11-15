import { DependenciesGroup, Fomod, GameVersionDependency, Group, GroupBehaviorType, Install, InstallPattern, Option, ScriptExtenderVersionDependency, SortingOrder as SortingOrder, Step, TagName } from "..";
import { parseTag, testValidity } from "./testUtils";
import { describe, test, expect } from 'vitest';

const fomod = new Fomod('That Test Fomod', 'someImage.gif');

fomod.moduleDependencies.operator = 'Or';
fomod.moduleDependencies.dependencies.add( new GameVersionDependency('1.6.640.0') );
fomod.moduleDependencies.dependencies.add( new ScriptExtenderVersionDependency('2.2.3') );

fomod.moduleNameMetadata.colour = 'ffffff';
fomod.moduleNameMetadata.position = 'Left';
fomod.moduleImageMetadata.height = '100';
fomod.moduleImageMetadata.showFade = 'true';
fomod.moduleImageMetadata.showImage = 'false';

fomod.installs.add( new Install<true>('someFile.txt', 'someDestination.abc', '8311') );
fomod.installs.add( new Install<true>('someOtherFile.txt', 'someDestination.abc', '1') );

const conditionedInstall = new Install<true>('some-folder/', 'some-other-folder/', '0');

const conditionalDependenciesPattern = new InstallPattern();

conditionalDependenciesPattern.filesWrapper.installs.add(conditionedInstall);

conditionalDependenciesPattern.dependencies = new DependenciesGroup(TagName.Dependencies);
conditionalDependenciesPattern.dependencies.dependencies.add( new GameVersionDependency('1.6.640.0') );
conditionalDependenciesPattern.dependencies.dependencies.add( new ScriptExtenderVersionDependency('2.2.3') );

fomod.installs.add( conditionedInstall );

const option = new Option('someOption', 'What, you neva seen an option before?');

const group = new Group('someGroup', GroupBehaviorType.SelectAll, SortingOrder.Explicit);
group.options.add(option);

const step = new Step('someStep', SortingOrder.Explicit);
step.groups.add(group);

fomod.steps.add(step);

test('Fomod Is Valid', () => testValidity(fomod));


//console.log(fomod.asElement(parseTag`<p>`.ownerDocument).outerHTML);
