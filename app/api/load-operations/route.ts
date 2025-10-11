import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Look for existing operations files in the project root
    const projectRoot = process.cwd();
    const files = fs.readdirSync(projectRoot);
    
    // Find all GraphQL operations JSON files
    const operationsFiles = files
      .filter(file => file.startsWith('graphql-operations-') && file.endsWith('.json'))
      .sort()
      .reverse(); // Most recent first
    
    if (operationsFiles.length === 0) {
      return NextResponse.json(
        { error: 'No existing operations files found' },
        { status: 404 }
      );
    }
    
    // Load the most recent operations file
    const mostRecentFile = operationsFiles[0];
    const filePath = path.join(projectRoot, mostRecentFile);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const operations = JSON.parse(fileContent);
    
    return NextResponse.json({
      operations,
      loadedFrom: mostRecentFile,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error loading existing operations:', error);
    return NextResponse.json(
      { error: 'Failed to load existing operations' },
      { status: 500 }
    );
  }
}
