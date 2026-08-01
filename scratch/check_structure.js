
async function testApiStructure() {
    const uid = '2389147676';
    try {
        const response = await fetch(`http://raw.sukhdaku.eu.cc/info/?uid=${uid}&region=IND`);
        if (response.ok) {
            const data = await response.json();
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (e) { console.error(e); }
}
testApiStructure();
