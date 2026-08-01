
const UIDS = ['2389147676', '2200345655', '7650572958', '1234567890'];

async function testApi() {
    for (const uid of UIDS) {
        console.log(`Testing UID: ${uid}`);
        try {
            const start = Date.now();
            const response = await fetch(`http://raw.sukhdaku.eu.cc/info/?uid=${uid}&region=IND`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            const duration = Date.now() - start;
            console.log(`Status: ${response.status} (${duration}ms)`);
            if (response.ok) {
                const data = await response.json();
                console.log(`Success: ${data.player_data?.nickname || 'No Nickname'}`);
            } else {
                console.log(`Failed: ${response.statusText}`);
            }
        } catch (error) {
            console.log(`Error: ${error.message}`);
        }
        console.log('---');
    }
}

testApi();
