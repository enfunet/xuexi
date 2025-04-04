import { Client } from '@notionhq/client';
import fs from 'node:fs/promises';
import path from 'node:path';

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY || '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',
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID || '1cba9264a3cd80ea9310f0131dfeafd7';

// Category configurations
const CATEGORIES = {
  '系列课程': {
    icon: 'book-open',
    subcategories: ['初信栽培', '祷告祭坛'],
    color: 'blue'
  },
  '亮光分享': {
    icon: 'lightbulb',
    color: 'yellow'
  },
  '疑问解答': {
    icon: 'help-circle',
    subcategories: ['日常', '旧约', '新约'],
    color: 'green'
  },
  '主日信息': {
    icon: 'church',
    subcategories: ['祷告', '信心', '书卷'],
    color: 'purple'
  }
};

async function convertNotionToHtml(block) {
  let html = '';
  
  switch (block.type) {
    case 'paragraph':
      const paragraphText = block.paragraph.rich_text.map(text => {
        if (text.annotations.bold) {
          return `<strong>${text.plain_text}</strong>`;
        }
        if (text.annotations.italic) {
          return `<em>${text.plain_text}</em>`;
        }
        if (text.annotations.strikethrough) {
          return `<del>${text.plain_text}</del>`;
        }
        if (text.annotations.underline) {
          return `<u>${text.plain_text}</u>`;
        }
        return text.plain_text;
      }).join('');
      html = `<p class="mb-4 leading-relaxed text-gray-700">${paragraphText}</p>`;
      break;
    case 'heading_1':
      html = `<h1 class="text-4xl font-bold mb-6 text-gray-900">${block.heading_1.rich_text.map(text => text.plain_text).join('')}</h1>`;
      break;
    case 'heading_2':
      html = `<h2 class="text-3xl font-semibold mb-4 text-gray-800">${block.heading_2.rich_text.map(text => text.plain_text).join('')}</h2>`;
      break;
    case 'heading_3':
      html = `<h3 class="text-2xl font-semibold mb-3 text-gray-800">${block.heading_3.rich_text.map(text => text.plain_text).join('')}</h3>`;
      break;
    case 'bulleted_list_item':
      html = `<li class="ml-4 mb-2 text-gray-700">${block.bulleted_list_item.rich_text.map(text => text.plain_text).join('')}</li>`;
      break;
    case 'numbered_list_item':
      html = `<li class="ml-4 mb-2 text-gray-700">${block.numbered_list_item.rich_text.map(text => text.plain_text).join('')}</li>`;
      break;
    case 'image':
      const imageUrl = block.image.file?.url || block.image.external?.url;
      html = `<img src="${imageUrl}" alt="Notion image" class="my-8 rounded-lg shadow-lg max-w-full h-auto mx-auto" />`;
      break;
    case 'code':
      html = `<pre class="bg-gray-800 text-white p-4 rounded-lg my-6 overflow-x-auto"><code class="font-mono text-sm">${block.code.rich_text.map(text => text.plain_text).join('')}</code></pre>`;
      break;
    case 'quote':
      html = `<blockquote class="border-l-4 border-gray-300 pl-4 my-6 italic text-gray-700">${block.quote.rich_text.map(text => text.plain_text).join('')}</blockquote>`;
      break;
    case 'divider':
      html = `<hr class="my-8 border-t border-gray-200">`;
      break;
    default:
      console.log(`Unsupported block type: ${block.type}`);
  }
  
  return html;
}

async function getPageContent(pageId) {
  try {
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
    });
    
    let html = '';
    let inList = false;
    
    for (const block of blocks.results) {
      if ((block.type === 'bulleted_list_item' || block.type === 'numbered_list_item') && !inList) {
        html += `<${block.type === 'bulleted_list_item' ? 'ul' : 'ol'} class="list-disc mb-6 space-y-2">`;
        inList = true;
      } else if (inList && !(block.type === 'bulleted_list_item' || block.type === 'numbered_list_item')) {
        html += `</${inList === 'bulleted' ? 'ul' : 'ol'}>`;
        inList = false;
      }
      
      html += await convertNotionToHtml(block);
    }
    
    if (inList) {
      html += `</${inList === 'bulleted' ? 'ul' : 'ol'}>`;
    }
    
    return html;
  } catch (error) {
    console.error(`Error fetching content for page ${pageId}:`, error);
    return `<p class="text-red-600">Error loading content: ${error.message}</p>`;
  }
}

function getCategoryColor(category) {
  const categoryConfig = CATEGORIES[category];
  return categoryConfig?.color || 'gray';
}

