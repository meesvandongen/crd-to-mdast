import { readFileSync, writeFileSync } from "fs";
import type { CustomResourceDefinition } from "kubernetes-types/apiextensions/v1";
import { parse } from "yaml";
import yargs from "yargs";
import { crdToMdast } from "./crd-to-mdast";
import { toHast } from "mdast-util-to-hast";
import { toHtml } from "hast-util-to-html";
import { toMarkdown } from "mdast-util-to-markdown";
import { gfmToMarkdown } from "mdast-util-gfm";

const argv = yargs(process.argv.slice(2))
  .options({
    in: { type: "string", demandOption: true },
    format: {
      type: "string",
      choices: ["html", "md"],
    },
    out: { type: "string", demandOption: true },
  })
  .parseSync();

const crd = parse(readFileSync(argv.in, "utf8")) as CustomResourceDefinition;

const mdast = crdToMdast(crd);

function mdastToString(mdast: any, format: "html" | "md") {
  if (format === "html") {
    const hast = toHast(mdast, { allowDangerousHtml: true });
    return toHtml(hast, { allowDangerousHtml: true });
  }

  return toMarkdown(mdast, { extensions: [gfmToMarkdown()] });
}

const outString = mdastToString(mdast, argv.format as any);

writeFileSync(argv.out, outString);
