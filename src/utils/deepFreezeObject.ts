export default function deepFreezeObject<T = unknown>(obj: { [key: string]: unknown }): T {
  Object.freeze(obj);

  Object.getOwnPropertyNames(obj).forEach(prop => {
    const value = (obj as { [key: string]: unknown })[prop];

    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      deepFreezeObject(value as { [key: string]: unknown });
    }
  });

  return obj as T;
}
