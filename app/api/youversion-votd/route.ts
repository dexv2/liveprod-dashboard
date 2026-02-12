import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://www.bible.com/verse-of-the-day');
    const html = await response.text();
    
    const verseMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
    const referenceMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    
    if (verseMatch && referenceMatch) {
      return NextResponse.json({
        verse: verseMatch[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
        reference: referenceMatch[1].split(' - ')[0]
      });
    }
    
    return NextResponse.json({
      verse: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
      reference: "John 3:16"
    });
  } catch (error) {
    console.error('Error fetching YouVersion VOTD:', error);
    return NextResponse.json({
      verse: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
      reference: "John 3:16"
    });
  }
}
