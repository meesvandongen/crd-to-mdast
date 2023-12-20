import type {
  CustomResourceDefinition,
  JSONSchemaProps,
} from "kubernetes-types/apiextensions/v1";
import { PhrasingContentBuilder, flowContentBuilder } from "mdasterix";

export function crdToMdast(crd: CustomResourceDefinition) {
  const fcb = flowContentBuilder().paragraph({}, (pcb) => {
    pcb.inlineCode({ value: crd.spec.group });
  });
  crd.spec.versions.forEach((version) => {
    const extracted = Object.entries(
      version.schema?.openAPIV3Schema?.properties?.spec.properties ?? {}
    ).flatMap(([nestedKey, value]) =>
      extractProperties(`${nestedKey}`, value as JSONSchemaProps)
    );

    fcb.heading({ depth: 2 }, (hcb) => {
      hcb.text({ value: version.name });
    });

    fcb.table({ align: ["left", "left", "left"] }, (tcb) => {
      tcb.tableRow({}, (rcb) => {
        rcb.tableCell({}, (pcb) => {
          pcb.text({ value: "Name" });
        });
        rcb.tableCell({}, (pcb) => {
          pcb.text({ value: "Type" });
        });
        rcb.tableCell({}, (pcb) => {
          pcb.text({ value: "Description" });
        });
      });
      extracted.forEach(({ key, props }) => {
        tcb.tableRow({}, (rcb) => {
          rcb.tableCell({}, (pcb) => {
            pcb.inlineCode({ value: key });
          });
          rcb.tableCell({}, (pcb) => {
            renderType(props, pcb);
          });
          rcb.tableCell({}, (pcb) => {
            pcb.text({ value: props.description ?? "" });
          });
        });
      });
    });
  });

  return fcb.build();
}

function renderType(props: JSONSchemaProps, pcb: PhrasingContentBuilder) {
  if (props.type === "array") {
    pcb.text({ value: "Array<" });
    renderType(props.items as JSONSchemaProps, pcb);
    return pcb.text({ value: ">" });
  }

  if (props.type === "string" && props.enum) {
    props.enum.forEach((e, i) => {
      pcb.inlineCode({ value: e.toString() });
      pcb.text({ value: i < props.enum!.length - 1 ? " | " : "" });
    });

    return pcb;
  }

  return pcb.text({ value: props.type ?? "unknown" });
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
