import MarkdownIt from "markdown-it";
import { MarkdownParser } from "prosemirror-markdown";

function filterMdToPmSchemaMapping(schema, map) {
  return Object.keys(map).reduce((newMap, key) => {
    const value = map[key];
    const block = value.block || value.node;
    const mark = value.mark;

    if ((block && schema.nodes[block]) || (mark && schema.marks[mark])) {
      newMap[key] = value;
    }
    return newMap;
  }, {});
}

const pmSchemaToMdMapping = {
  nodes: {
    blockquote: "blockquote",
    paragraph: "paragraph",
    rule: "hr",
    // lheading (---, ===)
    heading: ["heading", "lheading"],
    code_block: ["code", "fence"],
    list_item: "list",
    image: "image"
  },
  marks: {
    em: "emphasis",
    strong: "text",
    link: ["link", "autolink", "reference", "linkify"],
    strike: "strikethrough",
    code: "backticks"
  }
};

const mdToPmMapping = {
  blockquote: { block: "blockquote" },
  paragraph: { block: "paragraph" },
  em: { mark: "em" },
  strong: { mark: "strong" },
  link: {
    mark: "link",
    attrs: tok => ({
      href: tok.attrGet("href"),
      title: tok.attrGet("title") || null
    })
  },
  hr: { node: "rule" },
  heading: {
    block: "heading",
    attrs: tok => ({ level: +tok.tag.slice(1) })
  },
  softbreak: { node: "hard_break" },
  hardbreak: { node: "hard_break" },
  code_block: { block: "code_block" },
  list_item: { block: "list_item" },
  bullet_list: { block: "bullet_list" },
  ordered_list: {
    block: "ordered_list",
    attrs: tok => ({ order: +tok.attrGet("order") || 1 })
  },
  code_inline: { mark: "code" },
  fence: {
    block: "code_block",
    // we trim any whitespaces around language definition
    attrs: tok => ({ language: (tok.info && tok.info.trim()) || null })
  },
  emoji: {
    node: "emoji",
    attrs: tok => ({
      shortName: `:${tok.markup}:`,
      text: tok.content
    })
  },
  s: { mark: "strike" }
};

const md = MarkdownIt("zero", {
  html: false,
  linkify: true
});

md.enable([
  // Process html entity - &#123;, &#xAF;, &quot;, ...
  "entity",
  // Process escaped chars and hardbreaks
  "escape"
]);

export class MarkdownTransformer {
  constructor(schema, tokenizer = md) {
    // Enable markdown plugins based on schema
    ["nodes", "marks"].forEach(key => {
      for (const idx in pmSchemaToMdMapping[key]) {
        if (schema[key][idx]) {
          tokenizer.enable(pmSchemaToMdMapping[key][idx]);
        }
      }
    });

    this.markdownParser = new MarkdownParser(
      schema,
      tokenizer,
      filterMdToPmSchemaMapping(schema, mdToPmMapping)
    );
  }
  encode(_node) {
    throw new Error("This is not implemented yet");
  }

  parse(content) {
    return this.markdownParser.parse(content);
  }
}
