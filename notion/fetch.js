import dotenv from "dotenv";
dotenv.config();

import { Client } from "@notionhq/client";
import fs from "fs";
import path from "path";

// 初始化 Notion 客户端
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DATABASE_ID;

// 抓取数据库中的所有页面
async function fetchPages() {
  const pages = [];
  let cursor = undefined;
  while (true) {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
    });
    pages.push(...response.results);
    if (!response.has_more) break;
    cursor = response.next_cursor;
  }
  return pages;
}

// 将 rich_text 转换为 HTML
function richTextToHTML(richText) {
  return richText.map(t => {
    let text = t.plain_text || "";
    const ann = t.annotations;

    if (ann.bold) text = `<strong>${text}</strong>`;
    if (ann.italic) text = `<em>${text}</em>`;
    if (ann.underline) text = `<u>${text}</u>`;
    if (ann.strikethrough) text = `<s>${text}</s>`;
    if (ann.code) text = `<code>${text}</code>`;

    if (ann.color && ann.color !== "default") {
      if (ann.color.includes("_background")) {
        text = `<span style="background-color:${colorMap[ann.color]}">${text}</span>`;
      } else {
        text = `<span style="color:${colorMap[ann.color]}">${text}</span>`;
      }
    }

    return text;
  }).join('');
}

const colorMap = {
  red: "red", gray: "gray", brown: "brown", orange: "orange", yellow: "gold",
  green: "green", blue: "royalblue", purple: "purple", pink: "hotpink",
  red_background: "#ffe2e2", gray_background: "#eee", orange_background: "#fff3e0",
  yellow_background: "#fffecb", green_background: "#e0ffe0", blue_background: "#e0f0ff",
  purple_background: "#f3e5f5", pink_background: "#ffe0f0"
};

// 渲染块内容
async function renderBlock(block) {
  const { type } = block;
  const text = block[type]?.rich_text || [];

  // ⚠️ 处理 toggle 块：递归抓取子内容
  if (["toggle", "heading_1_toggle", "heading_2_toggle", "heading_3_toggle"].includes(type)) {
    const children = await notion.blocks.children.list({ block_id: block.id });
    const childrenHTML = await Promise.all(children.results.map(renderBlock));
    const title = richTextToHTML(text);
    const content = childrenHTML.join('');
    return `<details><summary>${title}</summary>${content}</details>`;
  }

  switch (type) {
    case "paragraph":
      return `<p>${richTextToHTML(text)}</p>`;
    case "heading_1":
      return `<h2>${richTextToHTML(text)}</h2>`;
    case "heading_2":
      return `<h3>${richTextToHTML(text)}</h3>`;
    case "heading_3":
      return `<h4>${richTextToHTML(text)}</h4>`;
    case "quote":
      return `<blockquote>${richTextToHTML(text)}</blockquote>`;
    case "bulleted_list_item":
      return `<ul><li>${richTextToHTML(text)}</li></ul>`;
    case "numbered_list_item":
      return `<ol><li>${richTextToHTML(text)}</li></ol>`;
    case "callout":
      return `<div style="background:#f1f1f1;padding:1em;border-left:4px solid #ccc;margin:1em 0;border-radius:5px;">${richTextToHTML(text)}</div>`;
    case "divider":
      return `<hr />`;
    case "image":
      const src = block.image?.file?.url || block.image?.external?.url || '';
      return `<img src="${src}" alt="" style="max-width: 100%; margin: 1em 0;" />`;
    default:
      return '';
  }
}

// 获取页面内容
async function fetchContent(blockId) {
  const blocks = await notion.blocks.children.list({ block_id: blockId });
  const htmlBlocks = await Promise.all(blocks.results.map(renderBlock));
  return htmlBlocks.join('\n');
}

async function run() {
  const pages = await fetchPages();

  const parsed = [];
  for (const page of pages) {
    const props = page.properties;
    const coverFile = props.Coverimage?.files?.[0];
    const status = props.Status?.select?.name || "草稿";
    if (status !== "已发布") continue;

    const content = await fetchContent(page.id); // 获取正文内容

    parsed.push({
      id: page.id,
      title: props.Title?.title?.[0]?.plain_text || "无标题",
      description: props.Description?.rich_text?.[0]?.text.content || "", // 添加 Description 字段
      category: props.Category?.select?.name || "未分类",
      subcategory: props.SubCategory?.select?.name || "",
      status,
      date: props.Date?.date?.start || null,
      cover:
        coverFile?.type === "external"
          ? coverFile.external.url
          : coverFile?.file?.url || null,
      content, // 添加正文字段
    });
  }

  // 分组保存 JSON 文件
  const outputDir = path.resolve("notion/data");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, "all.json"),
    JSON.stringify(parsed, null, 2)
  );

  const grouped = {};
  for (const item of parsed) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }
  for (const category in grouped) {
    fs.writeFileSync(
      path.join(outputDir, `${category}.json`),
      JSON.stringify(grouped[category], null, 2)
    );
  }

  console.log(`✅ 抓取完成，总共导出 ${parsed.length} 条内容`);
}

run();
