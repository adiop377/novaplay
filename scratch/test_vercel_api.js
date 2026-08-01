
const UIDS = ['2389147676', '2200345655', '7650572958'];

async function testVercelApi() {
    for (const uid of UIDS) {
        console.log(`Testing Vercel API for UID: ${uid}`);
        try {
            const start = Date.now();
            const response = await fetch(`https://freefire-api.vercel.app/api/info?uid=${uid}`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            const duration = Date.now() - start;
            console.log(`Status: ${response.status} (${duration}ms)`);
            if (response.ok) {
                const data = await response.json();
                console.log(`Success: ${data.nickname || 'No Nickname'}`);
                console.log(JSON.stringify(data, null, 2));
            } else {
                console.log(`Failed: ${response.statusText}`);
            }
        } catch (error) {
            console.log(`Error: ${error.message}`);
        }
        console.log('---');
    }
}

testVercelApi();
