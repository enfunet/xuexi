import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY || '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',
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID || '1cba9264a3cd80ea9310f0131dfeafd7';

async function testNotionConnection() {
  try {
    console.log('Testing Notion connection...');
    
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      sorts: [
        {
          property: 'Created time',
          direction: 'descending',
        },
      ],
    });
    
    console.log('Connection successful!');
    console.log(`Found ${response.results.length} pages`);
    
    // Print first page details if available
    if (response.results.length > 0) {
      const firstPage = response.results[0];
      console.log('\nFirst page details:');
      console.log('Title:', firstPage.properties.Name?.title[0]?.plain_text);
      console.log('Category:', firstPage.properties.Category?.select?.name);
      console.log('Subcategory:', firstPage.properties.Subcategory?.select?.name);
      console.log('Created:', new Date(firstPage.created_time).toLocaleString('zh-CN'));
    } else {
      console.log('\nNo pages found in the database');
    }
    
  } catch (error) {
    console.error('Error connecting to Notion:', error);
    if (error.code === 'unauthorized') {
      console.error('API key might be invalid or expired');
    }
    if (error.code === 'object_not_found') {
      console.error('Database ID might be incorrect or you don\'t have access');
    }
  }
}

testNotionConnection();