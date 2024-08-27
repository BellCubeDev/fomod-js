// While this hack doesn't work with enums, it does work with string literals.
// Essentially, by applying an empty constraint to the string, we can make TypeScript
// show suggestions while still allowing the string to be any string literal.
//
// Shouldn't be used in too many spots since we're pretty enum-heavy over here but it may come in handy in particular cases.
//
// eslint-disable-next-line @typescript-eslint/ban-types
type SuggestedString<T extends string> = string & {} | T;

type MaybeStrictString<T extends string, TStrict extends boolean> = TStrict extends true ? T : SuggestedString<T>;

type MaybeStrictBoolString<TStrict extends boolean> = MaybeStrictString<import("./definitions").BooleanString, TStrict>;
type MaybeStrictIntString<TStrict extends boolean> = MaybeStrictString<`${bigint}`, TStrict>;
