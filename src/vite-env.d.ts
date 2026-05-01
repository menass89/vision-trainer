/// <reference types="vite/client" />

declare module 'jsquest' {
  export function QuestCreate(...args: unknown[]): unknown;
  export function QuestUpdate(...args: unknown[]): unknown;
  export function QuestQuantile(...args: unknown[]): unknown;
  export function QuestMean(...args: unknown[]): unknown;
  export function QuestSd(...args: unknown[]): unknown;
  const value: Record<string, unknown>;
  export default value;
}
