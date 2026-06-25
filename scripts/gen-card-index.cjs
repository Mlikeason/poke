#!/usr/bin/env node
// Generate minimal card index for scan lookup
// Usage: node scripts/gen-card-index.cjs

const fs = require('fs');

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function main() {
  console.log('Fetching all sets...');
  const setsData = await fetchJSON('https://api.pokemontcg.io/v2/sets');
  const sets = setsData.data;
  console.log(`Found ${sets.length} sets`);

  const index = [];
  let total = 0;

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    process.stdout.write(`\rFetching cards for ${set.name} (${i + 1}/${sets.length})...`);

    let page = 1;
    while (true) {
      const url = `https://api.pokemontcg.io/v2/cards?q=set.id:${encodeURIComponent(set.id)}&pageSize=250&page=${page}&select=id,name,number,set.id,set.total`;
      const cardsData = await fetchJSON(url);
      const cards = cardsData.data;

      for (const card of cards) {
        index.push({
          id: card.id,
          name: card.name,
          number: card.number,
          setId: card.set.id,
          setTotal: String(card.set.total),
        });
        total++;
      }

      if (cards.length < 250) break;
      page++;
      if (page > 20) break;
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`\n\nGenerated index with ${total} cards from ${sets.length} sets`);

  fs.writeFileSync(
    'public/card-index.json',
    JSON.stringify(index, null, 0) // No formatting to save space
  );

  const size = fs.statSync('public/card-index.json').size;
  console.log(`Saved to public/card-index.json (${(size / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
