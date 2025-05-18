#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const QUOTE_FILES = [
  'adrian_quotes.md',
  'ernesto_quotes.md',
  'shared_favorites.md',
  'retired_quotes.md'
];

const QUOTE_REGEX = />\s*"(.*?)"\s*\n>\s*—\s*(.*?)(?:\n\n🗓️\s*Added:\s*(\d{4}-\d{2}-\d{2}))?/gs;
const DATE_REGEX = /🗓️\s*Added:\s*(\d{4}-\d{2}-\d{2})/;

function parseQuotes(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    const quotes = [];
    
    let match;
    while ((match = QUOTE_REGEX.exec(content)) !== null) {
      const [fullMatch, quoteText, author, date] = match;
      
      quotes.push({
        text: quoteText.trim(),
        author: author.trim(),
        date: date || null,
        file: fileName,
        fullMatch
      });
    }
    
    return quotes;
  } catch (error) {
    console.error(`Error reading ${filePath}: ${error.message}`);
    return [];
  }
}

function findAllQuotes() {
  let allQuotes = [];
  
  QUOTE_FILES.forEach(file => {
    const quotes = parseQuotes(file);
    allQuotes = allQuotes.concat(quotes);
  });
  
  return allQuotes;
}

function findDuplicateQuotes(allQuotes) {
  const uniqueQuotes = {};
  const duplicates = [];
  
  allQuotes.forEach(quote => {
    const key = `${quote.text}|${quote.author}`;
    
    if (uniqueQuotes[key]) {
      duplicates.push({
        text: quote.text,
        author: quote.author,
        files: [uniqueQuotes[key].file, quote.file]
      });
    } else {
      uniqueQuotes[key] = quote;
    }
  });
  
  return duplicates;
}

function findQuotesWithoutDates(allQuotes) {
  return allQuotes.filter(quote => !quote.date);
}

function findNewestQuote(allQuotes) {
  const quotesWithDates = allQuotes.filter(quote => quote.date);
  
  if (quotesWithDates.length === 0) {
    return null;
  }
  
  return quotesWithDates.reduce((newest, current) => {
    if (!newest || new Date(current.date) > new Date(newest.date)) {
      return current;
    }
    return newest;
  }, null);
}

function highlightSharedQuotes(allQuotes) {
  const adrianQuotes = allQuotes.filter(q => q.file === 'adrian_quotes.md');
  const ernestoQuotes = allQuotes.filter(q => q.file === 'ernesto_quotes.md');
  const sharedQuotes = [];
  
  adrianQuotes.forEach(adrianQuote => {
    const match = ernestoQuotes.find(
      ernestoQuote => 
        adrianQuote.text === ernestoQuote.text && 
        adrianQuote.author === ernestoQuote.author
    );
    
    if (match) {
      sharedQuotes.push({
        text: adrianQuote.text,
        author: adrianQuote.author
      });
    }
  });
  
  return sharedQuotes;
}

function main() {
  console.log(chalk.bold.blue('\n📚 MUTUAL AXIOMS QUOTE ANALYZER 📚\n'));
  
  // Find all quotes
  const allQuotes = findAllQuotes();
  console.log(chalk.bold.white(`Found ${allQuotes.length} total quotes:\n`));
  
  // List quotes by file with dates
  QUOTE_FILES.forEach(file => {
    const fileQuotes = allQuotes.filter(q => q.file === file);
    if (fileQuotes.length > 0) {
      console.log(chalk.bold.cyan(`\n${path.basename(file, '.md').toUpperCase()} (${fileQuotes.length}):`));
      fileQuotes.forEach(quote => {
        console.log(`  ${chalk.green('•')} "${quote.text}" — ${quote.author}`);
        console.log(`    ${quote.date ? chalk.yellow(`Added: ${quote.date}`) : chalk.red('No date found')}`);
      });
    }
  });
  
  // Find duplicates
  const duplicates = findDuplicateQuotes(allQuotes);
  if (duplicates.length > 0) {
    console.log(chalk.bold.red('\n🔄 DUPLICATE QUOTES:'));
    duplicates.forEach(dupe => {
      console.log(`  ${chalk.red('•')} "${dupe.text}" — ${dupe.author}`);
      console.log(`    Found in: ${dupe.files.join(', ')}`);
    });
  }
  
  // Find quotes without dates
  const quotesWithoutDates = findQuotesWithoutDates(allQuotes);
  if (quotesWithoutDates.length > 0) {
    console.log(chalk.bold.yellow('\n📅 QUOTES MISSING DATES:'));
    quotesWithoutDates.forEach(quote => {
      console.log(`  ${chalk.yellow('•')} "${quote.text}" — ${quote.author}`);
      console.log(`    File: ${quote.file}`);
    });
  }
  
  // Find newest quote
  const newestQuote = findNewestQuote(allQuotes);
  if (newestQuote) {
    console.log(chalk.bold.green('\n✨ NEWEST QUOTE:'));
    console.log(`  ${chalk.green('•')} "${newestQuote.text}" — ${newestQuote.author}`);
    console.log(`    Added: ${newestQuote.date} (in ${newestQuote.file})`);
  }
  
  // Find shared quotes between Adrian and Ernesto
  const sharedQuotes = highlightSharedQuotes(allQuotes);
  if (sharedQuotes.length > 0) {
    console.log(chalk.bold.magenta('\n💖 QUOTES SHARED BY BOTH:'));
    console.log(chalk.italic('  Consider moving these to shared_favorites.md'));
    sharedQuotes.forEach(quote => {
      console.log(`  ${chalk.magenta('•')} "${quote.text}" — ${quote.author}`);
    });
  }
}

main(); 