function generatePageHtml(title, content, category, date) {
  return `
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - 灵修笔记</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Noto Sans SC', sans-serif;
        }
        .prose {
            max-width: 65ch;
        }
        .prose img {
            margin: 2rem auto;
        }
        .prose pre {
            background-color: #1a202c;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
        }
    </style>
</head>
<body class="bg-gray-50">
    <nav class="bg-white shadow-sm">
        <div class="max-w-4xl mx-auto px-4 py-3">
            <a href="index.html" class="text-gray-800 hover:text-gray-600">
                ← 返回首页
            </a>
        </div>
    </nav>
    <div class="max-w-4xl mx-auto p-8">
        <article class="prose lg:prose-xl bg-white p-8 rounded-lg shadow-md">
            <div class="mb-8">
                <span class="inline-block bg-${getCategoryColor(category)}-100 text-${getCategoryColor(category)}-800 text-sm px-3 py-1 rounded-full mb-4">
                    ${category}
                </span>
                <h1 class="text-4xl font-bold text-gray-900 mb-4">${title}</h1>
                <time class="text-gray-500 text-sm">${date}</time>
            </div>
            ${content}
        </article>
        <footer class="text-center text-gray-500 text-sm mt-8">
            最后更新: ${new Date().toLocaleDateString('zh-CN')}
        </footer>
    </div>
</body>
</html>`;
}

async function syncNotionToHtml() {
  console.log('Starting Notion to HTML sync...');
  
  try {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      sorts: [
        {
          property: 'Created time',
          direction: 'descending',
        },
      ],
    });
    
    console.log(`Found ${response.results.length} pages to process`);
    
    await fs.mkdir('public', { recursive: true });
    
    // Group pages by category
    const pagesByCategory = {};
    
    for (const page of response.results) {
      const pageId = page.id;
      const title = page.properties.Name?.title[0]?.plain_text || 'untitled';
      const category = page.properties.Category?.select?.name || '未分类';
      const subcategory = page.properties.Subcategory?.select?.name || '';
      const date = new Date(page.created_time).toLocaleDateString('zh-CN');
      
      console.log(`Processing page: ${title} (${category}/${subcategory})`);
      
      if (!pagesByCategory[category]) {
        pagesByCategory[category] = [];
      }
      
      const content = await getPageContent(pageId);
      const fileName = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
      
      await fs.writeFile(
        path.join('public', fileName),
        generatePageHtml(title, content, category, date)
      );
      
      pagesByCategory[category].push({
        title,
        fileName,
        subcategory,
        date
      });
      
      console.log(`Generated ${fileName}`);
    }
    
    // Create beautiful index page
    const indexHtml = `
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>灵修笔记</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Noto Sans SC', sans-serif;
        }
    </style>
</head>
<body class="bg-gray-50">
    <div class="max-w-6xl mx-auto p-8">
        <header class="text-center mb-16">
            <h1 class="text-5xl font-bold text-gray-900 mb-4">灵修笔记</h1>
            <p class="text-xl text-gray-600">记录灵修心得，分享信仰见证</p>
        </header>
        
        <div class="grid gap-8">
            ${Object.entries(CATEGORIES).map(([category, config]) => `
                <section class="bg-white rounded-xl shadow-md overflow-hidden">
                    <div class="bg-${config.color}-50 px-6 py-4 border-b border-${config.color}-100">
                        <h2 class="text-2xl font-bold text-${config.color}-900">${category}</h2>
                    </div>
                    <div class="p-6">
                        ${(pagesByCategory[category] || []).map(page => `
                            <a href="${page.fileName}" 
                               class="block p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200 mb-2">
                                <div class="flex justify-between items-center">
                                    <h3 class="text-lg font-medium text-gray-900">${page.title}</h3>
                                    <span class="text-sm text-gray-500">${page.date}</span>
                                </div>
                                ${page.subcategory ? `
                                    <span class="inline-block mt-2 text-sm text-${config.color}-600 bg-${config.color}-50 px-2 py-1 rounded">
                                        ${page.subcategory}
                                    </span>
                                ` : ''}
                            </a>
                        `).join('')}
                    </div>
                </section>
            `).join('')}
        </div>
        
        <footer class="text-center text-gray-500 text-sm mt-16">
            最后更新: ${new Date().toLocaleDateString('zh-CN')}
        </footer>
    </div>
</body>
</html>`;
    
    await fs.writeFile(path.join('public', 'index.html'), indexHtml);
    console.log('Generated index.html');
    
    console.log('Sync completed successfully!');
  } catch (error) {
    console.error('Error syncing Notion content:', error);
    throw error;
  }
}

// Run sync
syncNotionToHtml();