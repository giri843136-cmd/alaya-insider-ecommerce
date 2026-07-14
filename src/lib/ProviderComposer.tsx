/**
 * ALAYA INSIDER — Enterprise Provider Composer
 * --------------------------------------------------------------------------
 * Flattens deeply nested React Context providers into a readable,
 * dependency-aware composition without changing the runtime tree structure.
 *
 * Instead of:
 *   <A><B><C><D>{children}</D></C></B></A>
 *
 * You write:
 *   const AppProviders = composeProviders(A, B, C, D);
 *   <AppProviders>{children}</AppProviders>
 *
 * Provider Groups allow logical grouping and dependency ordering:
 *   composeProviderGroups(
 *     [A, B],   // core providers
 *     [C],      // depends on A,B
 *     [D, E],   // depends on C
 *   )
 */

import {
  createElement,
  memo,
  type ComponentType,
  type FunctionComponent,
  type ReactNode,
} from "react";

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

export type ProviderComponent = FunctionComponent<{ children: ReactNode }>;

export type ProviderGroup = ProviderComponent[];

/* ================================================================== */
/*  COMPOSERS                                                          */
/* ================================================================== */

/**
 * Compose an array of providers into a single wrapper component.
 * Providers are applied outermost-first (left-to-right).
 *
 * Example:
 *   composeProviders(StoreProvider, ThemeProvider, AuthProvider)
 *   // => <StoreProvider><ThemeProvider><AuthProvider>{children}</AuthProvider></ThemeProvider></StoreProvider>
 */
export function composeProviders(
  ...providers: ProviderComponent[]
): ComponentType<{ children: ReactNode }> {
  const Composed = memo(({ children }: { children: ReactNode }) => {
    return providers.reduceRight(
      (acc, Provider) => createElement(Provider, null, acc),
      children as ReactNode,
    );
  });
  Composed.displayName = `Composed(${providers.map((p) => p.displayName || p.name || "Anonymous").join(", ")})`;
  return Composed;
}

/**
 * Compose provider groups sequentially.
 * Each group is flattened internally; groups are applied outermost-first.
 *
 * This makes dependency ordering explicit:
 *   composeProviderGroups(
 *     [StoreProvider],                    // Group 0: foundation
 *     [ThemeProvider, AuthProvider],       // Group 1: depend on Store
 *     [CommerceProvider],                  // Group 2: depends on Theme + Auth + Store
 *   )
 */
export function composeProviderGroups(
  ...groups: ProviderGroup[]
): ComponentType<{ children: ReactNode }> {
  const flattened = groups.flat();
  return composeProviders(...flattened);
}
