
async function test() {
  const url = 'https://x.com';
  try {
    const start = Date.now();
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    console.log(`Status: ${res.status}`);
    console.log(`Latency: ${Date.now() - start}ms`);
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}
test();
