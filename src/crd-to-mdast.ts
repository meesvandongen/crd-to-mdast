import {
  root,
  paragraph,
  text,
  heading,
  inlineCode,
  table,
  tableCell,
  tableRow,
} from "mdast-builder";
import type {
  CustomResourceDefinition,
  JSONSchemaProps,
} from "kubernetes-types/apiextensions/v1";
import type { Node } from "unist";

export function crdToMdast(crd: CustomResourceDefinition) {
  const md = root([
    paragraph([inlineCode(crd.spec.group)]),
    ...crd.spec.versions.flatMap((version) => {
      const extracted = Object.entries(
        version.schema.openAPIV3Schema.properties.spec.properties
      ).flatMap(([nestedKey, value]) =>
        extractProperties(`${nestedKey}`, value as JSONSchemaProps)
      );

      return [
        heading(2, text(version.name)),
        table(
          ["left", "left", "left"],
          [
            tableRow([
              tableCell([text("Name")]),
              tableCell([text("Type")]),
              tableCell([text("Description")]),
            ]),
            ...extracted.flatMap(({ key, props }) =>
              tableRow([
                tableCell([inlineCode(key)]),
                tableCell([...renderType(key, props as JSONSchemaProps)]),
                tableCell([text(props.description ?? "")]),
              ])
            ),
          ]
        ),
      ];
    }),
  ]);

  return md;
}

function renderType(key: string, props: JSONSchemaProps): Node[] {
  if (props.type === "array") {
    return [
      text("Array<"),
      ...renderType(key, props.items as JSONSchemaProps),
      text(">"),
    ];
  }

  if (props.type === "string" && props.enum) {
    return props.enum.flatMap((e, i) => [
      inlineCode(e.toString()),
      ...(i < props.enum.length - 1 ? [text(" | ")] : []),
    ]);
  }

  return [text(props.type ?? "unknown")];
}

function extractProperties(
  key: string,
  props: JSONSchemaProps
): { props: JSONSchemaProps; key: string }[] {
  if (props.type === "array") {
    return extractProperties(`${key}[i]`, props.items as JSONSchemaProps);
  }

  if (props.type === "object") {
    return [
      {
        props,
        key,
      },
      ...Object.entries(props.properties ?? {}).flatMap(([nestedKey, value]) =>
        extractProperties(`${key}.${nestedKey}`, value as JSONSchemaProps)
      ),
    ];
  }

  return [{ props, key }];
}
